package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

type fakeUserStore struct {
	byEmail map[string]store.User
	byID    map[string]store.User
}

func newFakeUserStore() *fakeUserStore {
	return &fakeUserStore{
		byEmail: map[string]store.User{},
		byID:    map[string]store.User{},
	}
}

func (f *fakeUserStore) InsertUser(_ context.Context, arg store.InsertUserParams) (store.User, error) {
	if _, exists := f.byEmail[arg.Email]; exists {
		return store.User{}, &pgconn.PgError{Code: "23505"}
	}
	id := uuid.New()
	user := store.User{
		ID:           pgtype.UUID{Bytes: id, Valid: true},
		Name:         arg.Name,
		Email:        arg.Email,
		PasswordHash: arg.PasswordHash,
		Role:         arg.Role,
		CreatedAt:    pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}
	f.byEmail[arg.Email] = user
	f.byID[keyOf(user.ID)] = user
	return user, nil
}

func (f *fakeUserStore) GetUserByEmail(_ context.Context, arg store.GetUserByEmailParams) (store.User, error) {
	user, ok := f.byEmail[arg.Email]
	if !ok {
		return store.User{}, pgx.ErrNoRows
	}
	return user, nil
}

func (f *fakeUserStore) GetUserByID(_ context.Context, arg store.GetUserByIDParams) (store.User, error) {
	user, ok := f.byID[keyOf(arg.ID)]
	if !ok {
		return store.User{}, pgx.ErrNoRows
	}
	return user, nil
}

type fakeSessionStore struct {
	byToken map[string]store.GetSessionByTokenRow
}

func newFakeSessionStore() *fakeSessionStore {
	return &fakeSessionStore{byToken: map[string]store.GetSessionByTokenRow{}}
}

func (f *fakeSessionStore) InsertSession(_ context.Context, arg store.InsertSessionParams) error {
	f.byToken[arg.Token] = store.GetSessionByTokenRow{
		Token:     arg.Token,
		UserID:    arg.UserID,
		ExpiresAt: arg.ExpiresAt,
	}
	return nil
}

func (f *fakeSessionStore) GetSessionByToken(_ context.Context, arg store.GetSessionByTokenParams) (store.GetSessionByTokenRow, error) {
	row, ok := f.byToken[arg.Token]
	if !ok {
		return store.GetSessionByTokenRow{}, pgx.ErrNoRows
	}
	return row, nil
}

func (f *fakeSessionStore) DeleteSessionByToken(_ context.Context, arg store.DeleteSessionByTokenParams) error {
	delete(f.byToken, arg.Token)
	return nil
}

func (f *fakeSessionStore) DeleteExpiredSessions(context.Context) error { return nil }

// newTestAuthService swaps argon2 for a trivial deterministic hash so tests
// stay fast; the real primitives are covered in internal/auth.
func newTestAuthService() (*AuthService, *fakeSessionStore) {
	users := newFakeUserStore()
	sessions := newFakeSessionStore()
	svc := NewAuthService(users, sessions)
	svc.hash = func(password string) (string, error) { return "hashed:" + password, nil }
	svc.verify = func(encoded, password string) (bool, error) {
		return encoded == "hashed:"+password, nil
	}
	return svc, sessions
}

func TestRegisterOpensSessionForNewUser(t *testing.T) {
	svc, _ := newTestAuthService()

	user, session, err := svc.Register(context.Background(), domain.RegisterParams{
		Name:     "Budi Santoso",
		Email:    "Budi@Example.com",
		Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	if user.Email != "budi@example.com" {
		t.Errorf("email = %q, want normalized %q", user.Email, "budi@example.com")
	}
	if user.Role != domain.RoleUMKM {
		t.Errorf("role = %q, want default %q", user.Role, domain.RoleUMKM)
	}
	if session.Token == "" {
		t.Fatal("session token is empty")
	}

	got, err := svc.UserByToken(context.Background(), session.Token)
	if err != nil {
		t.Fatalf("UserByToken: %v", err)
	}
	if got.ID != user.ID {
		t.Errorf("session resolved user %q, want %q", got.ID, user.ID)
	}
}

func TestRegisterDuplicateEmailIsCaseInsensitive(t *testing.T) {
	svc, _ := newTestAuthService()

	params := domain.RegisterParams{Name: "Budi", Email: "budi@example.com", Password: "rahasia123"}
	if _, _, err := svc.Register(context.Background(), params); err != nil {
		t.Fatalf("first Register: %v", err)
	}

	params.Email = "BUDI@example.com"
	_, _, err := svc.Register(context.Background(), params)
	if !errors.Is(err, domain.ErrEmailTaken) {
		t.Errorf("err = %v, want domain.ErrEmailTaken", err)
	}
}

func TestRegisterValidation(t *testing.T) {
	svc, _ := newTestAuthService()

	cases := []struct {
		name   string
		params domain.RegisterParams
	}{
		{"invalid email", domain.RegisterParams{Name: "Budi", Email: "bukan-email", Password: "rahasia123"}},
		{"short password", domain.RegisterParams{Name: "Budi", Email: "budi@example.com", Password: "pendek"}},
		{"empty name", domain.RegisterParams{Name: "  ", Email: "budi@example.com", Password: "rahasia123"}},
		{"bad role", domain.RegisterParams{Name: "Budi", Email: "budi@example.com", Password: "rahasia123", Role: "admin"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, _, err := svc.Register(context.Background(), tc.params)
			var validationErr *domain.ValidationError
			if !errors.As(err, &validationErr) {
				t.Errorf("err = %v, want *domain.ValidationError", err)
			}
		})
	}
}

func TestLoginFailureModesAreIndistinguishable(t *testing.T) {
	svc, _ := newTestAuthService()

	if _, _, err := svc.Register(context.Background(), domain.RegisterParams{
		Name: "Budi", Email: "budi@example.com", Password: "rahasia123",
	}); err != nil {
		t.Fatalf("Register: %v", err)
	}

	_, _, wrongPassword := svc.Login(context.Background(), domain.LoginParams{
		Email: "budi@example.com", Password: "salah",
	})
	_, _, unknownEmail := svc.Login(context.Background(), domain.LoginParams{
		Email: "belum ada", Password: "rahasia123",
	})

	if !errors.Is(wrongPassword, domain.ErrInvalidCredentials) {
		t.Errorf("wrong password err = %v, want ErrInvalidCredentials", wrongPassword)
	}
	if !errors.Is(unknownEmail, domain.ErrInvalidCredentials) {
		t.Errorf("unknown email err = %v, want ErrInvalidCredentials", unknownEmail)
	}
}

func TestLoginLogoutInvalidatesSession(t *testing.T) {
	svc, sessions := newTestAuthService()

	if _, _, err := svc.Register(context.Background(), domain.RegisterParams{
		Name: "Budi", Email: "budi@example.com", Password: "rahasia123",
	}); err != nil {
		t.Fatalf("Register: %v", err)
	}

	_, session, err := svc.Login(context.Background(), domain.LoginParams{
		Email: "budi@example.com", Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if len(sessions.byToken) != 2 {
		t.Errorf("sessions stored = %d, want 2", len(sessions.byToken))
	}

	if err := svc.Logout(context.Background(), session.Token); err != nil {
		t.Fatalf("Logout: %v", err)
	}
	if _, err := svc.UserByToken(context.Background(), session.Token); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("UserByToken after logout err = %v, want ErrUnauthenticated", err)
	}
}

func TestExpiredSessionIsRejectedAndDeleted(t *testing.T) {
	svc, sessions := newTestAuthService()

	_, session, err := svc.Register(context.Background(), domain.RegisterParams{
		Name: "Budi", Email: "budi@example.com", Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}

	future := time.Now().Add(SessionTTL + time.Minute)
	svc.now = func() time.Time { return future }

	if _, err := svc.UserByToken(context.Background(), session.Token); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("err = %v, want ErrUnauthenticated", err)
	}
	if _, stored := sessions.byToken[session.Token]; stored {
		t.Error("expired session was not deleted")
	}
}

func TestUserByTokenUnknownToken(t *testing.T) {
	svc, _ := newTestAuthService()

	if _, err := svc.UserByToken(context.Background(), ""); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("empty token err = %v, want ErrUnauthenticated", err)
	}
	if _, err := svc.UserByToken(context.Background(), "ngasal"); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("unknown token err = %v, want ErrUnauthenticated", err)
	}
}
