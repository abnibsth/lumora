package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// sweepEvery bounds how often idle buckets are collected. The map only grows
// when a new key arrives, so hanging the sweep off the insert path is enough:
// a stable set of idle keys is already bounded memory. Sweeping on every insert
// would make each request O(keys); never sweeping would let the map grow with
// every account that ever called the endpoint.
const sweepEvery = 256

// DefaultDraftLimitMessage is the 429 message Middleware writes. Exported so
// cmd/api can give the global valve mounted in front of it the same text: both
// limits guard one endpoint, and a client should not be able to tell which one
// it exhausted.
const DefaultDraftLimitMessage = "Terlalu banyak permintaan draf. Coba lagi nanti."

// RateLimiter is a per-key token bucket held in process memory.
//
// It is deliberately not shared across processes. The API runs as a single
// instance (Railway volumes block replicas), so in-memory state is correct
// here; scaling past one replica means moving this to Redis, not adding a lock.
// Limits also reset on every restart, so a redeploy hands every account a full
// bucket — acceptable for an hourly budget, and the reason this design must not
// outlive the single-instance assumption.
type RateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	// capacity is the largest burst allowed, in tokens. rate is the sustained
	// refill, in tokens per second.
	capacity float64
	rate     float64
	// ttl is how long a bucket must sit idle before it can be dropped, and it
	// must never be shorter than a full refill. Evicting a bucket that is still
	// drained would recreate it full on the next request, handing out a free
	// reset and defeating the limit.
	ttl     time.Duration
	now     func() time.Time
	inserts int
}

// bucket is one key's state. Tokens are fractional so refill is smooth instead
// of quantised into whole requests.
type bucket struct {
	tokens float64
	last   time.Time
}

// NewRateLimiter allows limit requests per per, with limit also the burst size.
//
// limit and per must be positive — a zero rate would make Retry-After infinite.
// config.Load rejects those values before they reach here, so this panics only
// on a programming error. now must be non-nil; pass time.Now in production.
func NewRateLimiter(limit int, per time.Duration, now func() time.Time) *RateLimiter {
	if limit <= 0 || per <= 0 {
		panic("middleware: NewRateLimiter needs a positive limit and window")
	}
	return &RateLimiter{
		buckets:  make(map[string]*bucket),
		capacity: float64(limit),
		rate:     float64(limit) / per.Seconds(),
		ttl:      per,
		now:      now,
	}
}

// Middleware meters one request per account. Attach it after RequireSession:
// it keys on the authenticated user, so unauthenticated traffic must be
// rejected first rather than metered under a shared empty key.
func (l *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := CurrentUser(c)
		if !ok {
			// Unreachable while the route also carries RequireSession. Fail
			// closed anyway: silently metering every such request under the
			// key "" would be a strange failure mode, and allowing them would
			// un-meter a paid endpoint if the session check were ever removed.
			abortWithError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
			return
		}

		allowed, wait := l.allow(user.ID)
		if !allowed {
			writeRateLimited(c, wait, "rate_limited", DefaultDraftLimitMessage)
			return
		}

		c.Next()
	}
}

// KeyFunc derives the token-bucket key for one request. ok=false means no
// usable key could be derived, and MiddlewareFor lets that request through
// unmetered.
//
// The two-value form is deliberate. Returning "" to mean "no key" would be
// indistinguishable from a legitimate empty key, which is exactly the
// collapse-everyone-onto-one-bucket failure mode Middleware guards against by
// failing closed.
type KeyFunc func(c *gin.Context) (key string, ok bool)

// MiddlewareFor meters one request per key produced by keyFn, answering 429
// with code and message when that key's bucket is empty. It is the key-agnostic
// counterpart of Middleware.
//
// Unlike Middleware it does NOT fail closed on a missing key: it skips. That
// difference is the whole reason the two exist separately. Middleware guards a
// paid endpoint behind RequireSession, so a missing user is a programming
// error worth a loud 500. MiddlewareFor guards endpoints reachable without a
// session, where the natural key lives in the request body and an unparseable
// body is ordinary client error — the handler rejects it for free with 400.
// Folding both into one function behind a mode flag would make it possible to
// un-meter the paid endpoint by flipping a boolean.
func (l *RateLimiter) MiddlewareFor(keyFn KeyFunc, code, message string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key, ok := keyFn(c)
		if !ok {
			c.Next()
			return
		}

		allowed, wait := l.allow(key)
		if !allowed {
			writeRateLimited(c, wait, code, message)
			return
		}

		c.Next()
	}
}

// maxAuthRequestBytes caps how much of an auth body EmailKey buffers to find
// the email. The largest legitimate register body (100-character name,
// 254-character email, 128-character password, role) is under 1 KB of ASCII
// and roughly 2 KB in worst-case multi-byte UTF-8, so 4 KB is generous
// headroom without letting a client make the middleware buffer megabytes.
// Compare maxDraftRequestBytes (64 KB) in handler/ai.go.
const maxAuthRequestBytes = 4 << 10

// EmailKey meters by the email address in the JSON body, normalized the same
// way domain.RegisterParams.Validate and LoginParams.Validate normalize it, so
// two spellings of one address share a bucket.
//
// It reads the body and puts it back, because the handler's ShouldBindJSON
// reads the same stream afterwards. It deliberately does not validate the
// address: a present-but-malformed email still earns a bucket (bounded by the
// global valve) and the handler rejects it cheaply. Only an absent or
// whitespace-only email counts as no usable key.
//
// ok=false makes the request unmetered rather than collapsing it onto a shared
// key. Metering unparseable bodies under one key would hand an attacker a
// global lockout for the price of sending malformed JSON.
func EmailKey(c *gin.Context) (string, bool) {
	if c.Request.Body == nil {
		return "", false
	}

	body, err := io.ReadAll(http.MaxBytesReader(c.Writer, c.Request.Body, maxAuthRequestBytes))
	// Restore unconditionally, including after a read error: the handler binds
	// from this stream next, and a request we skip must still arrive there with
	// whatever bytes were sent so it can answer 400 itself.
	c.Request.Body = io.NopCloser(bytes.NewReader(body))
	if err != nil {
		return "", false
	}

	var payload struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "", false
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if email == "" {
		return "", false
	}
	return email, true
}

// GlobalKey is the KeyFunc for a per-endpoint "safety valve": every request
// shares one bucket. Mounted ahead of a per-identity limiter it bounds what a
// flood of distinct identities can cost, both in work done and in buckets
// allocated. See the ordering note in cmd/api/main.go.
func GlobalKey(*gin.Context) (string, bool) { return "global", true }

// UserKey is the KeyFunc for metering an authenticated request per account. It
// reads the user AttachSession put in the context, so it must be mounted after
// AttachSession. It exists alongside Middleware for routes whose 429 message is
// not the draft one — resend-verification is not a draft.
func UserKey(c *gin.Context) (string, bool) {
	user, ok := CurrentUser(c)
	if !ok {
		return "", false
	}
	return user.ID, true
}

// allow consumes one token for key, reporting whether the request may proceed
// and, when it may not, how long until a token is available again.
//
// The token is spent before the handler runs, so a rejected request body and a
// provider timeout both cost a token. That is intentional: the provider may
// already have billed us by the time it times out, and refunding would make a
// retry storm free.
func (l *RateLimiter) allow(key string) (bool, time.Duration) {
	now := l.now()

	l.mu.Lock()
	defer l.mu.Unlock()

	b, ok := l.buckets[key]
	if !ok {
		// A new key starts full. Starting empty would answer 429 to every
		// account's very first request.
		b = &bucket{tokens: l.capacity, last: now}
		l.buckets[key] = b
		l.inserts++
		if l.inserts%sweepEvery == 0 {
			l.sweepLocked(now)
		}
	} else if elapsed := now.Sub(b.last); elapsed > 0 {
		// The elapsed > 0 guard is what keeps a clock that steps backwards
		// (an injected test clock, an NTP correction) from draining the bucket.
		b.tokens = min(l.capacity, b.tokens+elapsed.Seconds()*l.rate)
		// Advancing last on denied requests too is correct: the fractional
		// remainder already lives in tokens, so nothing is lost, and an
		// actively throttled account stays fresh instead of being swept.
		b.last = now
	}

	if b.tokens >= 1 {
		b.tokens--
		return true, 0
	}

	return false, time.Duration((1 - b.tokens) / l.rate * float64(time.Second))
}

// sweepLocked drops buckets idle for longer than ttl. The caller must hold mu.
//
// ttl equals one full window, so a bucket this idle is already back at capacity
// and dropping it cannot hand out a free reset. The comparison is strict for
// the same reason: at exactly one window the bucket is only refilled up to
// floating-point rounding.
func (l *RateLimiter) sweepLocked(now time.Time) {
	for key, b := range l.buckets {
		if now.Sub(b.last) > l.ttl {
			delete(l.buckets, key)
		}
	}
}

// writeRateLimited answers 429 for an exhausted bucket. The header must be set
// before aborting, because AbortWithStatusJSON writes the response and a later
// Header call would be dropped.
func writeRateLimited(c *gin.Context, wait time.Duration, code, message string) {
	c.Header("Retry-After", strconv.Itoa(retryAfterSeconds(wait)))
	abortWithError(c, http.StatusTooManyRequests, code, message)
}

// retryAfterSeconds converts a wait into whole seconds, rounded up. Rounding
// down would tell the client to retry before a token exists, earning another
// 429. One second is the floor so the header is never "0".
func retryAfterSeconds(wait time.Duration) int {
	seconds := int(math.Ceil(wait.Seconds()))
	if seconds < 1 {
		return 1
	}
	return seconds
}
