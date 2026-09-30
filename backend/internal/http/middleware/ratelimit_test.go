package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
)

// testClock is a hand-driven clock, injected the same way AuthService injects
// its own (internal/service/auth.go). Without it, refill assertions would have
// to sleep in real time.
type testClock struct {
	at time.Time
}

func newTestClock() *testClock {
	return &testClock{at: time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC)}
}

func (c *testClock) now() time.Time { return c.at }

func (c *testClock) advance(d time.Duration) { c.at = c.at.Add(d) }

// stubResolver stands in for service.AuthService in the middleware tests.
type stubResolver map[string]domain.User

func (s stubResolver) UserByToken(_ context.Context, token string) (domain.User, error) {
	user, ok := s[token]
	if !ok {
		return domain.User{}, errors.New("session not found")
	}
	return user, nil
}

const (
	tokenA = "token-a"
	tokenB = "token-b"
)

var (
	userA = domain.User{ID: "user-a", Name: "Ayu", Email: "a@example.com"}
	userB = domain.User{ID: "user-b", Name: "Budi", Email: "b@example.com"}
)

// newRateLimitTestRouter mirrors the route wiring in cmd/api/main.go, including
// the ordering that matters: RequireSession before the limiter.
func newRateLimitTestRouter(l *RateLimiter, resolver UserResolver) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	v1 := r.Group("/api/v1", AttachSession(resolver))
	v1.POST("/ai/draft-profile", RequireSession(), l.Middleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

// rateLimitRequest builds a draft request. An empty token sends no cookie,
// which is how the unauthenticated cases are expressed.
func rateLimitRequest(token string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai/draft-profile", nil)
	if token != "" {
		req.AddCookie(&http.Cookie{Name: domain.SessionCookieName, Value: token})
	}
	return req
}

func serve(router *gin.Engine, token string) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, rateLimitRequest(token))
	return recorder
}

func TestNewRateLimiterPanicsOnInvalidArguments(t *testing.T) {
	cases := []struct {
		name  string
		limit int
		per   time.Duration
	}{
		{"zero limit", 0, time.Hour},
		{"negative limit", -5, time.Hour},
		{"zero window", 10, 0},
		{"negative window", 10, -time.Hour},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			defer func() {
				if recover() == nil {
					t.Error("NewRateLimiter did not panic on an invalid argument")
				}
			}()
			NewRateLimiter(tc.limit, tc.per, time.Now)
		})
	}
}

func TestRateLimiterAllowsRequestsUpToCapacity(t *testing.T) {
	l := NewRateLimiter(3, time.Hour, newTestClock().now)

	for i := 0; i < 3; i++ {
		if ok, _ := l.allow("user-a"); !ok {
			t.Fatalf("request %d was denied, want allowed", i+1)
		}
	}
	if ok, _ := l.allow("user-a"); ok {
		t.Error("request 4 was allowed, want denied once the bucket is empty")
	}
}

func TestRateLimiterStartsWithAFullBucket(t *testing.T) {
	l := NewRateLimiter(2, time.Hour, newTestClock().now)

	// A brand-new key must not be punished for never having made a request.
	if ok, _ := l.allow("first-time-user"); !ok {
		t.Error("the first request from a new key was denied, want allowed")
	}
}

func TestRateLimiterRefillsAtTheConfiguredRate(t *testing.T) {
	// 3 per hour means one token every 20 minutes.
	clock := newTestClock()
	l := NewRateLimiter(3, time.Hour, clock.now)

	for i := 0; i < 3; i++ {
		l.allow("user-a")
	}
	if ok, _ := l.allow("user-a"); ok {
		t.Fatal("bucket should be empty")
	}

	// Half a token is not a token. The extra second keeps the assertion off the
	// floating-point boundary.
	clock.advance(10 * time.Minute)
	if ok, _ := l.allow("user-a"); ok {
		t.Error("request was allowed on half a token, want denied")
	}

	clock.advance(10*time.Minute + time.Second)
	if ok, _ := l.allow("user-a"); !ok {
		t.Error("request was denied after a full token accrued, want allowed")
	}
}

func TestRateLimiterCapsRefillAtCapacity(t *testing.T) {
	clock := newTestClock()
	l := NewRateLimiter(3, time.Hour, clock.now)

	for i := 0; i < 3; i++ {
		l.allow("user-a")
	}

	// Idling far longer than the window must not bank tokens beyond capacity.
	clock.advance(48 * time.Hour)

	for i := 0; i < 3; i++ {
		if ok, _ := l.allow("user-a"); !ok {
			t.Fatalf("request %d was denied after a long idle, want allowed", i+1)
		}
	}
	if ok, _ := l.allow("user-a"); ok {
		t.Error("request 4 was allowed, want denied: refill must stop at capacity")
	}
}

func TestRateLimiterReportsRetryAfter(t *testing.T) {
	clock := newTestClock()
	l := NewRateLimiter(1, time.Hour, clock.now)

	l.allow("user-a")

	ok, wait := l.allow("user-a")
	if ok {
		t.Fatal("second request was allowed, want denied")
	}
	if wait <= 0 {
		t.Fatalf("wait = %s, want a positive duration", wait)
	}
	// An empty bucket of a 1-per-hour limit refills in about an hour.
	if wait > time.Hour || wait < 59*time.Minute {
		t.Errorf("wait = %s, want roughly one hour", wait)
	}

	// A partially refilled bucket must report a proportionally shorter wait.
	clock.advance(30 * time.Minute)
	_, wait = l.allow("user-a")
	if wait > 31*time.Minute || wait < 29*time.Minute {
		t.Errorf("wait after half refill = %s, want roughly 30 minutes", wait)
	}
}

func TestRateLimiterKeepsKeysIndependent(t *testing.T) {
	l := NewRateLimiter(1, time.Hour, newTestClock().now)

	if ok, _ := l.allow("user-a"); !ok {
		t.Fatal("user-a first request denied")
	}
	if ok, _ := l.allow("user-a"); ok {
		t.Fatal("user-a second request allowed, want denied")
	}
	if ok, _ := l.allow("user-b"); !ok {
		t.Error("user-b was denied by user-a's spending, want allowed")
	}
}

func TestRateLimiterClampsBackwardsClock(t *testing.T) {
	clock := newTestClock()
	l := NewRateLimiter(2, time.Hour, clock.now)

	l.allow("user-a")
	l.allow("user-a")

	// A clock that steps backwards must not mint tokens, and must not drive the
	// balance negative either.
	clock.advance(-2 * time.Hour)

	if ok, _ := l.allow("user-a"); ok {
		t.Error("request was allowed after the clock moved backwards, want denied")
	}
	if got := l.buckets["user-a"].tokens; got < 0 {
		t.Errorf("tokens = %v, want >= 0", got)
	}
}

func TestRateLimiterEvictsIdleEntries(t *testing.T) {
	clock := newTestClock()
	l := NewRateLimiter(1, time.Hour, clock.now)

	l.allow("stale")
	clock.advance(2 * time.Hour) // idle for longer than one full window

	// The sweep runs on the insert path, so drive it to the next multiple.
	for i := 0; i < sweepEvery-1; i++ {
		l.allow(fmt.Sprintf("fresh-%d", i))
	}

	if _, ok := l.buckets["stale"]; ok {
		t.Error("an entry idle for two windows survived the sweep, want evicted")
	}
}

func TestRateLimiterKeepsEntriesWithinTTL(t *testing.T) {
	clock := newTestClock()
	l := NewRateLimiter(1, time.Hour, clock.now)

	l.allow("recent")
	clock.advance(30 * time.Minute) // idle for less than one window

	for i := 0; i < sweepEvery-1; i++ {
		l.allow(fmt.Sprintf("fresh-%d", i))
	}

	// Evicting a still-drained bucket would recreate it full on the next
	// request, which is a free reset. The TTL must therefore be a full window.
	if _, ok := l.buckets["recent"]; !ok {
		t.Error("an entry idle for half a window was evicted, want kept")
	}
}

func TestRateLimiterConcurrentRequestsDoNotExceedCapacity(t *testing.T) {
	const (
		capacity = 50
		callers  = 200
	)

	// The real clock: this test is about lost updates, not refill. One token
	// takes 72 seconds to accrue, so refill cannot mask the result.
	l := NewRateLimiter(capacity, time.Hour, time.Now)

	var allowed atomic.Int64
	var wg sync.WaitGroup
	start := make(chan struct{})

	for i := 0; i < callers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			if ok, _ := l.allow("shared-key"); ok {
				allowed.Add(1)
			}
		}()
	}

	close(start)
	wg.Wait()

	if got := allowed.Load(); got != capacity {
		t.Errorf("allowed = %d, want exactly %d", got, capacity)
	}
}

func TestRateLimiterConcurrentDistinctKeys(t *testing.T) {
	const callers = 200

	l := NewRateLimiter(1, time.Hour, time.Now)

	var allowed atomic.Int64
	var wg sync.WaitGroup
	start := make(chan struct{})

	for i := 0; i < callers; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start
			if ok, _ := l.allow(fmt.Sprintf("user-%d", i)); ok {
				allowed.Add(1)
			}
		}(i)
	}

	close(start)
	wg.Wait()

	// Every key is distinct and starts full, so nothing may be denied — and the
	// race detector should see no concurrent map writes.
	if got := allowed.Load(); got != callers {
		t.Errorf("allowed = %d, want %d", got, callers)
	}
}

func TestRateLimitMiddlewarePassesRequestsUnderTheLimit(t *testing.T) {
	l := NewRateLimiter(3, time.Hour, newTestClock().now)
	router := newRateLimitTestRouter(l, stubResolver{tokenA: userA})

	for i := 0; i < 3; i++ {
		recorder := serve(router, tokenA)
		if recorder.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200 (body: %s)", i+1, recorder.Code, recorder.Body)
		}
	}
}

func TestRateLimitMiddlewareReturns429WhenBucketIsEmpty(t *testing.T) {
	l := NewRateLimiter(1, time.Hour, newTestClock().now)
	router := newRateLimitTestRouter(l, stubResolver{tokenA: userA})

	if recorder := serve(router, tokenA); recorder.Code != http.StatusOK {
		t.Fatalf("first request: status = %d, want 200", recorder.Code)
	}

	recorder := serve(router, tokenA)
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("second request: status = %d, want 429 (body: %s)", recorder.Code, recorder.Body)
	}

	// Same envelope as every other error, so the frontend needs no special case.
	var body struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v (body: %s)", err, recorder.Body)
	}
	if body.Error.Code != "rate_limited" {
		t.Errorf("code = %q, want %q", body.Error.Code, "rate_limited")
	}
	if body.Error.Message == "" {
		t.Error("message is empty, want a human-readable Indonesian message")
	}
}

func TestRateLimitMiddlewareSetsRetryAfterInWholeSeconds(t *testing.T) {
	// A 2048-second window keeps the refill rate an exact power of two, so the
	// expected header is the true value and not a floating-point artefact.
	clock := newTestClock()
	l := NewRateLimiter(1, 2048*time.Second, clock.now)
	router := newRateLimitTestRouter(l, stubResolver{tokenA: userA})

	serve(router, tokenA) // spend the only token

	recorder := serve(router, tokenA)
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", recorder.Code)
	}
	if got := recorder.Header().Get("Retry-After"); got != "2048" {
		t.Errorf("Retry-After = %q, want %q", got, "2048")
	}

	// Half a token accrued means half the wait, still in whole seconds.
	clock.advance(1024 * time.Second)
	recorder = serve(router, tokenA)
	if got := recorder.Header().Get("Retry-After"); got != "1024" {
		t.Errorf("Retry-After after half refill = %q, want %q", got, "1024")
	}
}

func TestRateLimitMiddlewareKeysPerUser(t *testing.T) {
	l := NewRateLimiter(1, time.Hour, newTestClock().now)
	router := newRateLimitTestRouter(l, stubResolver{tokenA: userA, tokenB: userB})

	if recorder := serve(router, tokenA); recorder.Code != http.StatusOK {
		t.Fatalf("user-a first request: status = %d, want 200", recorder.Code)
	}
	if recorder := serve(router, tokenA); recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("user-a second request: status = %d, want 429", recorder.Code)
	}

	// user-a being throttled must not touch user-b's budget.
	if recorder := serve(router, tokenB); recorder.Code != http.StatusOK {
		t.Errorf("user-b request: status = %d, want 200", recorder.Code)
	}
}

func TestRateLimitMiddlewareDoesNotSpendBudgetOnUnauthenticatedRequests(t *testing.T) {
	l := NewRateLimiter(1, time.Hour, newTestClock().now)
	router := newRateLimitTestRouter(l, stubResolver{tokenA: userA})

	// RequireSession runs first, so these never reach the limiter.
	for i := 0; i < 5; i++ {
		if recorder := serve(router, ""); recorder.Code != http.StatusUnauthorized {
			t.Fatalf("unauthenticated request %d: status = %d, want 401", i+1, recorder.Code)
		}
	}

	// The account must still have its full budget.
	if recorder := serve(router, tokenA); recorder.Code != http.StatusOK {
		t.Errorf("authenticated request: status = %d, want 200 — the limiter metered an unauthenticated caller", recorder.Code)
	}
}

func TestRateLimitMiddlewareFailsClosedWithoutAUser(t *testing.T) {
	// Deliberately mounted without RequireSession, which is a wiring mistake.
	// It must refuse rather than meter every caller under the key "".
	gin.SetMode(gin.TestMode)
	l := NewRateLimiter(1, time.Hour, time.Now)

	r := gin.New()
	r.POST("/ai/draft-profile", l.Middleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	recorder := httptest.NewRecorder()
	r.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/ai/draft-profile", nil))

	if recorder.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", recorder.Code)
	}
}

func TestRequireSessionKeepsTheStandardErrorEnvelope(t *testing.T) {
	// Guards the abortWithError refactor: the 401 body is a documented contract.
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/private", RequireSession(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	recorder := httptest.NewRecorder()
	r.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/private", nil))

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}

	var body struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v (body: %s)", err, recorder.Body)
	}
	if body.Error.Code != "unauthenticated" {
		t.Errorf("code = %q, want %q", body.Error.Code, "unauthenticated")
	}
	if body.Error.Message != "Silakan masuk terlebih dahulu." {
		t.Errorf("message = %q, want the documented Indonesian message", body.Error.Message)
	}
}

// --- MiddlewareFor: the key-agnostic variant used by the auth endpoints ---

// authTestMessage mirrors the shared auth message in cmd/api/main.go.
const authTestMessage = "Terlalu banyak percobaan. Coba lagi nanti."

// newAuthRateLimitTestRouter mirrors the auth wiring in cmd/api/main.go: the
// global valve mounted ahead of the per-email limiter, in that order. The stub
// handler binds the body exactly as the real handler does, so a middleware that
// fails to restore it surfaces as a bind failure instead of passing silently.
func newAuthRateLimitTestRouter(global, perEmail *RateLimiter) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/v1/auth/login",
		global.MiddlewareFor(GlobalKey, "rate_limited", authTestMessage),
		perEmail.MiddlewareFor(EmailKey, "rate_limited", authTestMessage),
		func(c *gin.Context) {
			var params domain.LoginParams
			if err := c.ShouldBindJSON(&params); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "invalid_body"}})
				return
			}
			c.JSON(http.StatusOK, gin.H{"email": params.Email})
		})
	return r
}

// loginBody builds a well-formed login body for one address.
func loginBody(email string) string {
	return fmt.Sprintf(`{"email":%q,"password":"rahasia123"}`, email)
}

func serveAuth(router *gin.Engine, body string) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(body)))
	return recorder
}

// emailKeyContext runs EmailKey against a bare body, for the unit-level cases.
func emailKeyContext(body string) *gin.Context {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(body))
	return c
}

func TestMiddlewareForPassesRequestsUnderTheLimit(t *testing.T) {
	router := newAuthRateLimitTestRouter(
		NewRateLimiter(100, time.Hour, newTestClock().now),
		NewRateLimiter(3, time.Hour, newTestClock().now),
	)

	for i := 0; i < 3; i++ {
		recorder := serveAuth(router, loginBody("a@example.com"))
		if recorder.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200 (body: %s)", i+1, recorder.Code, recorder.Body)
		}
	}
}

func TestMiddlewareForReturns429EnvelopeAndRetryAfter(t *testing.T) {
	// A 2048-second window keeps the refill rate an exact power of two, so the
	// expected header is the true value and not a floating-point artefact.
	router := newAuthRateLimitTestRouter(
		NewRateLimiter(100, time.Hour, newTestClock().now),
		NewRateLimiter(1, 2048*time.Second, newTestClock().now),
	)

	if recorder := serveAuth(router, loginBody("a@example.com")); recorder.Code != http.StatusOK {
		t.Fatalf("first request: status = %d, want 200", recorder.Code)
	}

	recorder := serveAuth(router, loginBody("a@example.com"))
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("second request: status = %d, want 429 (body: %s)", recorder.Code, recorder.Body)
	}
	if got := recorder.Header().Get("Retry-After"); got != "2048" {
		t.Errorf("Retry-After = %q, want %q", got, "2048")
	}

	// Same envelope as every other error, so the frontend needs no special case.
	var body struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v (body: %s)", err, recorder.Body)
	}
	if body.Error.Code != "rate_limited" {
		t.Errorf("code = %q, want %q", body.Error.Code, "rate_limited")
	}
	if body.Error.Message != authTestMessage {
		t.Errorf("message = %q, want the configured %q", body.Error.Message, authTestMessage)
	}
}

func TestMiddlewareForUsesTheConfiguredMessage(t *testing.T) {
	// Guards against the message being hardcoded the way Middleware's is: the
	// auth message differs from the draft one, so it must come from the caller.
	gin.SetMode(gin.TestMode)
	const custom = "Pesan khusus untuk uji."

	l := NewRateLimiter(1, time.Hour, newTestClock().now)
	r := gin.New()
	r.POST("/x", l.MiddlewareFor(GlobalKey, "rate_limited", custom), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	call := func() *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		r.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/x", nil))
		return recorder
	}

	call() // spend the only token
	recorder := call()
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", recorder.Code)
	}

	var body struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body.Error.Message != custom {
		t.Errorf("message = %q, want the configured %q", body.Error.Message, custom)
	}
}

func TestMiddlewareForKeysPerEmail(t *testing.T) {
	router := newAuthRateLimitTestRouter(
		NewRateLimiter(100, time.Hour, newTestClock().now),
		NewRateLimiter(1, time.Hour, newTestClock().now),
	)

	if recorder := serveAuth(router, loginBody("a@example.com")); recorder.Code != http.StatusOK {
		t.Fatalf("a@example.com first request: status = %d, want 200", recorder.Code)
	}
	if recorder := serveAuth(router, loginBody("a@example.com")); recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("a@example.com second request: status = %d, want 429", recorder.Code)
	}

	// One address being throttled must not touch another's budget.
	if recorder := serveAuth(router, loginBody("b@example.com")); recorder.Code != http.StatusOK {
		t.Errorf("b@example.com request: status = %d, want 200", recorder.Code)
	}
}

func TestMiddlewareForSharesABucketAcrossEmailSpellings(t *testing.T) {
	router := newAuthRateLimitTestRouter(
		NewRateLimiter(100, time.Hour, newTestClock().now),
		NewRateLimiter(1, time.Hour, newTestClock().now),
	)

	if recorder := serveAuth(router, loginBody("ada@example.com")); recorder.Code != http.StatusOK {
		t.Fatalf("first spelling: status = %d, want 200", recorder.Code)
	}

	// Same address, different spelling: it must hit the bucket the first
	// request drained, otherwise normalization in EmailKey is not working.
	if recorder := serveAuth(router, loginBody("  ADA@Example.COM ")); recorder.Code != http.StatusTooManyRequests {
		t.Errorf("second spelling: status = %d, want 429 — spellings did not share a bucket", recorder.Code)
	}
}

func TestMiddlewareForRestoresBodyForTheHandler(t *testing.T) {
	router := newAuthRateLimitTestRouter(
		NewRateLimiter(100, time.Hour, newTestClock().now),
		NewRateLimiter(10, time.Hour, newTestClock().now),
	)

	const raw = "Ada@Example.com "
	recorder := serveAuth(router, loginBody(raw))
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 — the handler could not read the body it was given (body: %s)", recorder.Code, recorder.Body)
	}

	var body struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v (body: %s)", err, recorder.Body)
	}
	// Verbatim, not normalized: normalization is the service's job, and the
	// middleware must hand the handler exactly the bytes that arrived.
	if body.Email != raw {
		t.Errorf("handler saw email %q, want %q", body.Email, raw)
	}
}

func TestMiddlewareForSkipsRequestsWithoutAUsableEmail(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"malformed JSON", "{not json"},
		{"missing email", `{"password":"rahasia123"}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			// One token, two requests: if the request were metered under a
			// shared key the second would be 429. Metering unparseable bodies
			// together would hand an attacker a global lockout for the price of
			// bad JSON, so they must be skipped and left to the handler's 400.
			router := newAuthRateLimitTestRouter(
				NewRateLimiter(100, time.Hour, newTestClock().now),
				NewRateLimiter(1, time.Hour, newTestClock().now),
			)

			for i := 0; i < 2; i++ {
				recorder := serveAuth(router, tc.body)
				if recorder.Code == http.StatusTooManyRequests {
					t.Fatalf("request %d was metered, want it skipped (body: %s)", i+1, recorder.Body)
				}
			}
		})
	}
}

func TestEmailKeyNormalizesEmail(t *testing.T) {
	cases := []struct {
		name string
		body string
		want string
	}{
		{"already normal", `{"email":"a@example.com"}`, "a@example.com"},
		{"uppercase folded", `{"email":"ADA@EXAMPLE.COM"}`, "ada@example.com"},
		{"surrounding space trimmed", `{"email":"  a@example.com  "}`, "a@example.com"},
		{"both", `{"email":" Ada@Example.COM "}`, "ada@example.com"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := EmailKey(emailKeyContext(tc.body))
			if !ok {
				t.Fatalf("EmailKey(%s) reported no key, want %q", tc.body, tc.want)
			}
			if got != tc.want {
				t.Errorf("EmailKey(%s) = %q, want %q", tc.body, got, tc.want)
			}
		})
	}
}

func TestEmailKeyRejectsUnusableBodies(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"malformed JSON", "{not json"},
		{"missing email", `{"password":"rahasia123"}`},
		{"empty email", `{"email":""}`},
		{"whitespace email", `{"email":"   "}`},
		{"non-string email", `{"email":123}`},
		{"oversized body", `{"email":"` + strings.Repeat("a", maxAuthRequestBytes) + `@example.com"}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if key, ok := EmailKey(emailKeyContext(tc.body)); ok {
				t.Errorf("EmailKey reported key %q, want no usable key", key)
			}
		})
	}
}

func TestEmailKeyRestoresTheBodyItRead(t *testing.T) {
	// A skipped request still has to reach the handler with its bytes intact,
	// otherwise the handler answers 400 for a body that was actually fine.
	body := `{"email":"","password":"rahasia123"}`
	c := emailKeyContext(body)

	if _, ok := EmailKey(c); ok {
		t.Fatal("EmailKey accepted an empty email")
	}

	restored, err := io.ReadAll(c.Request.Body)
	if err != nil {
		t.Fatalf("read restored body: %v", err)
	}
	if string(restored) != body {
		t.Errorf("restored body = %q, want %q", restored, body)
	}
}

func TestAuthGlobalValveRunsBeforeThePerEmailBucket(t *testing.T) {
	// The valve holds one token while each address has ten. A second request
	// from a *different* address must still be refused: only the valve can
	// produce that, so it proves the mounting order.
	router := newAuthRateLimitTestRouter(
		NewRateLimiter(1, time.Hour, newTestClock().now),
		NewRateLimiter(10, time.Hour, newTestClock().now),
	)

	if recorder := serveAuth(router, loginBody("a@example.com")); recorder.Code != http.StatusOK {
		t.Fatalf("first request: status = %d, want 200", recorder.Code)
	}
	if recorder := serveAuth(router, loginBody("b@example.com")); recorder.Code != http.StatusTooManyRequests {
		t.Errorf("second request from a fresh address: status = %d, want 429 from the valve", recorder.Code)
	}
}

func TestAuthGlobalValveIsSharedAcrossEmails(t *testing.T) {
	router := newAuthRateLimitTestRouter(
		NewRateLimiter(2, time.Hour, newTestClock().now),
		NewRateLimiter(10, time.Hour, newTestClock().now),
	)

	for i, email := range []string{"a@example.com", "b@example.com"} {
		if recorder := serveAuth(router, loginBody(email)); recorder.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200", i+1, recorder.Code)
		}
	}
	if recorder := serveAuth(router, loginBody("c@example.com")); recorder.Code != http.StatusTooManyRequests {
		t.Errorf("third distinct address: status = %d, want 429 — the valve is not shared", recorder.Code)
	}
}

func TestAuthGlobalValveBoundsPerEmailBucketGrowth(t *testing.T) {
	// This is why the valve is mounted first. allow() allocates a bucket per new
	// key and only sweeps buckets idle for a full window, so a per-email limiter
	// running first would let a flood of distinct addresses grow its map without
	// bound. With the valve ahead of it, the map stays bounded by the valve.
	global := NewRateLimiter(1, time.Hour, newTestClock().now)
	perEmail := NewRateLimiter(10, time.Hour, newTestClock().now)
	router := newAuthRateLimitTestRouter(global, perEmail)

	serveAuth(router, loginBody("a@example.com")) // admitted: allocates one bucket
	for i := 0; i < 50; i++ {
		serveAuth(router, loginBody(fmt.Sprintf("flood-%d@example.com", i)))
	}

	if got := len(perEmail.buckets); got != 1 {
		t.Errorf("per-email buckets = %d, want 1 — the flood reached the per-email limiter", got)
	}
}

// newAIGlobalRateLimitTestRouter mirrors the /ai/draft-profile wiring in
// cmd/api/main.go: RequireSession, then the global valve, then the per-account
// limiter, in that order.
func newAIGlobalRateLimitTestRouter(global, perAccount *RateLimiter, resolver UserResolver) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	v1 := r.Group("/api/v1", AttachSession(resolver))
	v1.POST("/ai/draft-profile",
		RequireSession(),
		global.MiddlewareFor(GlobalKey, "rate_limited", DefaultDraftLimitMessage),
		perAccount.Middleware(),
		func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"ok": true})
		})
	return r
}

func TestAIGlobalValveIsSharedAcrossAccounts(t *testing.T) {
	// The valve holds one token while each account has ten. A second request
	// from a *different* account must still be refused: only the valve can
	// produce that, so it proves the valve is shared and mounted.
	router := newAIGlobalRateLimitTestRouter(
		NewRateLimiter(1, time.Hour, newTestClock().now),
		NewRateLimiter(10, time.Hour, newTestClock().now),
		stubResolver{tokenA: userA, tokenB: userB},
	)

	if recorder := serve(router, tokenA); recorder.Code != http.StatusOK {
		t.Fatalf("first request: status = %d, want 200", recorder.Code)
	}
	if recorder := serve(router, tokenB); recorder.Code != http.StatusTooManyRequests {
		t.Errorf("second request from a fresh account: status = %d, want 429 from the valve", recorder.Code)
	}
}

func TestAIGlobalValveBoundsPerAccountBucketGrowth(t *testing.T) {
	// This is why the valve is mounted first. allow() allocates a bucket per
	// new key and only sweeps buckets idle for a full window, so a per-account
	// limiter running first would let a flood of distinct accounts grow its map
	// without bound. With the valve ahead of it, the map stays bounded by it.
	global := NewRateLimiter(1, time.Hour, newTestClock().now)
	perAccount := NewRateLimiter(10, time.Hour, newTestClock().now)

	resolver := stubResolver{tokenA: userA}
	for i := 0; i < 50; i++ {
		resolver[fmt.Sprintf("flood-token-%d", i)] = domain.User{
			ID:    fmt.Sprintf("flood-user-%d", i),
			Name:  "Flood",
			Email: fmt.Sprintf("flood-%d@example.com", i),
		}
	}
	router := newAIGlobalRateLimitTestRouter(global, perAccount, resolver)

	serve(router, tokenA) // admitted: allocates one bucket
	for i := 0; i < 50; i++ {
		serve(router, fmt.Sprintf("flood-token-%d", i))
	}

	if got := len(perAccount.buckets); got != 1 {
		t.Errorf("per-account buckets = %d, want 1 — the flood reached the per-account limiter", got)
	}
}

func TestAIGlobalValveRunsAfterRequireSession(t *testing.T) {
	// The valve holds one token. An unauthenticated request must be rejected by
	// RequireSession without consuming it, so the next authenticated request
	// still passes.
	router := newAIGlobalRateLimitTestRouter(
		NewRateLimiter(1, time.Hour, newTestClock().now),
		NewRateLimiter(10, time.Hour, newTestClock().now),
		stubResolver{tokenA: userA},
	)

	if recorder := serve(router, ""); recorder.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated request: status = %d, want 401", recorder.Code)
	}
	if recorder := serve(router, tokenA); recorder.Code != http.StatusOK {
		t.Errorf("authenticated request after a 401: status = %d, want 200 — the 401 consumed the valve", recorder.Code)
	}
}

func TestAIGlobalValveReturns429EnvelopeAndRetryAfter(t *testing.T) {
	router := newAIGlobalRateLimitTestRouter(
		NewRateLimiter(1, time.Hour, newTestClock().now),
		NewRateLimiter(10, time.Hour, newTestClock().now),
		stubResolver{tokenA: userA, tokenB: userB},
	)

	serve(router, tokenA) // exhausts the valve
	recorder := serve(router, tokenB)

	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", recorder.Code)
	}
	retryAfter := recorder.Header().Get("Retry-After")
	if seconds, err := strconv.Atoi(retryAfter); err != nil || seconds < 1 {
		t.Errorf("Retry-After = %q, want a positive whole number of seconds", retryAfter)
	}

	var payload struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if payload.Error.Code != "rate_limited" {
		t.Errorf("code = %q, want rate_limited", payload.Error.Code)
	}
	if payload.Error.Message != DefaultDraftLimitMessage {
		t.Errorf("message = %q, want %q", payload.Error.Message, DefaultDraftLimitMessage)
	}
}
