package config

import (
	"errors"
	"testing"
)

func TestLoadRequiresDatabaseURLInProduction(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "")

	_, err := Load()
	if !errors.Is(err, ErrMissingDatabaseURL) {
		t.Fatalf("got %v, want ErrMissingDatabaseURL", err)
	}
}

func TestLoadAcceptsDatabaseURLInProduction(t *testing.T) {
	const dsn = "postgres://u:p@postgres.railway.internal:5432/railway"

	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", dsn)

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

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.DatabaseURL == "" {
		t.Fatal("expected a localhost fallback DSN")
	}
}
