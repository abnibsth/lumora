package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/ai"
	"github.com/alfian/lumora/backend/internal/config"
	"github.com/alfian/lumora/backend/internal/http/handler"
	"github.com/alfian/lumora/backend/internal/http/middleware"
	"github.com/alfian/lumora/backend/internal/service"
	"github.com/alfian/lumora/backend/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	// Only this binary generates drafts, so only this binary insists on the
	// provider's key. cmd/migrate and cmd/seed share config.Load and must keep
	// working on a machine that has no AI credentials.
	if err := cfg.RequireGeminiKey(); err != nil {
		log.Fatalf("config: %v", err)
	}

	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db pool: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	queries := store.New(pool)
	businessService := service.NewBusinessService(queries, service.NewPoolTxRunner(pool))
	businessHandler := handler.NewBusinessHandler(businessService)

	authService := service.NewAuthService(queries, queries)
	authHandler := handler.NewAuthHandler(authService, cfg.IsProduction())

	bookmarkService := service.NewBookmarkService(queries, queries)
	bookmarkHandler := handler.NewBookmarkHandler(bookmarkService)
	mediaHandler := handler.NewMediaHandler(cfg.UploadDir)

	// AI_PROVIDER selects the draft generator: "gemini" is the real provider and
	// the default, "stub" is the offline one used for keyless runs and tests.
	// config.Load rejects every other value and refuses to start a Gemini
	// provider without a key, and the default below catches a provider added to
	// the allowlist without an implementation here.
	var drafter service.Drafter
	switch cfg.AIProvider {
	case config.AIProviderStub:
		drafter = ai.NewStub()
	case config.AIProviderGemini:
		drafter = ai.NewGemini(cfg.GeminiAPIKey, cfg.GeminiModel)
	default:
		log.Fatalf("ai: provider %q belum punya implementasi", cfg.AIProvider)
	}
	aiService := service.NewAIDraftService(drafter, service.DefaultAITimeout)
	aiHandler := handler.NewAIHandler(aiService)

	// Every draft bills the provider, so the endpoint is metered per account.
	// config.Load rejects a non-positive limit, so the constructor cannot see
	// one. The window lives here; config only carries the count.
	aiLimiter := middleware.NewRateLimiter(cfg.AIDraftLimitPerHour, time.Hour, time.Now)

	r := gin.New()
	// Trust no proxy: gin's default (trust everyone) lets a client spoof its
	// own address through X-Forwarded-For. Nothing here makes an auth decision
	// on ClientIP, so the direct peer is the honest answer.
	_ = r.SetTrustedProxies(nil)
	r.Use(gin.Logger(), gin.Recovery())

	// Uploaded covers/logos are public, like the seed images: served from disk
	// under a server-generated filename.
	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("upload dir: %v", err)
	}
	r.Static("/uploads", cfg.UploadDir)

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// AttachSession is scoped to the API group, not the whole engine: static
	// files and the health check must not pay a session lookup per request.
	v1 := r.Group("/api/v1", middleware.AttachSession(authService))
	v1.GET("/businesses", businessHandler.List)
	v1.GET("/businesses/mine", middleware.RequireSession(), businessHandler.ListMine)
	v1.GET("/businesses/:slug", businessHandler.Detail)
	v1.POST("/businesses", middleware.RequireSession(), businessHandler.Create)
	v1.PATCH("/businesses/:id", middleware.RequireSession(), businessHandler.Update)
	v1.POST("/businesses/:id/publish", middleware.RequireSession(), businessHandler.Publish)

	v1.POST("/auth/register", authHandler.Register)
	v1.POST("/auth/login", authHandler.Login)
	v1.POST("/auth/logout", authHandler.Logout)
	v1.GET("/auth/me", middleware.RequireSession(), authHandler.Me)

	v1.GET("/bookmarks", middleware.RequireSession(), bookmarkHandler.List)
	v1.POST("/bookmarks/:slug", middleware.RequireSession(), bookmarkHandler.Add)
	v1.DELETE("/bookmarks/:slug", middleware.RequireSession(), bookmarkHandler.Remove)

	v1.POST("/media", middleware.RequireSession(), mediaHandler.Upload)

	// RequireSession runs first so unauthenticated traffic is rejected before it
	// can consume budget or create a bucket.
	v1.POST("/ai/draft-profile", middleware.RequireSession(), aiLimiter.Middleware(), aiHandler.Draft)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
		// A stalled client is the target: cap the header read so it cannot
		// hold a connection open forever, while the body/response budgets
		// stay generous enough for a 5 MB upload on a slow link.
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("LUMORA API listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	// Railway sends SIGTERM on redeploy: drain in-flight requests before
	// exiting instead of cutting them off.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	log.Println("server stopped")
}
