package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/alfian/lumora/backend/internal/auth"
	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

// SessionTTL is how long a login stays valid without activity. Renewal/rolling
// expiry comes with the dashboard phase.
const SessionTTL = 30 * 24 * time.Hour

// UserStore is the slice of the sqlc store AuthService needs for accounts.
type UserStore interface {
	InsertUser(ctx context.Context, arg store.InsertUserParams) (store.User, error)
	GetUserByEmail(ctx context.Context, arg store.GetUserByEmailParams) (store.User, error)
	GetUserByID(ctx context.Context, arg store.GetUserByIDParams) (store.User, error)
}

// SessionStore is the slice of the sqlc store AuthService needs for sessions.
type SessionStore interface {
	InsertSession(ctx context.Context, arg store.InsertSessionParams) error
	GetSessionByToken(ctx context.Context, arg store.GetSessionByTokenParams) (store.GetSessionByTokenRow, error)
	DeleteSessionByToken(ctx context.Context, arg store.DeleteSessionByTokenParams) error
	DeleteExpiredSessions(ctx context.Context) error
}

type AuthService struct {
	users    UserStore
	sessions SessionStore

	// Indirections so tests can drive time and avoid real argon2 work.
	now      func() time.Time
	hash     func(password string) (string, error)
	verify   func(encoded, password string) (bool, error)
	newToken func() (string, error)
}

func NewAuthService(users UserStore, sessions SessionStore) *AuthService {
	return &AuthService{
		users:    users,
		sessions: sessions,
		now:      time.Now,
		hash:     auth.HashPassword,
		verify:   auth.VerifyPassword,
		newToken: auth.NewSessionToken,
	}
}

// Register creates an account and its first session. The caller receives the
// session token to put in a cookie.
func (s *AuthService) Register(ctx context.Context, params domain.RegisterParams) (domain.User, domain.Session, error) {
	if err := params.Validate(); err != nil {
		return domain.User{}, domain.Session{}, err
	}

	passwordHash, err := s.hash(params.Password)
	if err != nil {
		return domain.User{}, domain.Session{}, fmt.Errorf("hash password: %w", err)
	}

	row, err := s.users.InsertUser(ctx, store.InsertUserParams{
		Name:         params.Name,
		Email:        params.Email,
		PasswordHash: passwordHash,
		Role:         params.Role,
	})
	if isUniqueViolation(err) {
		return domain.User{}, domain.Session{}, domain.ErrEmailTaken
	}
	if err != nil {
		return domain.User{}, domain.Session{}, fmt.Errorf("insert user: %w", err)
	}

	user := toDomainUser(row)
	session, err := s.startSession(ctx, user.ID)
	if err != nil {
		return domain.User{}, domain.Session{}, err
	}
	return user, session, nil
}

// Login verifies credentials and opens a session. Unknown email and wrong
// password return the same error so the endpoint can't be used to enumerate
// accounts.
func (s *AuthService) Login(ctx context.Context, params domain.LoginParams) (domain.User, domain.Session, error) {
	if err := params.Validate(); err != nil {
		return domain.User{}, domain.Session{}, err
	}

	row, err := s.users.GetUserByEmail(ctx, store.GetUserByEmailParams{Email: params.Email})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, domain.Session{}, domain.ErrInvalidCredentials
	}
	if err != nil {
		return domain.User{}, domain.Session{}, fmt.Errorf("load user by email: %w", err)
	}

	match, err := s.verify(row.PasswordHash, params.Password)
	if err != nil {
		return domain.User{}, domain.Session{}, fmt.Errorf("verify password: %w", err)
	}
	if !match {
		return domain.User{}, domain.Session{}, domain.ErrInvalidCredentials
	}

	// Housekeeping: cheap indexed delete, failure only means stale rows stay.
	_ = s.sessions.DeleteExpiredSessions(ctx)

	user := toDomainUser(row)
	session, err := s.startSession(ctx, user.ID)
	if err != nil {
		return domain.User{}, domain.Session{}, err
	}
	return user, session, nil
}

// UserByToken resolves a session cookie to its account, or
// domain.ErrUnauthenticated when the token is unknown or expired.
func (s *AuthService) UserByToken(ctx context.Context, token string) (domain.User, error) {
	if token == "" {
		return domain.User{}, domain.ErrUnauthenticated
	}

	session, err := s.sessions.GetSessionByToken(ctx, store.GetSessionByTokenParams{Token: token})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, domain.ErrUnauthenticated
	}
	if err != nil {
		return domain.User{}, domain.ErrUnauthenticated
	}

	if !s.now().Before(session.ExpiresAt.Time) {
		_ = s.sessions.DeleteSessionByToken(ctx, store.DeleteSessionByTokenParams{Token: token})
		return domain.User{}, domain.ErrUnauthenticated
	}

	row, err := s.users.GetUserByID(ctx, store.GetUserByIDParams{ID: session.UserID})
	if errors.Is(err, pgx.ErrNoRows) {
		_ = s.sessions.DeleteSessionByToken(ctx, store.DeleteSessionByTokenParams{Token: token})
		return domain.User{}, domain.ErrUnauthenticated
	}
	if err != nil {
		return domain.User{}, domain.ErrUnauthenticated
	}

	return toDomainUser(row), nil
}

// Logout deletes the session. An empty token is a no-op: logging out without
// a session should still succeed from the user's point of view.
func (s *AuthService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	if err := s.sessions.DeleteSessionByToken(ctx, store.DeleteSessionByTokenParams{Token: token}); err != nil {
		return fmt.Errorf("delete session: %w", err)
	}
	return nil
}

func (s *AuthService) startSession(ctx context.Context, userID string) (domain.Session, error) {
	token, err := s.newToken()
	if err != nil {
		return domain.Session{}, err
	}

	expiresAt := s.now().Add(SessionTTL)
	err = s.sessions.InsertSession(ctx, store.InsertSessionParams{
		Token:     token,
		UserID:    parseID(userID),
		ExpiresAt: pgtype.Timestamptz{Time: expiresAt, Valid: true},
	})
	if err != nil {
		return domain.Session{}, fmt.Errorf("insert session: %w", err)
	}

	return domain.Session{Token: token, ExpiresAt: expiresAt}, nil
}

func toDomainUser(row store.User) domain.User {
	return domain.User{
		ID:        keyOf(row.ID),
		Name:      row.Name,
		Email:     row.Email,
		Role:      row.Role,
		CreatedAt: row.CreatedAt.Time,
	}
}

// isUniqueViolation reports whether err is a Postgres unique-constraint
// violation (23505), i.e. the email already exists.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
