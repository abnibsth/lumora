package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

// DefaultResendFrom is the sender used when RESEND_FROM is unset. It is Resend's
// own onboarding address, which may only deliver to the address that owns the
// Resend account: any other recipient is refused with 403 restricted_api_key.
// Verifying a domain in Resend and pointing RESEND_FROM at it is what lets the
// sender reach real users.
const DefaultResendFrom = "onboarding@resend.dev"

// resendBaseURL is the public Resend API. Tests point a Resend at an httptest
// server instead by overwriting the field.
const resendBaseURL = "https://api.resend.com"

// resendHTTPTimeout is the real deadline on this path, unlike Gemini's backstop:
// issueVerification forwards the request context unchanged, so nothing else
// bounds the call. Sending mail is quick, and register waits on it, so a stalled
// provider must not hold the response open.
const resendHTTPTimeout = 10 * time.Second

// resendMaxResponseBytes caps how much of a response we will read, in case the
// API answers with something far larger than an id or an error envelope.
const resendMaxResponseBytes = 1 << 16

// Resend sends verification email through Resend's HTTPS API. It is the real
// provider behind EMAIL_PROVIDER=resend; Stub stays for offline runs and tests.
//
// It uses the API rather than SMTP because the platform this runs on blocks
// outbound SMTP below its top plan, and Resend recommends the HTTPS path there.
type Resend struct {
	apiKey  string
	from    string
	baseURL string
	client  *http.Client
}

// NewResend builds a provider. An empty from falls back to DefaultResendFrom.
// The API key is required: cmd/api refuses to boot without one when this
// provider is selected, so an empty key here means a wiring bug.
func NewResend(apiKey, from string) *Resend {
	from = strings.TrimSpace(from)
	if from == "" {
		from = DefaultResendFrom
	}
	return &Resend{
		apiKey:  strings.TrimSpace(apiKey),
		from:    from,
		baseURL: resendBaseURL,
		client:  &http.Client{Timeout: resendHTTPTimeout},
	}
}

// SendVerification implements service.VerificationSender. Every failure —
// transport, HTTP status, an unparseable body — returns an error. The service
// collapses them into domain.ErrEmailUnavailable, so nothing here is retried or
// surfaced directly.
func (r *Resend) SendVerification(ctx context.Context, to, link string) error {
	if err := ctx.Err(); err != nil {
		return err
	}

	body, err := json.Marshal(resendRequest{
		From:    r.from,
		To:      []string{to},
		Subject: verificationSubject,
		HTML:    verificationHTML(link),
		Text:    verificationText(link),
	})
	if err != nil {
		// Cannot happen: a fixed struct plus string fields.
		return fmt.Errorf("resend: encode request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, r.baseURL+"/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("resend: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	// The key rides in a header, never the query string, so it cannot end up in
	// a URL that a transport error prints.
	req.Header.Set("Authorization", "Bearer "+r.apiKey)

	resp, err := r.client.Do(req)
	if err != nil {
		// Wrap with %w so the service still sees context.DeadlineExceeded.
		return fmt.Errorf("resend: call: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Read a bounded slice of the body so the connection can be reused, but
		// keep it out of the returned error: an API error can quote the request,
		// which quotes the recipient. The log line carries only the status and
		// Resend's fixed error enum — never the link, the token, or the address,
		// because the link is a credential.
		errBody, _ := io.ReadAll(io.LimitReader(resp.Body, resendMaxResponseBytes))
		slog.Error("resend send failed",
			"status", resp.StatusCode,
			"provider_status", resendErrorName(errBody),
		)
		return fmt.Errorf("resend: status %d", resp.StatusCode)
	}

	var payload resendResponse
	if err := json.NewDecoder(io.LimitReader(resp.Body, resendMaxResponseBytes)).Decode(&payload); err != nil {
		return fmt.Errorf("resend: decode response: %w", err)
	}
	if payload.ID == "" {
		return fmt.Errorf("resend: response has no id")
	}
	return nil
}

// resendRequest is the POST /emails body. Both html and text are sent so a
// client that refuses HTML still shows a usable link.
type resendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text"`
}

// resendResponse is the slice of a successful response we read. Anything else
// in the payload is ignored.
type resendResponse struct {
	ID string `json:"id"`
}

// resendErrorBody is the error envelope. Only the fixed name enum is read; the
// message is ignored because it can quote the request.
type resendErrorBody struct {
	Name string `json:"name"`
}

// resendErrorName extracts the error enum (validation_error,
// restricted_api_key, daily_quota_exceeded, ...) for the log line. An
// unparseable body yields "", which is not worth reporting.
func resendErrorName(body []byte) string {
	var payload resendErrorBody
	if err := json.Unmarshal(body, &payload); err != nil {
		return ""
	}
	return payload.Name
}

// verificationSubject is the subject line shared by every provider.
const verificationSubject = "Verifikasi email Anda di LUMORA"

// verificationHTML renders the verification mail. The link is HTML-escaped
// because it lands inside href: the token part is base64url and safe, but the
// base URL is operator-configured and an & in it would break the markup.
//
// The copy deliberately states no validity window: the TTL lives in
// service.VerificationTTL, and this package must not import service just to
// quote the number, or the two would drift.
func verificationHTML(link string) string {
	escaped := html.EscapeString(link)
	return fmt.Sprintf(`<!doctype html>
<html lang="id">
<body style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.6;">
  <p>Halo,</p>
  <p>Terima kasih sudah mendaftar di LUMORA. Klik tombol di bawah ini untuk memverifikasi alamat email Anda.</p>
  <p>
    <a href="%s" style="display: inline-block; padding: 12px 20px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px;">Verifikasi email</a>
  </p>
  <p>Kalau tombolnya tidak berfungsi, salin dan tempel tautan berikut di browser Anda:</p>
  <p><a href="%s">%s</a></p>
  <p>Kalau Anda tidak merasa mendaftar di LUMORA, abaikan saja email ini.</p>
  <p>Salam,<br>Tim LUMORA</p>
</body>
</html>`, escaped, escaped, escaped)
}

// verificationText is the plain-text alternative, markup-free and unescaped.
func verificationText(link string) string {
	return fmt.Sprintf(`Halo,

Terima kasih sudah mendaftar di LUMORA. Buka tautan berikut untuk memverifikasi alamat email Anda:

%s

Kalau Anda tidak merasa mendaftar di LUMORA, abaikan saja email ini.

Salam,
Tim LUMORA`, link)
}
