package middleware

import (
	"math"
	"net/http"
	"strconv"
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
			// Set the header before aborting: AbortWithStatusJSON writes the
			// response, so a later Header call would be dropped.
			c.Header("Retry-After", strconv.Itoa(retryAfterSeconds(wait)))
			abortWithError(c, http.StatusTooManyRequests, "rate_limited", "Terlalu banyak permintaan draf. Coba lagi nanti.")
			return
		}

		c.Next()
	}
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
