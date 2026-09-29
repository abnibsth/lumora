package config

import (
	"errors"
	"fmt"
	"os"
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

	return Config{
		Port:         port,
		DatabaseURL:  databaseURL,
		AppEnv:       appEnv,
		UploadDir:    uploadDir,
		AIProvider:   aiProvider,
		GeminiAPIKey: geminiAPIKey,
		GeminiModel:  strings.TrimSpace(os.Getenv("GEMINI_MODEL")),
	}, nil
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
