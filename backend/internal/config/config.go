package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds everything read from the environment. Values fall back to
// local-development defaults so `go run ./cmd/api` works without a .env file.
type Config struct {
	Port        string
	DatabaseURL string
	AppEnv      string
	UploadDir   string
}

func Load() Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://lumora:lumora@localhost:5432/lumora?sslmode=disable"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "uploads"
	}

	return Config{
		Port:        port,
		DatabaseURL: databaseURL,
		AppEnv:      appEnv,
		UploadDir:   uploadDir,
	}
}

func (c Config) IsProduction() bool {
	return c.AppEnv == "production"
}
