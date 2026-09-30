// Package email holds verification-email senders. Resend is the real provider
// behind EMAIL_PROVIDER=resend; Stub is the offline stand-in kept for local runs
// and tests. Both satisfy service.VerificationSender and are wired in
// cmd/api/main.go.
package email

import (
	"context"
	"log/slog"
)

// Stub writes the verification link to the log instead of sending it. It makes
// no network call, so the flow and its tests work without a provider or
// credentials — copy the link out of the API log to finish verifying.
//
// It deliberately logs the raw link, so the token lands in the log. That is why
// cmd/api refuses to boot with this sender in production: a verification mail
// that only ever reaches the log leaves real users unable to verify.
type Stub struct {
	logger *slog.Logger
}

// NewStub returns a stub that logs through the default logger, so it follows
// the format cmd/api configured in internal/logging.
func NewStub() *Stub { return &Stub{logger: slog.Default()} }

// SendVerification implements the sender the auth service depends on.
func (s *Stub) SendVerification(ctx context.Context, to, link string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	s.logger.Info("email stub: verification link", "to", to, "link", link)
	return nil
}
