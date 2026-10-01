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

func TestLoadDefaultsAIDraftGlobalLimit(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("AI_DRAFT_GLOBAL_LIMIT_PER_HOUR", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AIDraftGlobalLimitPerHour != DefaultAIDraftGlobalLimitPerHour {
		t.Fatalf("got %d, want %d", cfg.AIDraftGlobalLimitPerHour, DefaultAIDraftGlobalLimitPerHour)
	}
}

func TestLoadReadsAIDraftGlobalLimit(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("AI_DRAFT_GLOBAL_LIMIT_PER_HOUR", " 350 ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.AIDraftGlobalLimitPerHour != 350 {
		t.Fatalf("got %d, want 350", cfg.AIDraftGlobalLimitPerHour)
	}
}

func TestLoadRejectsInvalidAIDraftGlobalLimit(t *testing.T) {
	// Same guard as the per-account budget: a bad value must not be read as
	// "unlimited" and silently lift the ceiling on a billing endpoint.
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
			t.Setenv("AI_DRAFT_GLOBAL_LIMIT_PER_HOUR", tc.raw)

			_, err := Load()
			if !errors.Is(err, ErrInvalidAIDraftLimit) {
				t.Fatalf("got %v, want ErrInvalidAIDraftLimit", err)
			}
		})
	}
}

// authLimitEnvNames is every variable the auth and verification limiters read,
// so each test can neutralise the ones it is not exercising. Load also reads
// backend/.env through godotenv, and a stray value there would otherwise leak
// into these assertions.
var authLimitEnvNames = []string{
	"AUTH_LOGIN_LIMIT_PER_15_MIN",
	"AUTH_REGISTER_LIMIT_PER_HOUR",
	"AUTH_LOGIN_GLOBAL_LIMIT_PER_HOUR",
	"AUTH_REGISTER_GLOBAL_LIMIT_PER_HOUR",
	"AUTH_VERIFY_GLOBAL_LIMIT_PER_HOUR",
	"AUTH_RESEND_LIMIT_PER_HOUR",
	"AUTH_RESEND_GLOBAL_LIMIT_PER_HOUR",
	"AUTH_PASSWORD_LIMIT_PER_HOUR",
	"AUTH_PASSWORD_GLOBAL_LIMIT_PER_HOUR",
}

func TestLoadDefaultsAuthLimits(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	for _, name := range authLimitEnvNames {
		t.Setenv(name, "")
	}

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	cases := []struct {
		name string
		got  int
		want int
	}{
		{"AUTH_LOGIN_LIMIT_PER_15_MIN", cfg.AuthLoginLimit, DefaultAuthLoginLimit},
		{"AUTH_REGISTER_LIMIT_PER_HOUR", cfg.AuthRegisterLimit, DefaultAuthRegisterLimit},
		{"AUTH_LOGIN_GLOBAL_LIMIT_PER_HOUR", cfg.AuthLoginGlobalLimit, DefaultAuthLoginGlobalLimit},
		{"AUTH_REGISTER_GLOBAL_LIMIT_PER_HOUR", cfg.AuthRegisterGlobalLimit, DefaultAuthRegisterGlobalLimit},
		{"AUTH_VERIFY_GLOBAL_LIMIT_PER_HOUR", cfg.AuthVerifyGlobalLimit, DefaultAuthVerifyGlobalLimit},
		{"AUTH_RESEND_LIMIT_PER_HOUR", cfg.AuthResendLimit, DefaultAuthResendLimit},
		{"AUTH_RESEND_GLOBAL_LIMIT_PER_HOUR", cfg.AuthResendGlobalLimit, DefaultAuthResendGlobalLimit},
		{"AUTH_PASSWORD_LIMIT_PER_HOUR", cfg.AuthPasswordLimit, DefaultAuthPasswordLimit},
		{"AUTH_PASSWORD_GLOBAL_LIMIT_PER_HOUR", cfg.AuthPasswordGlobalLimit, DefaultAuthPasswordGlobalLimit},
	}

	for _, tc := range cases {
		if tc.got != tc.want {
			t.Errorf("%s: got %d, want %d", tc.name, tc.got, tc.want)
		}
	}
}

func TestLoadReadsAuthLimits(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	for _, name := range authLimitEnvNames {
		t.Setenv(name, "")
	}
	// Surrounding whitespace must be trimmed, as for every other numeric var.
	t.Setenv("AUTH_LOGIN_LIMIT_PER_15_MIN", " 7 ")
	t.Setenv("AUTH_REGISTER_LIMIT_PER_HOUR", "8")
	t.Setenv("AUTH_LOGIN_GLOBAL_LIMIT_PER_HOUR", "9")
	t.Setenv("AUTH_REGISTER_GLOBAL_LIMIT_PER_HOUR", "10")
	t.Setenv("AUTH_VERIFY_GLOBAL_LIMIT_PER_HOUR", " 11 ")
	t.Setenv("AUTH_RESEND_LIMIT_PER_HOUR", "12")
	t.Setenv("AUTH_RESEND_GLOBAL_LIMIT_PER_HOUR", "13")
	t.Setenv("AUTH_PASSWORD_LIMIT_PER_HOUR", "14")
	t.Setenv("AUTH_PASSWORD_GLOBAL_LIMIT_PER_HOUR", " 15 ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.AuthLoginLimit != 7 {
		t.Errorf("AuthLoginLimit = %d, want 7", cfg.AuthLoginLimit)
	}
	if cfg.AuthRegisterLimit != 8 {
		t.Errorf("AuthRegisterLimit = %d, want 8", cfg.AuthRegisterLimit)
	}
	if cfg.AuthLoginGlobalLimit != 9 {
		t.Errorf("AuthLoginGlobalLimit = %d, want 9", cfg.AuthLoginGlobalLimit)
	}
	if cfg.AuthRegisterGlobalLimit != 10 {
		t.Errorf("AuthRegisterGlobalLimit = %d, want 10", cfg.AuthRegisterGlobalLimit)
	}
	if cfg.AuthVerifyGlobalLimit != 11 {
		t.Errorf("AuthVerifyGlobalLimit = %d, want 11", cfg.AuthVerifyGlobalLimit)
	}
	if cfg.AuthResendLimit != 12 {
		t.Errorf("AuthResendLimit = %d, want 12", cfg.AuthResendLimit)
	}
	if cfg.AuthResendGlobalLimit != 13 {
		t.Errorf("AuthResendGlobalLimit = %d, want 13", cfg.AuthResendGlobalLimit)
	}
	if cfg.AuthPasswordLimit != 14 {
		t.Errorf("AuthPasswordLimit = %d, want 14", cfg.AuthPasswordLimit)
	}
	if cfg.AuthPasswordGlobalLimit != 15 {
		t.Errorf("AuthPasswordGlobalLimit = %d, want 15", cfg.AuthPasswordGlobalLimit)
	}
}

func TestLoadRejectsInvalidAuthLimits(t *testing.T) {
	// A bad value must not be read as "unlimited": that would silently remove a
	// brute-force and mass-registration guard, and the failure would look like
	// healthy traffic.
	values := []struct {
		name string
		raw  string
	}{
		{"not a number", "abc"},
		{"zero", "0"},
		{"negative", "-5"},
		{"float", "1.5"},
	}

	for _, variable := range authLimitEnvNames {
		for _, value := range values {
			t.Run(variable+"/"+value.name, func(t *testing.T) {
				t.Setenv("AI_PROVIDER", AIProviderStub)
				for _, name := range authLimitEnvNames {
					t.Setenv(name, "")
				}
				t.Setenv(variable, value.raw)

				_, err := Load()
				if !errors.Is(err, ErrInvalidAuthLimit) {
					t.Fatalf("got %v, want ErrInvalidAuthLimit", err)
				}
			})
		}
	}
}

func TestLoadDefaultsEmailProviderToStub(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("EMAIL_PROVIDER", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.EmailProvider != EmailProviderStub {
		t.Fatalf("got %q, want %q", cfg.EmailProvider, EmailProviderStub)
	}
}

func TestLoadAcceptsKnownEmailProvider(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("EMAIL_PROVIDER", EmailProviderStub)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.EmailProvider != EmailProviderStub {
		t.Fatalf("got %q, want %q", cfg.EmailProvider, EmailProviderStub)
	}
}

func TestLoadRejectsUnknownEmailProvider(t *testing.T) {
	// A typo must fail loudly rather than quietly logging links nobody will
	// ever receive while production looks healthy.
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("EMAIL_PROVIDER", "smtp")

	_, err := Load()
	if !errors.Is(err, ErrUnknownEmailProvider) {
		t.Fatalf("got %v, want ErrUnknownEmailProvider", err)
	}
}

func TestLoadAcceptsResendProviderWithoutKey(t *testing.T) {
	// Load must succeed without a key: migrate and seed share it and never send
	// mail. The key is checked by RequireEmailSender below.
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("EMAIL_PROVIDER", EmailProviderResend)
	t.Setenv("RESEND_API_KEY", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.EmailProvider != EmailProviderResend {
		t.Fatalf("got %q, want %q", cfg.EmailProvider, EmailProviderResend)
	}
}

func TestLoadReadsResendSettings(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("EMAIL_PROVIDER", EmailProviderResend)
	t.Setenv("RESEND_API_KEY", "  re_test  ")
	t.Setenv("RESEND_FROM", "  LUMORA <no-reply@lumora.example>  ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.ResendAPIKey != "re_test" {
		t.Fatalf("ResendAPIKey = %q, want trimmed %q", cfg.ResendAPIKey, "re_test")
	}
	if cfg.ResendFrom != "LUMORA <no-reply@lumora.example>" {
		t.Fatalf("ResendFrom = %q, want the trimmed value", cfg.ResendFrom)
	}
}

func TestLoadLeavesResendFromEmptyForTheProviderDefault(t *testing.T) {
	// The default from-address lives in the email package; config must not
	// duplicate it, or the two can drift.
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("EMAIL_PROVIDER", EmailProviderResend)
	t.Setenv("RESEND_FROM", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.ResendFrom != "" {
		t.Fatalf("ResendFrom = %q, want empty", cfg.ResendFrom)
	}
}

func TestRequireEmailSender(t *testing.T) {
	cases := []struct {
		name     string
		appEnv   string
		provider string
		key      string
		want     error
	}{
		{"resend without key", "development", EmailProviderResend, "", ErrMissingResendAPIKey},
		{"resend with whitespace key", "development", EmailProviderResend, "   ", ErrMissingResendAPIKey},
		{"stub in production", "production", EmailProviderStub, "", ErrStubEmailInProduction},
		{"resend with key", "development", EmailProviderResend, "re_test", nil},
		{"stub outside production", "development", EmailProviderStub, "", nil},
		{"resend in production", "production", EmailProviderResend, "re_test", nil},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("AI_PROVIDER", AIProviderStub)
			t.Setenv("APP_ENV", tc.appEnv)
			t.Setenv("DATABASE_URL", "postgres://u:p@localhost:5432/lumora")
			t.Setenv("EMAIL_PROVIDER", tc.provider)
			t.Setenv("RESEND_API_KEY", tc.key)

			cfg, err := Load()
			if err != nil {
				t.Fatalf("Load must not check the sender: %v", err)
			}
			if got := cfg.RequireEmailSender(); !errors.Is(got, tc.want) {
				t.Fatalf("got %v, want %v", got, tc.want)
			}
		})
	}
}

func TestLoadDefaultsFrontendBaseURL(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("FRONTEND_BASE_URL", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.FrontendBaseURL != FrontendBaseURLDefault {
		t.Fatalf("got %q, want %q", cfg.FrontendBaseURL, FrontendBaseURLDefault)
	}
}

func TestLoadReadsFrontendBaseURL(t *testing.T) {
	// Surrounding whitespace is trimmed here; any trailing slash is left for
	// the service, which joins paths onto this value.
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("FRONTEND_BASE_URL", "  https://lumora.example  ")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.FrontendBaseURL != "https://lumora.example" {
		t.Fatalf("got %q, want the trimmed value", cfg.FrontendBaseURL)
	}
}

func TestLoadDefaultsLogLevel(t *testing.T) {
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("LOG_LEVEL", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.LogLevel != DefaultLogLevel {
		t.Fatalf("got %q, want %q", cfg.LogLevel, DefaultLogLevel)
	}
}

func TestLoadReadsLogLevel(t *testing.T) {
	// Surrounding whitespace and letter case are normalized, so LOG_LEVEL=WARN
	// behaves like warn.
	cases := []struct {
		name string
		raw  string
		want string
	}{
		{"lowercase", "debug", LogLevelDebug},
		{"padded and uppercase", "  WARN ", LogLevelWarn},
		{"mixed case", "Error", LogLevelError},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("AI_PROVIDER", AIProviderStub)
			t.Setenv("LOG_LEVEL", tc.raw)

			cfg, err := Load()
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if cfg.LogLevel != tc.want {
				t.Fatalf("got %q, want %q", cfg.LogLevel, tc.want)
			}
		})
	}
}

func TestLoadRejectsUnknownLogLevel(t *testing.T) {
	// A typo must fail loudly rather than silently pick a verbosity.
	t.Setenv("AI_PROVIDER", AIProviderStub)
	t.Setenv("LOG_LEVEL", "verbose")

	_, err := Load()
	if !errors.Is(err, ErrUnknownLogLevel) {
		t.Fatalf("got %v, want ErrUnknownLogLevel", err)
	}
}
