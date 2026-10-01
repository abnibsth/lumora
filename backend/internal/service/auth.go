package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"strings"
	"sync"
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

// VerificationTTL is how long an emailed verification link stays usable. Long
// enough that someone who reads their mail the next morning is not locked out,
// short enough that a leaked link expires on its own.
const VerificationTTL = 24 * time.Hour

// UserStore is the slice of the sqlc store AuthService needs for accounts.
type UserStore interface {
	InsertUser(ctx context.Context, arg store.InsertUserParams) (store.User, error)
	GetUserByEmail(ctx context.Context, arg store.GetUserByEmailParams) (store.User, error)
	GetUserByID(ctx context.Context, arg store.GetUserByIDParams) (store.User, error)
	UpdateUserName(ctx context.Context, arg store.UpdateUserNameParams) (store.User, error)
	UpdateUserPassword(ctx context.Context, arg store.UpdateUserPasswordParams) error
	DeleteUser(ctx context.Context, arg store.DeleteUserParams) error
}

// SessionStore is the slice of the sqlc store AuthService needs for sessions.
type SessionStore interface {
	InsertSession(ctx context.Context, arg store.InsertSessionParams) error
	GetSessionByToken(ctx context.Context, arg store.GetSessionByTokenParams) (store.GetSessionByTokenRow, error)
	DeleteSessionByToken(ctx context.Context, arg store.DeleteSessionByTokenParams) error
	DeleteOtherSessions(ctx context.Context, arg store.DeleteOtherSessionsParams) error
	DeleteExpiredSessions(ctx context.Context) error
}

// VerificationTokenStore is the slice of the sqlc store AuthService needs for
// email verification.
type VerificationTokenStore interface {
	InsertEmailVerificationToken(ctx context.Context, arg store.InsertEmailVerificationTokenParams) error
	GetEmailVerificationToken(ctx context.Context, arg store.GetEmailVerificationTokenParams) (store.EmailVerificationToken, error)
	ConsumeEmailVerificationToken(ctx context.Context, arg store.ConsumeEmailVerificationTokenParams) error
	DeleteEmailVerificationTokensByUser(ctx context.Context, arg store.DeleteEmailVerificationTokensByUserParams) error
	DeleteExpiredEmailVerificationTokens(ctx context.Context) error
	SetUserEmailVerified(ctx context.Context, arg store.SetUserEmailVerifiedParams) error
}

type AuthService struct {
	users         UserStore
	sessions      SessionStore
	verifications VerificationTokenStore
	sender        VerificationSender
	// frontendBaseURL is where the emailed link points. It is the frontend, not
	// this API: the page collects the token and POSTs it, so a mail scanner's
	// bare GET cannot consume the token before the user clicks.
	frontendBaseURL string

	// Indirections so tests can drive time and avoid real argon2 work.
	now      func() time.Time
	hash     func(password string) (string, error)
	verify   func(encoded, password string) (bool, error)
	newToken func() (string, error)
	// Kept separate from newToken so the verification flow can be driven
	// deterministically in tests without touching session behaviour.
	newVerificationToken func() (string, error)
	hashToken            func(token string) string

	// dummyOnce guards building dummyHash, which Login verifies against when
	// the email is unknown so that both paths cost the same argon2 work. Built
	// lazily through hash — never in the constructor — so startup pays nothing
	// and tests that inject a fake hash pay nothing either. sync.Once supplies
	// the happens-before edge needed to read dummyHash afterwards.
	dummyOnce sync.Once
	dummyHash string
}

func NewAuthService(users UserStore, sessions SessionStore, verifications VerificationTokenStore, sender VerificationSender, frontendBaseURL string) *AuthService {
	return &AuthService{
		users:                users,
		sessions:             sessions,
		verifications:        verifications,
		sender:               sender,
		frontendBaseURL:      strings.TrimRight(frontendBaseURL, "/"),
		now:                  time.Now,
		hash:                 auth.HashPassword,
		verify:               auth.VerifyPassword,
		newToken:             auth.NewSessionToken,
		newVerificationToken: auth.NewVerificationToken,
		hashToken:            auth.HashToken,
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

	// Best effort. The account and session are already committed, so failing the
	// request here would tell the client registration failed while the account
	// exists — and a retry would then answer email_taken. The user can ask for
	// another link instead, so the failure is logged rather than returned.
	if err := s.issueVerification(ctx, row); err != nil {
		slog.Error("send verification email failed", "user_id", user.ID, "err", err)
	}

	return user, session, nil
}

// Login verifies credentials and opens a session. Unknown email and wrong
// password return the same error AND do the same work, so the endpoint can't be
// used to enumerate accounts — neither by the response body nor by how long it
// takes. The identical error alone was not enough: returning early on an
// unknown email skipped argon2 entirely, leaving the two paths trivially
// distinguishable by timing. See payDummyVerify.
func (s *AuthService) Login(ctx context.Context, params domain.LoginParams) (domain.User, domain.Session, error) {
	if err := params.Validate(); err != nil {
		return domain.User{}, domain.Session{}, err
	}

	row, err := s.users.GetUserByEmail(ctx, store.GetUserByEmailParams{Email: params.Email})
	if errors.Is(err, pgx.ErrNoRows) {
		s.payDummyVerify(params.Password)
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

// payDummyVerify spends the argon2 work that a known email would have spent, so
// an unknown email and a wrong password cannot be told apart by response time.
//
// The hash is derived from s.hash rather than hardcoded so it tracks the
// configured argon2 parameters: raising them raises this cost too, and the
// timing gap cannot silently reappear. A hash failure leaves dummyHash empty and
// the verify is skipped — that degrades to the old behaviour instead of failing
// a login that has already failed.
func (s *AuthService) payDummyVerify(password string) {
	s.dummyOnce.Do(func() {
		if encoded, err := s.hash("lumora-timing-equalizer"); err == nil {
			s.dummyHash = encoded
		}
	})
	if s.dummyHash == "" {
		return
	}
	// Always false for any password that is not the dummy's: the point is the
	// work, not the answer.
	_, _ = s.verify(s.dummyHash, password)
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

// issueVerification mints a verification token for the account, stores its hash,
// and hands the raw token to the sender inside a link. Shared by Register and
// ResendVerification so both produce the same kind of token and link.
//
// Only the hash is stored; the raw token exists solely in the email, so a leaked
// database cannot be replayed against the API.
func (s *AuthService) issueVerification(ctx context.Context, user store.User) error {
	raw, err := s.newVerificationToken()
	if err != nil {
		return err
	}

	if err := s.verifications.InsertEmailVerificationToken(ctx, store.InsertEmailVerificationTokenParams{
		TokenHash: s.hashToken(raw),
		UserID:    user.ID,
		ExpiresAt: pgtype.Timestamptz{Time: s.now().Add(VerificationTTL), Valid: true},
	}); err != nil {
		return fmt.Errorf("insert verification token: %w", err)
	}

	link := fmt.Sprintf("%s/verify-email?token=%s", s.frontendBaseURL, url.QueryEscape(raw))
	if err := s.sender.SendVerification(ctx, user.Email, link); err != nil {
		// Every provider failure collapses into one retryable sentinel, the
		// same way AI failures collapse into domain.ErrAIUnavailable. The cause
		// still rides along in the second %w so logs can tell an exhausted
		// quota from a network fault, while the message to the client stays
		// a single code.
		return fmt.Errorf("send verification email: %w: %w", domain.ErrEmailUnavailable, err)
	}
	return nil
}

// VerifyEmail marks the account behind token as verified.
//
// It is idempotent: a second call for an already-verified account succeeds.
// That is what makes a double click — or a mail scanner that consumed the token
// first — harmless rather than a confusing "already used" error.
func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	if token == "" {
		return domain.ErrInvalidToken
	}

	row, err := s.verifications.GetEmailVerificationToken(ctx, store.GetEmailVerificationTokenParams{
		TokenHash: s.hashToken(token),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrInvalidToken
	}
	if err != nil {
		return fmt.Errorf("load verification token: %w", err)
	}

	user, err := s.users.GetUserByID(ctx, store.GetUserByIDParams{ID: row.UserID})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrInvalidToken
	}
	if err != nil {
		return fmt.Errorf("load user for verification: %w", err)
	}
	// Checked before expiry/used on purpose: once the account is verified the
	// link has done its job, so a later click still succeeds.
	if user.EmailVerifiedAt.Valid {
		return nil
	}

	if row.UsedAt.Valid || !s.now().Before(row.ExpiresAt.Time) {
		return domain.ErrInvalidToken
	}

	if err := s.verifications.ConsumeEmailVerificationToken(ctx, store.ConsumeEmailVerificationTokenParams{
		TokenHash: row.TokenHash,
	}); err != nil {
		return fmt.Errorf("consume verification token: %w", err)
	}
	if err := s.verifications.SetUserEmailVerified(ctx, store.SetUserEmailVerifiedParams{
		ID: row.UserID,
	}); err != nil {
		return fmt.Errorf("mark user verified: %w", err)
	}

	// Housekeeping, like DeleteExpiredSessions in Login: a failure only means
	// stale rows stay behind.
	_ = s.verifications.DeleteExpiredEmailVerificationTokens(ctx)

	return nil
}

// ResendVerification issues a fresh link for the signed-in account, replacing
// any pending one.
//
// Unlike Register it returns the send error: nothing irreversible happened, and
// staying silent would leave the user waiting for mail that is never coming.
func (s *AuthService) ResendVerification(ctx context.Context, userID string) error {
	row, err := s.users.GetUserByID(ctx, store.GetUserByIDParams{ID: parseID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrUnauthenticated
	}
	if err != nil {
		return fmt.Errorf("load user: %w", err)
	}
	if row.EmailVerifiedAt.Valid {
		return domain.ErrEmailAlreadyVerified
	}

	// Drop pending tokens first: only the newest link should work, so a resend
	// cannot be used to keep an old link alive.
	if err := s.verifications.DeleteEmailVerificationTokensByUser(ctx, store.DeleteEmailVerificationTokensByUserParams{
		UserID: row.ID,
	}); err != nil {
		return fmt.Errorf("clear verification tokens: %w", err)
	}
	return s.issueVerification(ctx, row)
}

// UpdateProfile changes the account's display name. Email and role are
// deliberately not editable here: email is the login identity and a UNIQUE
// column, and role is a trust field an account must not raise for itself.
func (s *AuthService) UpdateProfile(ctx context.Context, userID string, params domain.UpdateProfileParams) (domain.User, error) {
	if err := params.Validate(); err != nil {
		return domain.User{}, err
	}

	row, err := s.users.UpdateUserName(ctx, store.UpdateUserNameParams{
		ID:   parseID(userID),
		Name: params.Name,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.User{}, domain.ErrUnauthenticated
	}
	if err != nil {
		return domain.User{}, fmt.Errorf("update user name: %w", err)
	}
	return toDomainUser(row), nil
}

// ChangePassword re-hashes the new password and signs out every other device.
//
// The caller's own session is spared: invalidating the cookie that made this
// request would look like the change failed. Every other session is dropped
// because a password change is exactly what someone does when they suspect a
// device they no longer control is signed in.
func (s *AuthService) ChangePassword(ctx context.Context, userID, currentToken string, params domain.ChangePasswordParams) error {
	if err := params.Validate(); err != nil {
		return err
	}

	row, err := s.requirePassword(ctx, userID, params.CurrentPassword)
	if err != nil {
		return err
	}

	// Costs a second argon2 verify, but "that is already your password" beats a
	// silent no-op that reads as a successful change.
	reused, err := s.verify(row.PasswordHash, params.NewPassword)
	if err != nil {
		return fmt.Errorf("verify new password: %w", err)
	}
	if reused {
		return &domain.ValidationError{Message: "Kata sandi baru harus berbeda dari kata sandi saat ini."}
	}

	hashed, err := s.hash(params.NewPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}
	if err := s.users.UpdateUserPassword(ctx, store.UpdateUserPasswordParams{
		ID:           row.ID,
		PasswordHash: hashed,
	}); err != nil {
		return fmt.Errorf("update password: %w", err)
	}

	if err := s.sessions.DeleteOtherSessions(ctx, store.DeleteOtherSessionsParams{
		UserID: row.ID,
		Token:  currentToken,
	}); err != nil {
		return fmt.Errorf("delete other sessions: %w", err)
	}
	return nil
}

// DeleteAccount removes the account after proving the caller knows its
// password. Deleting is irreversible, so a session alone must not be enough —
// otherwise a stolen cookie could destroy the account.
//
// One DELETE is all it takes: sessions, verification tokens, bookmarks, and
// the account's own profiles all hang off foreign keys that cascade, and the
// profiles take their milestones, BMC blocks, and other users' bookmarks with
// them.
func (s *AuthService) DeleteAccount(ctx context.Context, userID string, params domain.DeleteAccountParams) error {
	if err := params.Validate(); err != nil {
		return err
	}

	row, err := s.requirePassword(ctx, userID, params.Password)
	if err != nil {
		return err
	}

	if err := s.users.DeleteUser(ctx, store.DeleteUserParams{ID: row.ID}); err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	return nil
}

// requirePassword loads the account and proves the caller knows its password.
// Shared by ChangePassword and DeleteAccount, the two endpoints that gate an
// irreversible or security-sensitive change behind re-authentication.
func (s *AuthService) requirePassword(ctx context.Context, userID, password string) (store.User, error) {
	row, err := s.users.GetUserByID(ctx, store.GetUserByIDParams{ID: parseID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return store.User{}, domain.ErrUnauthenticated
	}
	if err != nil {
		return store.User{}, fmt.Errorf("load user: %w", err)
	}

	match, err := s.verify(row.PasswordHash, password)
	if err != nil {
		return store.User{}, fmt.Errorf("verify password: %w", err)
	}
	if !match {
		return store.User{}, domain.ErrInvalidCredentials
	}
	return row, nil
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
		ID:            keyOf(row.ID),
		Name:          row.Name,
		Email:         row.Email,
		Role:          row.Role,
		CreatedAt:     row.CreatedAt.Time,
		EmailVerified: row.EmailVerifiedAt.Valid,
	}
}

// isUniqueViolation reports whether err is a Postgres unique-constraint
// violation (23505), i.e. the email already exists.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
