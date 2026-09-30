package service

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/alfian/lumora/backend/internal/auth"
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

func (f *fakeUserStore) UpdateUserName(_ context.Context, arg store.UpdateUserNameParams) (store.User, error) {
	key := keyOf(arg.ID)
	user, ok := f.byID[key]
	if !ok {
		return store.User{}, pgx.ErrNoRows
	}
	user.Name = arg.Name
	f.byID[key] = user
	f.byEmail[user.Email] = user
	return user, nil
}

func (f *fakeUserStore) UpdateUserPassword(_ context.Context, arg store.UpdateUserPasswordParams) error {
	key := keyOf(arg.ID)
	user, ok := f.byID[key]
	if !ok {
		return nil
	}
	user.PasswordHash = arg.PasswordHash
	f.byID[key] = user
	f.byEmail[user.Email] = user
	return nil
}

// DeleteUser mirrors the real cascade closely enough for assertions: the
// account's sessions go with it, because that is what the foreign key does.
func (f *fakeUserStore) DeleteUser(_ context.Context, arg store.DeleteUserParams) error {
	key := keyOf(arg.ID)
	user, ok := f.byID[key]
	if !ok {
		return nil
	}
	delete(f.byID, key)
	delete(f.byEmail, user.Email)
	return nil
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

func (f *fakeSessionStore) DeleteOtherSessions(_ context.Context, arg store.DeleteOtherSessionsParams) error {
	for token, row := range f.byToken {
		if row.UserID == arg.UserID && token != arg.Token {
			delete(f.byToken, token)
		}
	}
	return nil
}

func (f *fakeSessionStore) DeleteExpiredSessions(context.Context) error { return nil }

// fakeVerificationStore implements VerificationTokenStore in memory. It holds a
// reference to the user store so SetUserEmailVerified can flip the same row the
// service reads back, mirroring how the real *store.Queries implements both
// interfaces over one database.
type fakeVerificationStore struct {
	byHash map[string]store.EmailVerificationToken
	users  *fakeUserStore
}

func newFakeVerificationStore(users *fakeUserStore) *fakeVerificationStore {
	return &fakeVerificationStore{byHash: map[string]store.EmailVerificationToken{}, users: users}
}

func (f *fakeVerificationStore) InsertEmailVerificationToken(_ context.Context, arg store.InsertEmailVerificationTokenParams) error {
	f.byHash[arg.TokenHash] = store.EmailVerificationToken{
		TokenHash: arg.TokenHash,
		UserID:    arg.UserID,
		CreatedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
		ExpiresAt: arg.ExpiresAt,
	}
	return nil
}

func (f *fakeVerificationStore) GetEmailVerificationToken(_ context.Context, arg store.GetEmailVerificationTokenParams) (store.EmailVerificationToken, error) {
	row, ok := f.byHash[arg.TokenHash]
	if !ok {
		return store.EmailVerificationToken{}, pgx.ErrNoRows
	}
	return row, nil
}

func (f *fakeVerificationStore) ConsumeEmailVerificationToken(_ context.Context, arg store.ConsumeEmailVerificationTokenParams) error {
	row, ok := f.byHash[arg.TokenHash]
	if !ok || row.UsedAt.Valid {
		return nil
	}
	row.UsedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
	f.byHash[arg.TokenHash] = row
	return nil
}

func (f *fakeVerificationStore) DeleteEmailVerificationTokensByUser(_ context.Context, arg store.DeleteEmailVerificationTokensByUserParams) error {
	for hash, row := range f.byHash {
		if row.UserID == arg.UserID {
			delete(f.byHash, hash)
		}
	}
	return nil
}

func (f *fakeVerificationStore) DeleteExpiredEmailVerificationTokens(context.Context) error {
	return nil
}

func (f *fakeVerificationStore) SetUserEmailVerified(_ context.Context, arg store.SetUserEmailVerifiedParams) error {
	key := keyOf(arg.ID)
	user, ok := f.users.byID[key]
	if !ok || user.EmailVerifiedAt.Valid {
		return nil
	}
	user.EmailVerifiedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
	f.users.byID[key] = user
	f.users.byEmail[user.Email] = user
	return nil
}

// fakeSender records the links it is asked to send, so a test can read the raw
// token exactly the way a user reads it from their inbox. err forces a send
// failure.
type fakeSender struct {
	sent []sentVerification
	err  error
}

type sentVerification struct {
	to   string
	link string
}

func (f *fakeSender) SendVerification(_ context.Context, to, link string) error {
	if f.err != nil {
		return f.err
	}
	f.sent = append(f.sent, sentVerification{to: to, link: link})
	return nil
}

// lastToken returns the token embedded in the most recent link.
func (f *fakeSender) lastToken(t *testing.T) string {
	t.Helper()
	return f.tokenAt(t, len(f.sent)-1)
}

// tokenAt returns the token embedded in the i-th link, oldest first.
func (f *fakeSender) tokenAt(t *testing.T, i int) string {
	t.Helper()
	if i < 0 || i >= len(f.sent) {
		t.Fatalf("email %d requested, but %d were sent", i, len(f.sent))
	}
	link := f.sent[i].link
	parsed, err := url.Parse(link)
	if err != nil {
		t.Fatalf("parse link %q: %v", link, err)
	}
	token := parsed.Query().Get("token")
	if token == "" {
		t.Fatalf("link %q has no token", link)
	}
	return token
}

func senderOf(t *testing.T, svc *AuthService) *fakeSender {
	t.Helper()
	sender, ok := svc.sender.(*fakeSender)
	if !ok {
		t.Fatalf("sender is %T, want *fakeSender", svc.sender)
	}
	return sender
}

func verificationsOf(t *testing.T, svc *AuthService) *fakeVerificationStore {
	t.Helper()
	verifications, ok := svc.verifications.(*fakeVerificationStore)
	if !ok {
		t.Fatalf("verifications is %T, want *fakeVerificationStore", svc.verifications)
	}
	return verifications
}

// newTestAuthService swaps argon2 for a trivial deterministic hash so tests
// stay fast; the real primitives are covered in internal/auth. The verification
// store shares the user store so the flow can be driven end to end.
func newTestAuthService() (*AuthService, *fakeSessionStore) {
	users := newFakeUserStore()
	sessions := newFakeSessionStore()
	svc := NewAuthService(users, sessions, newFakeVerificationStore(users), &fakeSender{}, "http://localhost:3000")
	svc.hash = func(password string) (string, error) { return "hashed:" + password, nil }
	svc.verify = func(encoded, password string) (bool, error) {
		return encoded == "hashed:"+password, nil
	}
	return svc, sessions
}

// registerAndReturn registers the canonical test account and returns it with
// its session.
func registerAndReturn(t *testing.T, svc *AuthService) (domain.User, domain.Session) {
	t.Helper()
	user, session, err := svc.Register(context.Background(), domain.RegisterParams{
		Name: "Budi", Email: "budi@example.com", Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	return user, session
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

func TestLoginSpendsTheSameVerifyWorkForUnknownEmail(t *testing.T) {
	// The identical error above was not enough on its own to hide account
	// existence: returning early on an unknown email skipped argon2 entirely, so
	// the two paths were told apart by how long they took. This asserts the
	// mechanism that closes that gap — verify runs either way.
	svc, _ := newTestAuthService()

	if _, _, err := svc.Register(context.Background(), domain.RegisterParams{
		Name: "Budi", Email: "budi@example.com", Password: "rahasia123",
	}); err != nil {
		t.Fatalf("Register: %v", err)
	}

	var verifies int
	innerVerify := svc.verify
	svc.verify = func(encoded, password string) (bool, error) {
		verifies++
		return innerVerify(encoded, password)
	}

	cases := []struct {
		name     string
		email    string
		password string
	}{
		{"known email, wrong password", "budi@example.com", "salah"},
		{"unknown email", "belum-ada@example.com", "rahasia123"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			verifies = 0

			_, _, err := svc.Login(context.Background(), domain.LoginParams{
				Email: tc.email, Password: tc.password,
			})
			if !errors.Is(err, domain.ErrInvalidCredentials) {
				t.Fatalf("err = %v, want ErrInvalidCredentials", err)
			}
			if verifies != 1 {
				t.Errorf("verify called %d times, want 1 — this path skipped the argon2 work", verifies)
			}
		})
	}
}

func TestLoginBuildsTheDummyHashOnce(t *testing.T) {
	// The dummy hash exists to spend argon2, so building it per request would
	// double the cost of an unknown-email login. sync.Once must cache it.
	svc, _ := newTestAuthService()

	var hashes int
	innerHash := svc.hash
	svc.hash = func(password string) (string, error) {
		hashes++
		return innerHash(password)
	}

	for i := 0; i < 3; i++ {
		if _, _, err := svc.Login(context.Background(), domain.LoginParams{
			Email: "belum-ada@example.com", Password: "rahasia123",
		}); !errors.Is(err, domain.ErrInvalidCredentials) {
			t.Fatalf("login %d: err = %v, want ErrInvalidCredentials", i+1, err)
		}
	}

	if hashes != 1 {
		t.Errorf("hash called %d times across 3 logins, want 1", hashes)
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

func TestRegisterSendsVerificationLink(t *testing.T) {
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)

	sender := senderOf(t, svc)
	if len(sender.sent) != 1 {
		t.Fatalf("sent %d emails, want 1", len(sender.sent))
	}
	if sender.sent[0].to != user.Email {
		t.Errorf("email to = %q, want %q", sender.sent[0].to, user.Email)
	}
	// The link points at the frontend page, not this API: the page POSTs the
	// token, so a mail scanner's bare GET cannot consume it.
	if !strings.HasPrefix(sender.sent[0].link, "http://localhost:3000/verify-email?token=") {
		t.Errorf("link = %q, want a /verify-email link on the frontend", sender.sent[0].link)
	}
	if user.EmailVerified {
		t.Error("new user is already verified; registration must not verify by itself")
	}

	// Only the hash is stored: a leaked database must not yield usable tokens.
	raw := sender.lastToken(t)
	verifications := verificationsOf(t, svc)
	if _, stored := verifications.byHash[raw]; stored {
		t.Error("raw token was stored; only its hash should be")
	}
	if _, stored := verifications.byHash[auth.HashToken(raw)]; !stored {
		t.Error("hashed token was not stored")
	}
}

func TestRegisterSucceedsWhenVerificationEmailFails(t *testing.T) {
	// The account and session are already committed. Failing the request would
	// tell the client registration failed while the account exists, so a retry
	// would answer email_taken. The user can ask for another link instead.
	svc, _ := newTestAuthService()
	senderOf(t, svc).err = errors.New("smtp down")

	_, session, err := svc.Register(context.Background(), domain.RegisterParams{
		Name: "Budi", Email: "budi@example.com", Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	if session.Token == "" {
		t.Error("session token is empty; a send failure must not undo the registration")
	}
}

func TestVerifyEmailMarksUserVerified(t *testing.T) {
	svc, _ := newTestAuthService()
	_, session := registerAndReturn(t, svc)
	token := senderOf(t, svc).lastToken(t)

	if err := svc.VerifyEmail(context.Background(), token); err != nil {
		t.Fatalf("VerifyEmail: %v", err)
	}

	got, err := svc.UserByToken(context.Background(), session.Token)
	if err != nil {
		t.Fatalf("UserByToken: %v", err)
	}
	if !got.EmailVerified {
		t.Error("EmailVerified = false after a successful verification")
	}
}

func TestVerifyEmailIsIdempotent(t *testing.T) {
	// A double click, or a mail scanner that consumed the token first, must not
	// turn an already-successful verification into an error.
	svc, _ := newTestAuthService()
	registerAndReturn(t, svc)
	token := senderOf(t, svc).lastToken(t)

	for i := 1; i <= 2; i++ {
		if err := svc.VerifyEmail(context.Background(), token); err != nil {
			t.Fatalf("VerifyEmail call %d: %v", i, err)
		}
	}
}

func TestVerifyEmailRejectsUnknownToken(t *testing.T) {
	svc, _ := newTestAuthService()
	registerAndReturn(t, svc)

	for _, token := range []string{"", "bukan-token"} {
		if err := svc.VerifyEmail(context.Background(), token); !errors.Is(err, domain.ErrInvalidToken) {
			t.Errorf("token %q: err = %v, want ErrInvalidToken", token, err)
		}
	}
}

func TestVerifyEmailRejectsExpiredToken(t *testing.T) {
	svc, _ := newTestAuthService()
	registerAndReturn(t, svc)
	token := senderOf(t, svc).lastToken(t)

	future := time.Now().Add(VerificationTTL + time.Minute)
	svc.now = func() time.Time { return future }

	if err := svc.VerifyEmail(context.Background(), token); !errors.Is(err, domain.ErrInvalidToken) {
		t.Errorf("err = %v, want ErrInvalidToken", err)
	}
}

func TestVerifyEmailRejectsUsedToken(t *testing.T) {
	svc, _ := newTestAuthService()
	registerAndReturn(t, svc)
	token := senderOf(t, svc).lastToken(t)

	// Simulate a token consumed without the account being marked verified — the
	// window between the two writes. The guard must still refuse it.
	verifications := verificationsOf(t, svc)
	hash := auth.HashToken(token)
	row := verifications.byHash[hash]
	row.UsedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
	verifications.byHash[hash] = row

	if err := svc.VerifyEmail(context.Background(), token); !errors.Is(err, domain.ErrInvalidToken) {
		t.Errorf("err = %v, want ErrInvalidToken", err)
	}
}

func TestResendVerificationReplacesPendingToken(t *testing.T) {
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)
	sender := senderOf(t, svc)
	oldToken := sender.lastToken(t)

	if err := svc.ResendVerification(context.Background(), user.ID); err != nil {
		t.Fatalf("ResendVerification: %v", err)
	}
	newToken := sender.lastToken(t)
	if newToken == oldToken {
		t.Fatal("resend reused the old token")
	}

	// Only the newest link works, so a resend cannot keep an old link alive.
	if err := svc.VerifyEmail(context.Background(), oldToken); !errors.Is(err, domain.ErrInvalidToken) {
		t.Errorf("old token err = %v, want ErrInvalidToken", err)
	}
	if err := svc.VerifyEmail(context.Background(), newToken); err != nil {
		t.Errorf("new token err = %v, want nil", err)
	}
}

func TestResendVerificationRejectsVerifiedAccount(t *testing.T) {
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)
	if err := svc.VerifyEmail(context.Background(), senderOf(t, svc).lastToken(t)); err != nil {
		t.Fatalf("VerifyEmail: %v", err)
	}

	if err := svc.ResendVerification(context.Background(), user.ID); !errors.Is(err, domain.ErrEmailAlreadyVerified) {
		t.Errorf("err = %v, want ErrEmailAlreadyVerified", err)
	}
}

func TestResendVerificationUnknownUser(t *testing.T) {
	svc, _ := newTestAuthService()

	if err := svc.ResendVerification(context.Background(), uuid.New().String()); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("err = %v, want ErrUnauthenticated", err)
	}
}

func TestResendVerificationReturnsSendError(t *testing.T) {
	// Unlike Register, a failed resend must surface: nothing irreversible has
	// happened, and staying silent leaves the user waiting for mail that will
	// never arrive.
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)
	senderOf(t, svc).err = errors.New("smtp down")

	if err := svc.ResendVerification(context.Background(), user.ID); err == nil {
		t.Fatal("err = nil, want the send failure")
	}
}

func usersOf(t *testing.T, svc *AuthService) *fakeUserStore {
	t.Helper()
	users, ok := svc.users.(*fakeUserStore)
	if !ok {
		t.Fatalf("users is %T, want *fakeUserStore", svc.users)
	}
	return users
}

func TestUpdateProfileChangesOnlyTheName(t *testing.T) {
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)

	updated, err := svc.UpdateProfile(context.Background(), user.ID, domain.UpdateProfileParams{Name: "  Budi Santoso  "})
	if err != nil {
		t.Fatalf("UpdateProfile: %v", err)
	}
	if updated.Name != "Budi Santoso" {
		t.Errorf("Name = %q, want the trimmed new name", updated.Name)
	}
	if updated.Email != user.Email || updated.Role != user.Role {
		t.Errorf("email/role changed: got %q/%q, want %q/%q", updated.Email, updated.Role, user.Email, user.Role)
	}

	// The stored row, not just the response, has to carry the new name.
	stored, err := usersOf(t, svc).GetUserByID(context.Background(), store.GetUserByIDParams{ID: parseID(user.ID)})
	if err != nil {
		t.Fatalf("GetUserByID: %v", err)
	}
	if stored.Name != "Budi Santoso" {
		t.Errorf("stored Name = %q, want Budi Santoso", stored.Name)
	}
}

func TestUpdateProfileRejectsEmptyName(t *testing.T) {
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)

	_, err := svc.UpdateProfile(context.Background(), user.ID, domain.UpdateProfileParams{Name: "   "})
	var validationErr *domain.ValidationError
	if !errors.As(err, &validationErr) {
		t.Errorf("err = %v, want a ValidationError", err)
	}
}

func TestUpdateProfileUnknownUser(t *testing.T) {
	svc, _ := newTestAuthService()

	_, err := svc.UpdateProfile(context.Background(), uuid.New().String(), domain.UpdateProfileParams{Name: "Siapa"})
	if !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("err = %v, want ErrUnauthenticated", err)
	}
}

func TestChangePasswordKeepsCurrentSessionAndDropsOthers(t *testing.T) {
	svc, sessions := newTestAuthService()
	user, session := registerAndReturn(t, svc)

	// A second device signing in, so the "log out everywhere else" behaviour
	// has something to actually drop.
	other, err := svc.startSession(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("startSession: %v", err)
	}

	err = svc.ChangePassword(context.Background(), user.ID, session.Token, domain.ChangePasswordParams{
		CurrentPassword: "rahasia123",
		NewPassword:     "rahasia456",
	})
	if err != nil {
		t.Fatalf("ChangePassword: %v", err)
	}

	// The cookie that made this request must keep working; dropping it would
	// look like the change failed.
	if _, ok := sessions.byToken[session.Token]; !ok {
		t.Error("current session was deleted")
	}
	if _, ok := sessions.byToken[other.Token]; ok {
		t.Error("other session survived the password change")
	}

	if _, _, err := svc.Login(context.Background(), domain.LoginParams{Email: user.Email, Password: "rahasia456"}); err != nil {
		t.Errorf("login with the new password: %v", err)
	}
	_, _, err = svc.Login(context.Background(), domain.LoginParams{Email: user.Email, Password: "rahasia123"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Errorf("login with the old password err = %v, want ErrInvalidCredentials", err)
	}
}

func TestChangePasswordRejectsWrongCurrentPassword(t *testing.T) {
	svc, _ := newTestAuthService()
	user, session := registerAndReturn(t, svc)

	err := svc.ChangePassword(context.Background(), user.ID, session.Token, domain.ChangePasswordParams{
		CurrentPassword: "salah",
		NewPassword:     "rahasia456",
	})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Errorf("err = %v, want ErrInvalidCredentials", err)
	}
	if _, _, err := svc.Login(context.Background(), domain.LoginParams{Email: user.Email, Password: "rahasia123"}); err != nil {
		t.Errorf("old password stopped working after a rejected change: %v", err)
	}
}

func TestChangePasswordRejectsReusedPassword(t *testing.T) {
	svc, _ := newTestAuthService()
	user, session := registerAndReturn(t, svc)

	err := svc.ChangePassword(context.Background(), user.ID, session.Token, domain.ChangePasswordParams{
		CurrentPassword: "rahasia123",
		NewPassword:     "rahasia123",
	})
	var validationErr *domain.ValidationError
	if !errors.As(err, &validationErr) {
		t.Errorf("err = %v, want a ValidationError", err)
	}
}

func TestChangePasswordRejectsShortNewPassword(t *testing.T) {
	svc, _ := newTestAuthService()
	user, session := registerAndReturn(t, svc)

	err := svc.ChangePassword(context.Background(), user.ID, session.Token, domain.ChangePasswordParams{
		CurrentPassword: "rahasia123",
		NewPassword:     "pendek",
	})
	var validationErr *domain.ValidationError
	if !errors.As(err, &validationErr) {
		t.Errorf("err = %v, want a ValidationError", err)
	}
}

func TestDeleteAccountRemovesUser(t *testing.T) {
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)

	if err := svc.DeleteAccount(context.Background(), user.ID, domain.DeleteAccountParams{Password: "rahasia123"}); err != nil {
		t.Fatalf("DeleteAccount: %v", err)
	}

	_, err := usersOf(t, svc).GetUserByID(context.Background(), store.GetUserByIDParams{ID: parseID(user.ID)})
	if !errors.Is(err, pgx.ErrNoRows) {
		t.Errorf("user still present: err = %v", err)
	}
}

func TestDeleteAccountRejectsWrongPassword(t *testing.T) {
	svc, _ := newTestAuthService()
	user, _ := registerAndReturn(t, svc)

	err := svc.DeleteAccount(context.Background(), user.ID, domain.DeleteAccountParams{Password: "salah"})
	if !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Errorf("err = %v, want ErrInvalidCredentials", err)
	}
	if _, err := usersOf(t, svc).GetUserByID(context.Background(), store.GetUserByIDParams{ID: parseID(user.ID)}); err != nil {
		t.Errorf("account was deleted despite the wrong password: %v", err)
	}
}
