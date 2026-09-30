package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequestIDHeader carries the per-request id back to the client.
const RequestIDHeader = "X-Request-ID"

// requestIDContextKey reuses the contextKey type declared in session.go.
const requestIDContextKey contextKey = "lumora.request_id"

// AccessLog logs one structured line per request, replacing gin.Logger. The id
// is generated locally rather than read from an inbound header: Railway's edge
// rewrites forwarded headers and SetTrustedProxies(nil) leaves only the peer
// address as an honest source, so an attacker-supplied id is not worth echoing.
func AccessLog() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := uuid.NewString()
		c.Set(string(requestIDContextKey), id)
		// Set before Next so the header survives an aborted response.
		c.Writer.Header().Set(RequestIDHeader, id)

		start := time.Now()
		c.Next()

		status := c.Writer.Status()
		slog.Log(c.Request.Context(), statusLevel(status), "request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", status,
			"latency_ms", time.Since(start).Milliseconds(),
			"request_id", id,
		)
	}
}

// RequestID returns the id AccessLog attached to the request, or "" when the
// middleware is not mounted.
func RequestID(c *gin.Context) string {
	value, ok := c.Get(string(requestIDContextKey))
	if !ok {
		return ""
	}
	id, _ := value.(string)
	return id
}

// statusLevel maps an HTTP status to a log level: server faults are errors,
// client faults are warnings, everything else is informational.
func statusLevel(status int) slog.Level {
	switch {
	case status >= 500:
		return slog.LevelError
	case status >= 400:
		return slog.LevelWarn
	default:
		return slog.LevelInfo
	}
}
