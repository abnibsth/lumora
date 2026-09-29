package config

import (
	"errors"
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// ErrMissingDatabaseURL is returned when production starts without
// DATABASE_URL, instead of silently pointing at localhost.
var ErrMissingDatabaseURL = errors.New("DATABASE_URL wajib diisi saat APP_ENV=production")

// ErrUnknownAIProvider is returned for an AI_PROVIDER outside AIProviders. A
// typo must not silently fall back to the stub: production would answer with
// fake drafts and look like it is working.
var ErrUnknownAIProvider = errors.New("AI_PROVIDER tidak dikenal")

// AIProviders lists the draft generators that can actually be wired up. Add a
// value here together with its implementation in cmd/api/main.go.
var AIProviders = []string{"stub"}

// Config holds everything read from the environment. Outside production,
// values fall back to local-development defaults so `go run ./cmd/api` works
// without a .env file.
type Config struct {
	Port        string
	DatabaseURL string
	AppEnv      string
	UploadDir   string
	AIProvider  string
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
		aiProvider = "stub"
	}
	if !knownAIProvider(aiProvider) {
		return Config{}, fmt.Errorf("%w: %q", ErrUnknownAIProvider, aiProvider)
	}

	return Config{
		Port:        port,
		DatabaseURL: databaseURL,
		AppEnv:      appEnv,
		UploadDir:   uploadDir,
		AIProvider:  aiProvider,
	}, nil
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
