package main

import (
	"context"
	"database/sql"
	"log/slog"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/alfian/lumora/backend/internal/config"
	"github.com/alfian/lumora/backend/internal/logging"
)

// migrate brings the schema up to date. It wraps goose as a library so any
// machine or container only needs `go run ./cmd/migrate` — no goose CLI to
// install. Running it twice is a no-op.
func main() {
	cfg, err := config.Load()
	if err != nil {
		logging.Fatal("config load failed", "err", err)
	}
	logging.Setup(cfg.AppEnv, cfg.LogLevel)

	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		logging.Fatal("open db failed", "err", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		logging.Fatal("db ping failed", "err", err)
	}

	dir := os.Getenv("MIGRATIONS_DIR")
	if dir == "" {
		dir = "migrations"
	}

	goose.SetDialect("postgres")
	if err := goose.UpContext(ctx, db, dir); err != nil {
		logging.Fatal("migrate failed", "err", err)
	}
	slog.Info("migrasi selesai", "dir", dir)
}
