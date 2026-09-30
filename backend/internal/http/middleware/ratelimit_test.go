package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
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
