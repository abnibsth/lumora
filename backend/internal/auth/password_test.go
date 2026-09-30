package auth

import (
	"strings"
	"testing"
)

func TestHashPasswordRoundTrip(t *testing.T) {
	hash, err := HashPassword("rahasia123")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if !strings.HasPrefix(hash, "$argon2id$v=19$") {
		t.Errorf("hash prefix = %q, want $argon2id$v=19$", hash)
	}

	match, err := VerifyPassword(hash, "rahasia123")
	if err != nil {
		t.Fatalf("VerifyPassword: %v", err)
	}
	if !match {
		t.Error("correct password did not verify")
	}

	match, err = VerifyPassword(hash, "salah-banget")
	if err != nil {
		t.Fatalf("VerifyPassword (wrong): %v", err)
	}
	if match {
		t.Error("wrong password verified")
	}
}

func TestHashPasswordUsesFreshSalt(t *testing.T) {
	first, err := HashPassword("rahasia123")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	second, err := HashPassword("rahasia123")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if first == second {
		t.Error("same password produced identical hashes; salt is not random")
	}
}

func TestVerifyPasswordRejectsMalformedHash(t *testing.T) {
	if _, err := VerifyPassword("bukan-hash", "rahasia123"); err == nil {
		t.Error("malformed hash returned no error")
	}
}

func TestHashPasswordRejectsOversizedInput(t *testing.T) {
	if _, err := HashPassword(strings.Repeat("a", MaxPasswordLength+1)); err == nil {
		t.Error("oversized password returned no error")
	}
}

func TestNewSessionToken(t *testing.T) {
	first, err := NewSessionToken()
	if err != nil {
		t.Fatalf("NewSessionToken: %v", err)
	}
	second, err := NewSessionToken()
	if err != nil {
		t.Fatalf("NewSessionToken: %v", err)
	}
	if first == second {
		t.Error("two session tokens are identical")
	}
	// 32 raw bytes -> 43 base64url chars without padding.
	if len(first) != 43 {
		t.Errorf("token length = %d, want 43", len(first))
	}
	if strings.ContainsAny(first, "+/=") {
		t.Errorf("token %q is not URL-safe", first)
	}
}

func TestNewVerificationToken(t *testing.T) {
	first, err := NewVerificationToken()
	if err != nil {
		t.Fatalf("NewVerificationToken: %v", err)
	}
	second, err := NewVerificationToken()
	if err != nil {
		t.Fatalf("NewVerificationToken: %v", err)
	}
	if first == second {
		t.Error("two verification tokens are identical")
	}
	// 32 raw bytes -> 43 base64url chars without padding.
	if len(first) != 43 {
		t.Errorf("token length = %d, want 43", len(first))
	}
	// URL-safe, because the token travels in a query string.
	if strings.ContainsAny(first, "+/=") {
		t.Errorf("token %q is not URL-safe", first)
	}
}

func TestHashTokenIsDeterministicAndIrreversible(t *testing.T) {
	token, err := NewVerificationToken()
	if err != nil {
		t.Fatalf("NewVerificationToken: %v", err)
	}

	hash := HashToken(token)
	// A stored hash can only ever match if hashing is stable.
	if hash != HashToken(token) {
		t.Error("HashToken is not deterministic")
	}
	if strings.Contains(hash, token) {
		t.Error("the hash contains the token in the clear")
	}
	// Hex SHA-256 is 64 lowercase hex characters.
	if len(hash) != 64 {
		t.Errorf("hash length = %d, want 64", len(hash))
	}
	if hash == HashToken(token+"x") {
		t.Error("a one-character change did not change the hash")
	}
}
