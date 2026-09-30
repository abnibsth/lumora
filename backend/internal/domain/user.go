package domain

import (
	"errors"
	"strings"
	"time"
)

// Sentinel auth errors, matched with errors.Is by the HTTP layer.
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email taken")
	ErrUnauthenticated    = errors.New("unauthenticated")
	// ErrInvalidToken covers an unknown, expired, or already-spent verification
	// token. One error for all three because the token is unguessable, so
	// telling a caller which case it hit buys nothing.
	ErrInvalidToken = errors.New("invalid or expired verification token")
	// ErrEmailAlreadyVerified is returned when a resend is asked for an address
	// that is already verified.
	ErrEmailAlreadyVerified = errors.New("email already verified")
)

// Roles mirrors the CHECK constraint on users.role.
const (
	RoleUMKM  = "umkm"
	RoleMitra = "mitra"
)

func ValidRole(role string) bool {
	return role == RoleUMKM || role == RoleMitra
}

// ValidationError is a user-facing validation failure; its message is safe to
// show as-is in the API error envelope.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string { return e.Message }

func invalid(message string) error { return &ValidationError{Message: message} }

// User is the public account shape. Password hash never leaves the service.
type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
	// EmailVerified gates the endpoints listed in docs/api.md. It is exposed as
	// a boolean rather than the underlying timestamp: the frontend only needs
	// yes/no to decide what to show. Named "emailVerified" so it does not read
	// as the "verified" badge that businesses carry.
	EmailVerified bool `json:"emailVerified"`
}

// SessionCookieName is the httpOnly cookie carrying Session.Token. Shared by
// the handler (set/clear) and the middleware (read).
const SessionCookieName = "lumora_session"

// Session is a server-side login. Token is what travels in the cookie.
type Session struct {
	Token     string
	ExpiresAt time.Time
}

// RegisterParams is the validated POST /auth/register body.
type RegisterParams struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// LoginParams is the validated POST /auth/login body.
type LoginParams struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

const (
	// MinPasswordLength matches the minLength=8 on the frontend form.
	MinPasswordLength = 8
	// MaxPasswordLength caps input before hashing so the endpoint can't be
	// used to burn CPU with absurd payloads.
	MaxPasswordLength = 128
)

// Validate normalizes and checks the register payload.
func (p *RegisterParams) Validate() error {
	p.Name = strings.TrimSpace(p.Name)
	p.Email = strings.ToLower(strings.TrimSpace(p.Email))

	if p.Name == "" {
		return invalid("Nama wajib diisi.")
	}
	if len(p.Name) > 100 {
		return invalid("Nama maksimal 100 karakter.")
	}
	if err := validateEmail(p.Email); err != nil {
		return err
	}
	if err := validatePasswordLength(p.Password); err != nil {
		return err
	}
	if p.Role == "" {
		p.Role = RoleUMKM
	}
	if !ValidRole(p.Role) {
		return invalid("Role harus umkm atau mitra.")
	}
	return nil
}

// Validate normalizes and checks the login payload.
func (p *LoginParams) Validate() error {
	p.Email = strings.ToLower(strings.TrimSpace(p.Email))
	if p.Email == "" {
		return invalid("Email wajib diisi.")
	}
	if p.Password == "" {
		return invalid("Kata sandi wajib diisi.")
	}
	return nil
}

func validateEmail(email string) error {
	if email == "" {
		return invalid("Email wajib diisi.")
	}
	if len(email) > 254 {
		return invalid("Email terlalu panjang.")
	}
	at := strings.Index(email, "@")
	if at <= 0 || at == len(email)-1 || strings.Count(email, "@") != 1 {
		return invalid("Format email tidak valid.")
	}
	domainPart := email[at+1:]
	if !strings.Contains(domainPart, ".") || strings.HasPrefix(domainPart, ".") || strings.HasSuffix(domainPart, ".") {
		return invalid("Format email tidak valid.")
	}
	return nil
}

func validatePasswordLength(password string) error {
	if len(password) < MinPasswordLength {
		return invalid("Kata sandi minimal 8 karakter.")
	}
	if len(password) > MaxPasswordLength {
		return invalid("Kata sandi maksimal 128 karakter.")
	}
	return nil
}
