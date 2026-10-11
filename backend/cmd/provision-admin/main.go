package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/auth"
	"github.com/alfian/lumora/backend/internal/config"
	"github.com/alfian/lumora/backend/internal/domain"
)

func main() {
	name := flag.String("name", "", "admin display name")
	email := flag.String("email", "", "admin email")
	flag.Parse()

	reader := bufio.NewReader(os.Stdin)
	password, err := reader.ReadString('\n')
	if err != nil {
		fmt.Fprintln(os.Stderr, "read password from stdin:", err)
		os.Exit(1)
	}
	password = strings.TrimSpace(password)
	params := domain.RegisterParams{Name: *name, Email: *email, Password: password, Role: domain.RoleUMKM}
	if err := params.Validate(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		fmt.Fprintln(os.Stderr, "hash password:", err)
		os.Exit(1)
	}

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "load config:", err)
		os.Exit(1)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		fmt.Fprintln(os.Stderr, "connect database:", err)
		os.Exit(1)
	}
	defer pool.Close()

	if _, err := pool.Exec(ctx, `
		INSERT INTO users (name, email, password_hash, role, email_verified_at)
		VALUES ($1, $2, $3, 'admin', now())`, params.Name, params.Email, hash); err != nil {
		fmt.Fprintln(os.Stderr, "create admin:", err)
		os.Exit(1)
	}
	fmt.Println("admin created:", params.Email)
}
