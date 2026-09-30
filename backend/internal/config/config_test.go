package config

import (
	"errors"
	"testing"
)

// The database tests pin the provider to the stub so a local .env cannot change
// what they exercise.
func TestLoadRequiresDatabaseURLInProduction(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("AI_PROVIDER", AIProviderStub)

	_, err := Load()
	if !errors.Is(err, ErrMissingDatabaseURL) {
		t.Fatalf("got %v, want ErrMissingDatabaseURL", err)
	}
}

func TestLoadAcceptsDatabaseURLInProduction(t *testing.T) {
	const dsn = "postgres://u:p@postgres.railway.internal:5432/railway"

	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", dsn)
	t.Setenv("AI_PROVIDER", AIProviderStub)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.DatabaseURL != dsn {
		t.Fatalf("got %q, want %q", cfg.DatabaseURL, dsn)
	}
}

func TestLoadFallsBackToLocalhostOutsideProduction(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("AI_PROVIDER", AIProviderStub)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.DatabaseURL == "" {
		t.Fatal("expected a localhost fallback DSN")
	}
}

func TestLoadDefaultsAIProviderToGemini(t *testing.T) {
	t.Setenv("AI_PROVIDER", "")
	t.Setenv("GEMINI_API_KEY", "")

	// Load must succeed without a key: migrate and seed share it and never
	// generate drafts. The key is checked by RequireGeminiKey below.
	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AIProvider != AIProviderGemini {
		t.Fatalf("got %q, want %q", cfg.AIProvider, AIProviderGemini)
	}
}

func TestLoadAcceptsKnownAIProvider(t *testing.T) {
	cases := []struct {
		provider string
		key      string
	}{
		{AIProviderStub, ""},
		{AIProviderStub, "a-key-ignored-by-the-stub"},
		{AIProviderGemini, "a-key"},
		{AIProviderGemini, ""},
	}

	for _, tc := range cases {
		t.Run(tc.provider+"/key="+tc.key, func(t *testing.T) {
			t.Setenv("AI_PROVIDER", tc.provider)
			t.Setenv("GEMINI_API_KEY", tc.key)

			cfg, err := Load()
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if cfg.AIProvider != tc.provider {
				t.Fatalf("got %q, want %q", cfg.AIProvider, tc.provider)
			}
		})
	}
}

func TestLoadRejectsUnknownAIProvider(t *testing.T) {
	// A typo must fail loudly rather than quietly serving stub drafts in
	// production and looking healthy.
	t.Setenv("AI_PROVIDER", "openai")
	t.Setenv("GEMINI_API_KEY", "a-key")

	_, err := Load()
	if !errors.Is(err, ErrUnknownAIProvider) {
		t.Fatalf("got %v, want ErrUnknownAIProvider", err)
	}
}

func TestRequireGeminiKeyRejectsMissingKey(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderGemini)
	t.Setenv("GEMINI_API_KEY", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load must not check the key: %v", err)
	}
	if err := cfg.RequireGeminiKey(); !errors.Is(err, ErrMissingGeminiAPIKey) {
		t.Fatalf("got %v, want ErrMissingGeminiAPIKey", err)
	}
}

func TestRequireGeminiKeyRejectsWhitespaceOnlyKey(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderGemini)
	t.Setenv("GEMINI_API_KEY", "   ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := cfg.RequireGeminiKey(); !errors.Is(err, ErrMissingGeminiAPIKey) {
		t.Fatalf("got %v, want ErrMissingGeminiAPIKey", err)
	}
}

func TestRequireGeminiKeyPassesWithKey(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderGemini)
	t.Setenv("GEMINI_API_KEY", "a-key")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := cfg.RequireGeminiKey(); err != nil {
		t.Fatalf("got %v, want nil", err)
	}
}

func TestRequireGeminiKeyPassesForStub(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("GEMINI_API_KEY", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := cfg.RequireGeminiKey(); err != nil {
		t.Fatalf("got %v, want nil for the keyless stub", err)
	}
}

func TestLoadStubNeedsNoGeminiAPIKey(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("GEMINI_API_KEY", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.GeminiAPIKey != "" {
		t.Fatalf("GeminiAPIKey = %q, want empty", cfg.GeminiAPIKey)
	}
}

func TestLoadReadsGeminiSettings(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderGemini)
	t.Setenv("GEMINI_API_KEY", "  a-key  ")
	t.Setenv("GEMINI_MODEL", "gemini-2.5-pro")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.GeminiAPIKey != "a-key" {
		t.Fatalf("GeminiAPIKey = %q, want trimmed %q", cfg.GeminiAPIKey, "a-key")
	}
	if cfg.GeminiModel != "gemini-2.5-pro" {
		t.Fatalf("GeminiModel = %q, want %q", cfg.GeminiModel, "gemini-2.5-pro")
	}
}

func TestLoadLeavesGeminiModelEmptyForTheProviderDefault(t *testing.T) {
	// The default model constant lives in the ai package; config must not
	// duplicate it, or the two can drift.
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("GEMINI_MODEL", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.GeminiModel != "" {
		t.Fatalf("GeminiModel = %q, want empty", cfg.GeminiModel)
	}
}

func TestLoadDefaultsAIDraftLimit(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("AI_DRAFT_LIMIT_PER_HOUR", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AIDraftLimitPerHour != DefaultAIDraftLimitPerHour {
		t.Fatalf("got %d, want %d", cfg.AIDraftLimitPerHour, DefaultAIDraftLimitPerHour)
	}
}

func TestLoadReadsAIDraftLimit(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("AI_DRAFT_LIMIT_PER_HOUR", " 50 ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AIDraftLimitPerHour != 50 {
		t.Fatalf("got %d, want 50", cfg.AIDraftLimitPerHour)
	}
}

func TestLoadRejectsInvalidAIDraftLimit(t *testing.T) {
	// A bad value must not be read as "unlimited": that would silently remove
	// the only guard on an endpoint that bills per call.
	cases := []struct {
		name string
		raw  string
	}{
		{"not a number", "abc"},
		{"zero", "0"},
		{"negative", "-5"},
		{"float", "1.5"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("AI_PROVIDER", AIProviderStub)
			t.Setenv("AI_DRAFT_LIMIT_PER_HOUR", tc.raw)

			_, err := Load()
			if !errors.Is(err, ErrInvalidAIDraftLimit) {
				t.Fatalf("got %v, want ErrInvalidAIDraftLimit", err)
			}
		})
	}
}
