package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// ErrMissingDatabaseURL is returned when production starts without
// DATABASE_URL, instead of silently pointing at localhost.
var ErrMissingDatabaseURL = errors.New("DATABASE_URL wajib diisi saat APP_ENV=production")

// ErrUnknownAIProvider is returned for an AI_PROVIDER outside AIProviders. A
// typo must not silently fall back to the stub: production would answer with
// fake drafts and look like it is working.
var ErrUnknownAIProvider = errors.New("AI_PROVIDER tidak dikenal")

// ErrMissingGeminiAPIKey is returned when the API starts with the Gemini
// provider selected but no key. Starting anyway would leave every draft request
// answering 503 while the process looks healthy, which is harder to notice than
// a refused boot. Use AI_PROVIDER=stub for a keyless run.
var ErrMissingGeminiAPIKey = errors.New("GEMINI_API_KEY wajib diisi saat AI_PROVIDER=gemini")

// ErrInvalidAIDraftLimit is returned for a non-numeric or non-positive
// AI_DRAFT_LIMIT_PER_HOUR. Reading a bad value as "unlimited" would silently
// remove the only guard on an endpoint that bills per call.
var ErrInvalidAIDraftLimit = errors.New("AI_DRAFT_LIMIT_PER_HOUR harus bilangan bulat positif")

// ErrInvalidAuthLimit is returned for a non-numeric or non-positive auth
// rate-limit value. Reading one as "unlimited" would silently remove a
// brute-force and mass-registration guard, and the failure would look like
// healthy traffic.
var ErrInvalidAuthLimit = errors.New("batas rate-limit auth harus bilangan bulat positif")

// DefaultAIDraftLimitPerHour is the per-account budget for
// POST /api/v1/ai/draft-profile when AI_DRAFT_LIMIT_PER_HOUR is unset.
const DefaultAIDraftLimitPerHour = 20

// Defaults for the auth rate limits. Each is a count of requests per window;
// the windows are constants in cmd/api, so config carries numbers only.
//
// The two per-identity limits protect one account or one email address. The two
// global limits are per-endpoint "safety valves" that cap what a flood of
// distinct identities can cost: the register valve bounds mass account
// creation, the login valve bounds argon2id work, which is deliberately
// expensive and therefore a CPU target when spread across many addresses.
const (
	DefaultAuthLoginLimit          = 10
	DefaultAuthRegisterLimit       = 10
	DefaultAuthLoginGlobalLimit    = 300
	DefaultAuthRegisterGlobalLimit = 30
)

// AIProviderGemini is the default: the real generator. AIProviderStub is the
// offline generator kept for tests and keyless runs.
const (
	AIProviderGemini = "gemini"
	AIProviderStub   = "stub"
)

// AIProviders lists the draft generators that can actually be wired up. Add a
// value here together with its implementation in cmd/api/main.go.
var AIProviders = []string{AIProviderStub, AIProviderGemini}

// Config holds everything read from the environment. Outside production,
// values fall back to local-development defaults so `go run ./cmd/api` works
// without a .env file.
type Config struct {
	Port         string
	DatabaseURL  string
	AppEnv       string
	UploadDir    string
	AIProvider   string
	GeminiAPIKey string
	// GeminiModel is passed through as-is; the empty default lives in the ai
	// package next to the provider that uses it.
	GeminiModel string
	// AIDraftLimitPerHour is the per-account draft budget. The window itself is
	// a constant in cmd/api, so this stays a single number to tune.
	AIDraftLimitPerHour int

	// Auth rate limits: per-email counts plus a per-endpoint global valve.
	// Windows live in cmd/api for the same reason as above.
	AuthLoginLimit          int
	AuthRegisterLimit       int
	AuthLoginGlobalLimit    int
	AuthRegisterGlobalLimit int
}

func Load() (Config, error) {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "uploads"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		// Falling back to the localhost default in production only surfaces
		// later, as a connection-refused on the first query — and reads like
		// the database is down rather than the variable being unset.
		if appEnv == "production" {
			return Config{}, ErrMissingDatabaseURL
		}
		databaseURL = "postgres://lumora:lumora@localhost:5432/lumora?sslmode=disable"
	}

	aiProvider := os.Getenv("AI_PROVIDER")
	if aiProvider == "" {
		aiProvider = AIProviderGemini
	}
	if !knownAIProvider(aiProvider) {
		return Config{}, fmt.Errorf("%w: %q", ErrUnknownAIProvider, aiProvider)
	}

	geminiAPIKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))

	aiDraftLimit := DefaultAIDraftLimitPerHour
	if raw := strings.TrimSpace(os.Getenv("AI_DRAFT_LIMIT_PER_HOUR")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			return Config{}, fmt.Errorf("%w: %q", ErrInvalidAIDraftLimit, raw)
		}
		aiDraftLimit = parsed
	}

	authLoginLimit, err := positiveIntFromEnv("AUTH_LOGIN_LIMIT_PER_15_MIN", DefaultAuthLoginLimit)
	if err != nil {
		return Config{}, err
	}
	authRegisterLimit, err := positiveIntFromEnv("AUTH_REGISTER_LIMIT_PER_HOUR", DefaultAuthRegisterLimit)
	if err != nil {
		return Config{}, err
	}
	authLoginGlobalLimit, err := positiveIntFromEnv("AUTH_LOGIN_GLOBAL_LIMIT_PER_HOUR", DefaultAuthLoginGlobalLimit)
	if err != nil {
		return Config{}, err
	}
	authRegisterGlobalLimit, err := positiveIntFromEnv("AUTH_REGISTER_GLOBAL_LIMIT_PER_HOUR", DefaultAuthRegisterGlobalLimit)
	if err != nil {
		return Config{}, err
	}

	return Config{
		Port:                    port,
		DatabaseURL:             databaseURL,
		AppEnv:                  appEnv,
		UploadDir:               uploadDir,
		AIProvider:              aiProvider,
		GeminiAPIKey:            geminiAPIKey,
		GeminiModel:             strings.TrimSpace(os.Getenv("GEMINI_MODEL")),
		AIDraftLimitPerHour:     aiDraftLimit,
		AuthLoginLimit:          authLoginLimit,
		AuthRegisterLimit:       authRegisterLimit,
		AuthLoginGlobalLimit:    authLoginGlobalLimit,
		AuthRegisterGlobalLimit: authRegisterGlobalLimit,
	}, nil
}

// positiveIntFromEnv reads a positive integer from the environment, falling
// back to fallback when the variable is unset or blank. One sentinel covers all
// four auth limits; the wrapped error names the offending variable so a typo in
// one does not leave the operator guessing which.
func positiveIntFromEnv(name string, fallback int) (int, error) {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil || parsed <= 0 {
		return 0, fmt.Errorf("%w: %s=%q", ErrInvalidAuthLimit, name, raw)
	}
	return parsed, nil
}

// RequireGeminiKey reports whether the selected provider can actually run. Only
// the API calls it: migrate and seed share Load, and they never generate drafts,
// so a missing AI key must not stop a schema migration or a seed.
func (c Config) RequireGeminiKey() error {
	if c.AIProvider == AIProviderGemini && c.GeminiAPIKey == "" {
		return ErrMissingGeminiAPIKey
	}
	return nil
}

func knownAIProvider(provider string) bool {
	for _, known := range AIProviders {
		if provider == known {
			return true
		}
	}
	return false
}

func (c Config) IsProduction() bool {
	return c.AppEnv == "production"
}
