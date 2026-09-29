package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/alfian/lumora/backend/internal/config"
)

// migrate brings the schema up to date. It wraps goose as a library so any
// machine or container only needs `go run ./cmd/migrate` — no goose CLI to
// install. Running it twice is a no-op.
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	dir := os.Getenv("MIGRATIONS_DIR")
	if dir == "" {
		dir = "migrations"
	}

	goose.SetDialect("postgres")
	if err := goose.UpContext(ctx, db, dir); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	log.Printf("migrasi selesai (%s)", dir)
}
