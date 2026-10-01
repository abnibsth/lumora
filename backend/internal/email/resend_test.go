package email

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newTestResend points a provider at a stub server. Tests live in package email
// so they can swap the unexported baseURL.
func newTestResend(t *testing.T, handler http.HandlerFunc) *Resend {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	r := NewResend("test-key", "")
	r.baseURL = server.URL
	return r
}

// sentEmail is the slice of the request body the tests inspect.
type sentEmail struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text"`
}

func TestResendSendVerificationPostsExpectedRequest(t *testing.T) {
	var (
		gotMethod string
		gotPath   string
		gotAuth   string
		gotType   string
		gotBody   sentEmail
	)

	const (
		to   = "budi@example.com"
		link = "https://app.example/verify-email?token=abc"
	)

	r := newTestResend(t, func(w http.ResponseWriter, req *http.Request) {
		gotMethod = req.Method
		gotPath = req.URL.Path
		gotAuth = req.Header.Get("Authorization")
		gotType = req.Header.Get("Content-Type")
		body, _ := io.ReadAll(req.Body)
		_ = json.Unmarshal(body, &gotBody)
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"id":"3f1c9d2a"}`)
	})

	if err := r.SendVerification(t.Context(), to, link); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotMethod != http.MethodPost {
		t.Errorf("method = %q, want POST", gotMethod)
	}
	if gotPath != "/emails" {
		t.Errorf("path = %q, want /emails", gotPath)
	}
	if gotAuth != "Bearer test-key" {
		t.Errorf("Authorization = %q, want Bearer test-key", gotAuth)
	}
	if gotType != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", gotType)
	}
	if gotBody.From != DefaultResendFrom {
		t.Errorf("from = %q, want %q", gotBody.From, DefaultResendFrom)
	}
	if len(gotBody.To) != 1 || gotBody.To[0] != to {
		t.Errorf("to = %v, want [%s]", gotBody.To, to)
	}
	if gotBody.Subject != verificationSubject {
		t.Errorf("subject = %q, want %q", gotBody.Subject, verificationSubject)
	}
	// The link must be in both parts, so a client that refuses HTML still has a
	// usable link.
	if !strings.Contains(gotBody.HTML, link) {
		t.Errorf("html = %q, want it to carry the link", gotBody.HTML)
	}
	if !strings.Contains(gotBody.Text, link) {
		t.Errorf("text = %q, want it to carry the link", gotBody.Text)
	}
}

func TestResendSendVerificationEscapesLinkInHTML(t *testing.T) {
	var gotBody sentEmail
	const link = "https://app.example/verify-email?token=abc&redirect=dashboard"

	r := newTestResend(t, func(w http.ResponseWriter, req *http.Request) {
		body, _ := io.ReadAll(req.Body)
		_ = json.Unmarshal(body, &gotBody)
		_, _ = io.WriteString(w, `{"id":"x"}`)
	})

	if err := r.SendVerification(t.Context(), "budi@example.com", link); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !strings.Contains(gotBody.HTML, "&amp;") {
		t.Errorf("html = %q, want the ampersand escaped", gotBody.HTML)
	}
	if strings.Contains(gotBody.HTML, "token=abc&redirect") {
		t.Errorf("html = %q, want the raw link escaped", gotBody.HTML)
	}
	// Plain text is not markup, so it keeps the raw link.
	if !strings.Contains(gotBody.Text, link) {
		t.Errorf("text = %q, want the unescaped link", gotBody.Text)
	}
}

func TestResendSendVerificationStatusErrorHidesBody(t *testing.T) {
	const (
		secret = "re_secret_echo_9f3a"
		link   = "https://app.example/verify-email?token=supersecrettoken"
	)

	r := newTestResend(t, func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = io.WriteString(w, `{"name":"restricted_api_key","message":"`+secret+` and the whole payload"}`)
	})

	err := r.SendVerification(t.Context(), "budi@example.com", link)
	if err == nil {
		t.Fatal("expected an error for a non-200 status")
	}
	if strings.Contains(err.Error(), secret) {
		t.Errorf("error leaked the response body: %v", err)
	}
	if strings.Contains(err.Error(), "supersecrettoken") {
		t.Errorf("error leaked the link token: %v", err)
	}
	if !strings.Contains(err.Error(), "403") {
		t.Errorf("error = %v, want it to carry the status", err)
	}
}

func TestResendSendVerificationTransportErrorHidesKey(t *testing.T) {
	r := NewResend("super-secret-key", "")
	// Nothing is listening here.
	r.baseURL = "http://127.0.0.1:1"

	err := r.SendVerification(t.Context(), "budi@example.com", "https://app.example/verify-email?token=abc")
	if err == nil {
		t.Fatal("expected a transport error")
	}
	if strings.Contains(err.Error(), "super-secret-key") {
		t.Errorf("error leaked the API key: %v", err)
	}
}

func TestResendSendVerificationRespectsCancelledContext(t *testing.T) {
	// Like the stub: a cancelled request must not report success, or the
	// service would treat a dead send as delivered.
	called := false
	r := newTestResend(t, func(w http.ResponseWriter, req *http.Request) {
		called = true
		_, _ = io.WriteString(w, `{"id":"x"}`)
	})

	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	err := r.SendVerification(ctx, "budi@example.com", "https://app.example/verify-email?token=abc")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("err = %v, want context.Canceled", err)
	}
	if called {
		t.Error("the provider called the API for a cancelled request")
	}
}

func TestResendSendVerificationRejectsBadSuccessBody(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"not json", `<html>gateway</html>`},
		{"no id", `{}`},
		{"blank id", `{"id":""}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body := tc.body
			r := newTestResend(t, func(w http.ResponseWriter, req *http.Request) {
				_, _ = io.WriteString(w, body)
			})

			if err := r.SendVerification(t.Context(), "budi@example.com", "https://app.example/x"); err == nil {
				t.Fatal("expected an error for a 200 without a usable id")
			}
		})
	}
}

func TestResendSendVerificationFailureLogsNoSecret(t *testing.T) {
	// The log line must carry the enum but never the link, the token, or the
	// recipient: the link is a credential, and the stub's habit of logging it
	// must not leak into the real provider.
	var buf bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewTextHandler(&buf, nil)))
	t.Cleanup(func() { slog.SetDefault(previous) })

	const (
		to   = "budi@example.com"
		link = "https://app.example/verify-email?token=supersecrettoken"
	)

	r := newTestResend(t, func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		_, _ = io.WriteString(w, `{"name":"daily_quota_exceeded"}`)
	})

	if err := r.SendVerification(t.Context(), to, link); err == nil {
		t.Fatal("expected an error")
	}

	logged := buf.String()
	if !strings.Contains(logged, "daily_quota_exceeded") {
		t.Errorf("log line %q does not carry the provider enum", logged)
	}
	for _, secret := range []string{to, "supersecrettoken", link} {
		if strings.Contains(logged, secret) {
			t.Errorf("log line %q leaked %q", logged, secret)
		}
	}
}

func TestNewResendDefaultsFrom(t *testing.T) {
	if got := NewResend("k", "").from; got != DefaultResendFrom {
		t.Errorf("from = %q, want %q", got, DefaultResendFrom)
	}
	if got := NewResend("k", "   ").from; got != DefaultResendFrom {
		t.Errorf("blank from = %q, want %q", got, DefaultResendFrom)
	}
	if got := NewResend("k", "  LUMORA <no-reply@lumora.example>  ").from; got != "LUMORA <no-reply@lumora.example>" {
		t.Errorf("from = %q, want the trimmed value", got)
	}
}

func TestResendErrorName(t *testing.T) {
	cases := []struct {
		name string
		body string
		want string
	}{
		{"restricted key", `{"name":"restricted_api_key","message":"..."}`, "restricted_api_key"},
		{"quota", `{"name":"daily_quota_exceeded"}`, "daily_quota_exceeded"},
		{"not json", `<html>gateway</html>`, ""},
		{"empty", ``, ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := resendErrorName([]byte(tc.body)); got != tc.want {
				t.Errorf("resendErrorName = %q, want %q", got, tc.want)
			}
		})
	}
}

// TestResendSatisfiesSender is a compile-time check that the provider can be
// wired into the service, without importing service here.
func TestResendSatisfiesSender(t *testing.T) {
	var _ interface {
		SendVerification(context.Context, string, string) error
	} = NewResend("k", "")
}
