package middleware

import (
	"bytes"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// captureLogs swaps the default logger for one writing to a buffer and
// restores it when the test ends, so subtests do not bleed into each other.
func captureLogs(t *testing.T) *bytes.Buffer {
	t.Helper()

	var buf bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewTextHandler(&buf, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })
	return &buf
}

func TestAccessLogSetsRequestIDHeaderAndContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	buf := captureLogs(t)

	r := gin.New()
	r.Use(AccessLog())

	var seen string
	r.GET("/ping", func(c *gin.Context) {
		seen = RequestID(c)
		c.Status(http.StatusOK)
	})

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/ping", nil))

	header := rec.Header().Get(RequestIDHeader)
	if header == "" {
		t.Fatal("X-Request-ID header is empty")
	}
	if seen != header {
		t.Fatalf("RequestID(c) = %q, want %q (the header)", seen, header)
	}

	logged := buf.String()
	if !strings.Contains(logged, "request_id="+header) {
		t.Fatalf("log line missing request_id %q: %q", header, logged)
	}
	if !strings.Contains(logged, "status=200") {
		t.Fatalf("log line missing status: %q", logged)
	}
}

func TestAccessLogLevelFollowsStatus(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cases := []struct {
		name   string
		status int
		level  string
	}{
		{"ok is info", http.StatusOK, "level=INFO"},
		{"client fault is warn", http.StatusNotFound, "level=WARN"},
		{"server fault is error", http.StatusInternalServerError, "level=ERROR"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			buf := captureLogs(t)

			r := gin.New()
			r.Use(AccessLog())
			r.GET("/x", func(c *gin.Context) { c.Status(tc.status) })

			r.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/x", nil))

			if !strings.Contains(buf.String(), tc.level) {
				t.Fatalf("log = %q, want %s", buf.String(), tc.level)
			}
		})
	}
}
