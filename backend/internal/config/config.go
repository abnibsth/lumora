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

// ErrUnknownEmailProvider is returned for an EMAIL_PROVIDER outside
// EmailProviders. Same reasoning as ErrUnknownAIProvider: a typo must not
// silently fall back to the stub and leave real users waiting for a
// verification mail that was only ever printed to the log.
var ErrUnknownEmailProvider = errors.New("EMAIL_PROVIDER tidak dikenal")

// ErrUnknownLogLevel is returned for a LOG_LEVEL outside LogLevels. A typo must
// fail startup rather than silently pick a verbosity, for the same reason the
// provider allowlists exist.
var ErrUnknownLogLevel = errors.New("LOG_LEVEL tidak dikenal")

// ErrMissingGeminiAPIKey is returned when the API starts with the Gemini
// provider selected but no key. Starting anyway would leave every draft request
// answering 503 while the process looks healthy, which is harder to notice than
// a refused boot. Use AI_PROVIDER=stub for a keyless run.
var ErrMissingGeminiAPIKey = errors.New("GEMINI_API_KEY wajib diisi saat AI_PROVIDER=gemini")

// ErrInvalidAIDraftLimit is returned for a non-numeric or non-positive AI
// draft budget, per account or global. Reading a bad value as "unlimited" would
// silently remove the only guard on an endpoint that bills per call.
var ErrInvalidAIDraftLimit = errors.New("batas draf AI harus bilangan bulat positif")

// ErrInvalidAuthLimit is returned for a non-numeric or non-positive auth
// rate-limit value. Reading one as "unlimited" would silently remove a
// brute-force and mass-registration guard, and the failure would look like
// healthy traffic.
var ErrInvalidAuthLimit = errors.New("batas rate-limit auth harus bilangan bulat positif")

// DefaultAIDraftLimitPerHour is the per-account budget for
// POST /api/v1/ai/draft-profile when AI_DRAFT_LIMIT_PER_HOUR is unset.
const DefaultAIDraftLimitPerHour = 20

// DefaultAIDraftGlobalLimitPerHour caps drafts across every account. The
// per-account budget alone lets N accounts spend N×20/hour, so this is the
// ceiling on the total bill when accounts are cheap to create.
const DefaultAIDraftGlobalLimitPerHour = 200

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

// Defaults for the verification endpoints. Verifying is keyed by the token, so
// its only limit is a global valve: it bounds guessing a token, which is the
// one thing a flood of distinct keys could attempt, and a per-token bucket
// would be pointless since a valid token succeeds on its first use.
//
// Resend is the endpoint worth metering per account: each call sends mail to a
// real address, so it is both an outbound-mail cost and a way to spam a user
// who left the tab open. The global valve bounds the total mail a flood of
// accounts can trigger.
const (
	DefaultAuthVerifyGlobalLimit = 300
	DefaultAuthResendLimit       = 3
	DefaultAuthResendGlobalLimit = 100
)

// Defaults for the password-change endpoint. Both checks are argon2 verifies,
// so an authenticated caller could otherwise hammer it to burn CPU and to
// guess the current password. The per-account limit is the one that matters;
// the global valve keeps a flood of accounts from growing the bucket map.
const (
	DefaultAuthPasswordLimit       = 5
	DefaultAuthPasswordGlobalLimit = 100
)

// FrontendBaseURLDefault is where emailed links point when FRONTEND_BASE_URL is
// unset. Local development matches the Vite dev server.
const FrontendBaseURLDefault = "http://localhost:3000"

// AIProviderGemini is the default: the real generator. AIProviderStub is the
// offline generator kept for tests and keyless runs.
const (
	AIProviderGemini = "gemini"
	AIProviderStub   = "stub"
)

// AIProviders lists the draft generators that can actually be wired up. Add a
// value here together with its implementation in cmd/api/main.go.
var AIProviders = []string{AIProviderStub, AIProviderGemini}

// EmailProviderStub is the only sender so far: it prints the verification link
// to the log instead of mailing it. A real provider (SMTP, Resend, ...) is
// added by implementing service.VerificationSender and listing it here.
const EmailProviderStub = "stub"

// EmailProviders lists the verification senders that can be wired up. Add a
// value here together with its implementation in cmd/api/main.go.
var EmailProviders = []string{EmailProviderStub}

// Log levels accepted by LOG_LEVEL. Add a value here together with its case in
// internal/logging.parseLevel.
const (
	LogLevelDebug = "debug"
	LogLevelInfo  = "info"
	LogLevelWarn  = "warn"
	LogLevelError = "error"
)

// LogLevels lists the accepted LOG_LEVEL values.
var LogLevels = []string{LogLevelDebug, LogLevelInfo, LogLevelWarn, LogLevelError}

// DefaultLogLevel is used when LOG_LEVEL is unset.
const DefaultLogLevel = LogLevelInfo

// Config holds everything read from the environment. Outside production,
// values fall back to local-development defaults so `go run ./cmd/api` works
// without a .env file.
type Config struct {
	Port        string
	DatabaseURL string
	AppEnv      string
	// LogLevel is the minimum level the default slog logger emits. Validated
	// against LogLevels here; internal/logging parses it.
	LogLevel     string
	UploadDir    string
	AIProvider   string
	GeminiAPIKey string
	// GeminiModel is passed through as-is; the empty default lives in the ai
	// package next to the provider that uses it.
	GeminiModel string
	// AIDraftLimitPerHour is the per-account draft budget. The window itself is
	// a constant in cmd/api, so this stays a single number to tune.
	AIDraftLimitPerHour int
	// AIDraftGlobalLimitPerHour caps the same endpoint across every account.
	// Also a count only; its window is a constant in cmd/api.
	AIDraftGlobalLimitPerHour int

	// EmailProvider selects the verification sender, like AIProvider does for
	// drafts. FrontendBaseURL is where the emailed link points.
	EmailProvider   string
	FrontendBaseURL string

	// Auth rate limits: per-email counts plus a per-endpoint global valve.
	// Windows live in cmd/api for the same reason as above.
	AuthLoginLimit          int
	AuthRegisterLimit       int
	AuthLoginGlobalLimit    int
	AuthRegisterGlobalLimit int
	// Verification endpoints: a global valve for verify, a per-account limit
	// plus a global valve for resend.
	AuthVerifyGlobalLimit int
	AuthResendLimit       int
	AuthResendGlobalLimit int
	// Password change: a per-account limit plus a global valve, like resend.
	AuthPasswordLimit       int
	AuthPasswordGlobalLimit int
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

	emailProvider := os.Getenv("EMAIL_PROVIDER")
	if emailProvider == "" {
		emailProvider = EmailProviderStub
	}
	if !knownEmailProvider(emailProvider) {
		return Config{}, fmt.Errorf("%w: %q", ErrUnknownEmailProvider, emailProvider)
	}

	frontendBaseURL := strings.TrimSpace(os.Getenv("FRONTEND_BASE_URL"))
	if frontendBaseURL == "" {
		frontendBaseURL = FrontendBaseURLDefault
	}

	logLevel := strings.ToLower(strings.TrimSpace(os.Getenv("LOG_LEVEL")))
	if logLevel == "" {
		logLevel = DefaultLogLevel
	}
	if !knownLogLevel(logLevel) {
		return Config{}, fmt.Errorf("%w: %q", ErrUnknownLogLevel, logLevel)
	}

	aiDraftLimit, err := positiveIntFromEnv("AI_DRAFT_LIMIT_PER_HOUR", DefaultAIDraftLimitPerHour, ErrInvalidAIDraftLimit)
	if err != nil {
		return Config{}, err
	}
	aiDraftGlobalLimit, err := positiveIntFromEnv("AI_DRAFT_GLOBAL_LIMIT_PER_HOUR", DefaultAIDraftGlobalLimitPerHour, ErrInvalidAIDraftLimit)
	if err != nil {
		return Config{}, err
	}

	authLoginLimit, err := positiveIntFromEnv("AUTH_LOGIN_LIMIT_PER_15_MIN", DefaultAuthLoginLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authRegisterLimit, err := positiveIntFromEnv("AUTH_REGISTER_LIMIT_PER_HOUR", DefaultAuthRegisterLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authLoginGlobalLimit, err := positiveIntFromEnv("AUTH_LOGIN_GLOBAL_LIMIT_PER_HOUR", DefaultAuthLoginGlobalLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authRegisterGlobalLimit, err := positiveIntFromEnv("AUTH_REGISTER_GLOBAL_LIMIT_PER_HOUR", DefaultAuthRegisterGlobalLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authVerifyGlobalLimit, err := positiveIntFromEnv("AUTH_VERIFY_GLOBAL_LIMIT_PER_HOUR", DefaultAuthVerifyGlobalLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authResendLimit, err := positiveIntFromEnv("AUTH_RESEND_LIMIT_PER_HOUR", DefaultAuthResendLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authResendGlobalLimit, err := positiveIntFromEnv("AUTH_RESEND_GLOBAL_LIMIT_PER_HOUR", DefaultAuthResendGlobalLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authPasswordLimit, err := positiveIntFromEnv("AUTH_PASSWORD_LIMIT_PER_HOUR", DefaultAuthPasswordLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}
	authPasswordGlobalLimit, err := positiveIntFromEnv("AUTH_PASSWORD_GLOBAL_LIMIT_PER_HOUR", DefaultAuthPasswordGlobalLimit, ErrInvalidAuthLimit)
	if err != nil {
		return Config{}, err
	}

	return Config{
		Port:                      port,
		DatabaseURL:               databaseURL,
		AppEnv:                    appEnv,
		LogLevel:                  logLevel,
		UploadDir:                 uploadDir,
		AIProvider:                aiProvider,
		GeminiAPIKey:              geminiAPIKey,
		GeminiModel:               strings.TrimSpace(os.Getenv("GEMINI_MODEL")),
		AIDraftLimitPerHour:       aiDraftLimit,
		AIDraftGlobalLimitPerHour: aiDraftGlobalLimit,
		EmailProvider:             emailProvider,
		FrontendBaseURL:           frontendBaseURL,
		AuthLoginLimit:            authLoginLimit,
		AuthRegisterLimit:         authRegisterLimit,
		AuthLoginGlobalLimit:      authLoginGlobalLimit,
		AuthRegisterGlobalLimit:   authRegisterGlobalLimit,
		AuthVerifyGlobalLimit:     authVerifyGlobalLimit,
		AuthResendLimit:           authResendLimit,
		AuthResendGlobalLimit:     authResendGlobalLimit,
		AuthPasswordLimit:         authPasswordLimit,
		AuthPasswordGlobalLimit:   authPasswordGlobalLimit,
	}, nil
}

// positiveIntFromEnv reads a positive integer from the environment, falling
// back to fallback when the variable is unset or blank. sentinel names the
// family of variables, so errors.Is can tell a bad auth limit from a bad AI
// budget; the wrapped error names the offending variable so a typo in one does
// not leave the operator guessing which.
func positiveIntFromEnv(name string, fallback int, sentinel error) (int, error) {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil || parsed <= 0 {
		return 0, fmt.Errorf("%w: %s=%q", sentinel, name, raw)
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

func knownEmailProvider(provider string) bool {
	for _, known := range EmailProviders {
		if provider == known {
			return true
		}
	}
	return false
}

func knownLogLevel(level string) bool {
	for _, known := range LogLevels {
		if level == known {
			return true
		}
	}
	return false
}

func (c Config) IsProduction() bool {
	return c.AppEnv == "production"
}
