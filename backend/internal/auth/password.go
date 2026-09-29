// Package auth holds credential primitives: argon2id password hashing and
// session token generation. No I/O lives here.
package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	argonMemory      = 64 * 1024 // 64 MB
	argonIterations  = 1
	argonParallelism = 4
	argonSaltLength  = 16
	argonKeyLength   = 32

	// MaxPasswordLength is enforced before hashing so a huge payload can't be
	// used to burn CPU. Matches domain.MaxPasswordLength.
	MaxPasswordLength = 128

	// SessionTokenLength is the raw byte count behind a session cookie; 32
	// bytes = 256 bits of entropy.
	SessionTokenLength = 32
)

// HashPassword returns an encoded PHC-style string:
// $argon2id$v=19$m=65536,t=1,p=4$<salt>$<hash>
func HashPassword(password string) (string, error) {
	if len(password) > MaxPasswordLength {
		return "", fmt.Errorf("password too long: %d > %d", len(password), MaxPasswordLength)
	}

	salt := make([]byte, argonSaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generate salt: %w", err)
	}

	hash := argon2.IDKey([]byte(password), salt, argonIterations, argonMemory, argonParallelism, argonKeyLength)

	encode := base64.RawStdEncoding.EncodeToString
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, argonMemory, argonIterations, argonParallelism,
		encode(salt), encode(hash),
	), nil
}

// VerifyPassword compares a plain password against an encoded hash in
// constant time.
func VerifyPassword(encoded, password string) (bool, error) {
	if len(password) > MaxPasswordLength {
		return false, nil
	}

	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return false, fmt.Errorf("unsupported password hash format")
	}

	var version int
	var memory uint32
	var iterations, parallelism uint8
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return false, fmt.Errorf("parse hash version: %w", err)
	}
	if version != argon2.Version {
		return false, fmt.Errorf("unsupported argon2 version %d", version)
	}
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism); err != nil {
		return false, fmt.Errorf("parse hash params: %w", err)
	}

	decode := base64.RawStdEncoding.DecodeString
	salt, err := decode(parts[4])
	if err != nil {
		return false, fmt.Errorf("decode salt: %w", err)
	}
	expected, err := decode(parts[5])
	if err != nil {
		return false, fmt.Errorf("decode hash: %w", err)
	}

	actual := argon2.IDKey([]byte(password), salt, uint32(iterations), memory, parallelism, uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1, nil
}

// NewSessionToken returns a URL-safe opaque token for a session cookie.
func NewSessionToken() (string, error) {
	raw := make([]byte, SessionTokenLength)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("generate session token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}
