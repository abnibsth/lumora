package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/ai"
	"github.com/alfian/lumora/backend/internal/config"
	"github.com/alfian/lumora/backend/internal/email"
	"github.com/alfian/lumora/backend/internal/http/handler"
	"github.com/alfian/lumora/backend/internal/http/middleware"
	"github.com/alfian/lumora/backend/internal/logging"
	"github.com/alfian/lumora/backend/internal/service"
	"github.com/alfian/lumora/backend/internal/store"
)

// Rate-limit windows. config carries only counts; the windows live beside the
// wiring so an env var name and its duration cannot drift apart unnoticed.
const (
	authLoginWindow    = 15 * time.Minute
	authRegisterWindow = time.Hour
	authGlobalWindow   = time.Hour
	// The AI endpoint's per-account budget and its global ceiling share one
	// window. Split this into two constants if they ever need to differ.
	aiWindow = time.Hour
	// Verification endpoints: the verify valve and both resend limiters share
	// one window, matching the env var names' _PER_HOUR suffix.
	authVerifyWindow   = time.Hour
	authResendWindow   = time.Hour
	authPasswordWindow = time.Hour
)

// authRateLimitMessage is shared by every auth limiter so a client cannot tell
// which bucket it exhausted. Only Retry-After differs between them.
const authRateLimitMessage = "Terlalu banyak percobaan. Coba lagi nanti."

func main() {
	cfg, err := config.Load()
	if err != nil {
		logging.Fatal("config load failed", "err", err)
	}
	// Install the logger before anything captures slog.Default, notably the
	// email stub below.
	logging.Setup(cfg.AppEnv, cfg.LogLevel)
	// Only this binary generates drafts, so only this binary insists on the
	// provider's key. cmd/migrate and cmd/seed share config.Load and must keep
	// working on a machine that has no AI credentials.
	if err := cfg.RequireGeminiKey(); err != nil {
		logging.Fatal("config check failed", "err", err)
	}
	// Same split for email: only this binary sends mail, so only this binary
	// refuses to boot on a sender that cannot send. Putting this in Load would
	// also stop the migrate step docker-entrypoint.sh runs before the API, and
	// break the whole deploy.
	if err := cfg.RequireEmailSender(); err != nil {
		logging.Fatal("config check failed", "err", err)
	}

	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logging.Fatal("db pool failed", "err", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		logging.Fatal("db ping failed", "err", err)
	}

	queries := store.New(pool)
	businessService := service.NewBusinessService(queries, service.NewPoolTxRunner(pool))
	businessHandler := handler.NewBusinessHandler(businessService)

	// EMAIL_PROVIDER selects the verification sender. "resend" is the real one;
	// "stub" logs the link instead of mailing it, which is fine locally and is
	// refused in production by RequireEmailSender above. config.Load rejects
	// every value outside EmailProviders, and the default below catches a
	// provider added to the allowlist without an implementation here.
	var sender service.VerificationSender
	switch cfg.EmailProvider {
	case config.EmailProviderStub:
		sender = email.NewStub()
	case config.EmailProviderResend:
		sender = email.NewResend(cfg.ResendAPIKey, cfg.ResendFrom)
	default:
		logging.Fatal("email provider has no implementation", "provider", cfg.EmailProvider)
	}

	authService := service.NewAuthService(queries, queries, queries, sender, cfg.FrontendBaseURL)
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
		logging.Fatal("ai provider has no implementation", "provider", cfg.AIProvider)
	}
	aiService := service.NewAIDraftService(drafter, service.DefaultAITimeout)
	aiHandler := handler.NewAIHandler(aiService)

	// Every draft bills the provider, so the endpoint is metered twice: per
	// account, and in total across all accounts. config.Load rejects a
	// non-positive limit, so neither constructor can see one. The window lives
	// here; config only carries the counts.
	aiLimiter := middleware.NewRateLimiter(cfg.AIDraftLimitPerHour, aiWindow, time.Now)
	aiGlobalLimiter := middleware.NewRateLimiter(cfg.AIDraftGlobalLimitPerHour, aiWindow, time.Now)

	// The auth endpoints are reachable without a session, so they are metered by
	// the email in the request body — not by account (there is none yet) and not
	// by client IP. Railway's edge rewrites the forwarded-for chain in ways
	// Railway's own answers contradict, and the direct peer address varies per
	// request, so no IP reaching this process is trustworthy enough to key a
	// security control on. See docs/fases.md.
	//
	// Each endpoint gets a per-email limiter plus a global safety valve: the
	// valve bounds mass registration across many distinct addresses, and the
	// argon2id work a login flood can force, which the per-email limiter alone
	// cannot.
	loginEmailLimiter := middleware.NewRateLimiter(cfg.AuthLoginLimit, authLoginWindow, time.Now)
	loginGlobalLimiter := middleware.NewRateLimiter(cfg.AuthLoginGlobalLimit, authGlobalWindow, time.Now)
	registerEmailLimiter := middleware.NewRateLimiter(cfg.AuthRegisterLimit, authRegisterWindow, time.Now)
	registerGlobalLimiter := middleware.NewRateLimiter(cfg.AuthRegisterGlobalLimit, authGlobalWindow, time.Now)

	// The verification endpoints. verify-email needs only the global valve:
	// its key would be the token, and a valid token succeeds on first use, so
	// a per-token bucket would add nothing a flood could not just skip past by
	// varying the guess. The valve is what actually bounds guessing.
	//
	// resend is keyed by account, because that is what it costs: one mail per
	// call to a real address. Its valve bounds the total mail a flood of
	// distinct accounts can trigger.
	verifyGlobalLimiter := middleware.NewRateLimiter(cfg.AuthVerifyGlobalLimit, authVerifyWindow, time.Now)
	resendAccountLimiter := middleware.NewRateLimiter(cfg.AuthResendLimit, authResendWindow, time.Now)
	resendGlobalLimiter := middleware.NewRateLimiter(cfg.AuthResendGlobalLimit, authResendWindow, time.Now)

	// Changing a password verifies the current one, so it is an argon2 oracle
	// for whoever holds a session. The per-account limit bounds the guessing;
	// the valve bounds the CPU a flood of accounts can force.
	passwordAccountLimiter := middleware.NewRateLimiter(cfg.AuthPasswordLimit, authPasswordWindow, time.Now)
	passwordGlobalLimiter := middleware.NewRateLimiter(cfg.AuthPasswordGlobalLimit, authPasswordWindow, time.Now)

	r := gin.New()
	// Trust no proxy: gin's default (trust everyone) lets a client spoof its
	// own address through X-Forwarded-For. Nothing here makes an auth decision
	// on ClientIP, so the direct peer is the honest answer.
	_ = r.SetTrustedProxies(nil)
	r.Use(middleware.AccessLog(), gin.Recovery())

	// Uploaded covers/logos are public, like the seed images: served from disk
	// under a server-generated filename.
	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		logging.Fatal("upload dir failed", "err", err)
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
	// Publish is a soft gate: an account may register, sign in and edit
	// freely, but putting a listing in front of the public needs a verified
	// address. Drafts stay editable, so the gate never strands unfinished work.
	v1.POST("/businesses/:id/publish", middleware.RequireSession(), middleware.RequireVerified(), businessHandler.Publish)
	// Archiving hides a profile rather than erasing it, so it needs no verified
	// address: nothing new reaches the public, and the opposite is true.
	v1.DELETE("/businesses/:id", middleware.RequireSession(), businessHandler.Archive)

	// The global valve is mounted FIRST, and that order is load-bearing rather
	// than stylistic. The limiter allocates a bucket per new key and only sweeps
	// buckets that have been idle for a full window, so a per-email limiter
	// running first would let a flood of distinct emails grow its map without
	// bound. With the valve ahead of it, per-email buckets are only created for
	// requests the valve admits, which bounds that map by the valve's capacity.
	v1.POST("/auth/register",
		registerGlobalLimiter.MiddlewareFor(middleware.GlobalKey, "rate_limited", authRateLimitMessage),
		registerEmailLimiter.MiddlewareFor(middleware.EmailKey, "rate_limited", authRateLimitMessage),
		authHandler.Register)
	v1.POST("/auth/login",
		loginGlobalLimiter.MiddlewareFor(middleware.GlobalKey, "rate_limited", authRateLimitMessage),
		loginEmailLimiter.MiddlewareFor(middleware.EmailKey, "rate_limited", authRateLimitMessage),
		authHandler.Login)
	v1.POST("/auth/logout", authHandler.Logout)
	v1.GET("/auth/me", middleware.RequireSession(), authHandler.Me)
	v1.PATCH("/auth/me", middleware.RequireSession(), authHandler.UpdateProfile)
	// Deleting an account is irreversible, so it re-checks the password in the
	// body rather than trusting the session alone.
	v1.DELETE("/auth/me", middleware.RequireSession(), authHandler.DeleteAccount)
	// change-password needs a session — it re-authenticates the account it
	// changes. Valve before per-account limiter, same memory reason as above.
	v1.POST("/auth/change-password",
		middleware.RequireSession(),
		passwordGlobalLimiter.MiddlewareFor(middleware.GlobalKey, "rate_limited", authRateLimitMessage),
		passwordAccountLimiter.MiddlewareFor(middleware.UserKey, "rate_limited", authRateLimitMessage),
		authHandler.ChangePassword)

	// verify-email is unauthenticated by design: the link is followed from a
	// mail client, which has no session. The token in the body is the
	// credential, so the only limiter is the global valve — see its comment
	// above for why a per-token bucket would not help.
	v1.POST("/auth/verify-email",
		verifyGlobalLimiter.MiddlewareFor(middleware.GlobalKey, "rate_limited", authRateLimitMessage),
		authHandler.VerifyEmail)
	// resend needs a session — it mails the signed-in account, so there is no
	// address to key on before authenticating. The valve runs before the
	// per-account limiter for the same memory reason as the routes above:
	// buckets are only allocated for requests the valve admits.
	v1.POST("/auth/resend-verification",
		middleware.RequireSession(),
		resendGlobalLimiter.MiddlewareFor(middleware.GlobalKey, "rate_limited", authRateLimitMessage),
		resendAccountLimiter.MiddlewareFor(middleware.UserKey, "rate_limited", authRateLimitMessage),
		authHandler.ResendVerification)

	v1.GET("/bookmarks", middleware.RequireSession(), bookmarkHandler.List)
	v1.POST("/bookmarks/:slug", middleware.RequireSession(), bookmarkHandler.Add)
	v1.DELETE("/bookmarks/:slug", middleware.RequireSession(), bookmarkHandler.Remove)

	v1.POST("/media", middleware.RequireSession(), mediaHandler.Upload)

	// Layers, in this order. RequireSession and RequireVerified run first so
	// unauthenticated or unverified traffic is rejected before it can consume
	// budget or create a bucket. Then the global valve, then the per-account
	// limiter.
	//
	// The valve is the ceiling on the total bill: the per-account budget alone
	// lets N cheap accounts spend N× it, which is exactly what account creation
	// does not prevent. It sits ahead of the per-account limiter for the same
	// memory reason as the auth routes above — allow() allocates a bucket per
	// new key and only sweeps buckets idle for a full window, so a flood of
	// distinct accounts would grow the per-account map without bound if that
	// limiter ran first. Running the valve first also keeps quota fair: a
	// request refused because the server is globally full does not burn the
	// caller's own budget.
	v1.POST("/ai/draft-profile",
		middleware.RequireSession(),
		middleware.RequireVerified(),
		aiGlobalLimiter.MiddlewareFor(middleware.GlobalKey, "rate_limited", middleware.DefaultDraftLimitMessage),
		aiLimiter.Middleware(),
		aiHandler.Draft)

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
		slog.Info("LUMORA API listening", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logging.Fatal("server failed", "err", err)
		}
	}()

	// Railway sends SIGTERM on redeploy: drain in-flight requests before
	// exiting instead of cutting them off.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown failed", "err", err)
	}
	slog.Info("server stopped")
}
