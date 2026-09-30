// Package email holds verification-email senders. Stub is the offline stand-in
// used until a provider is chosen; a real sender is just another type that
// satisfies service.VerificationSender, wired in cmd/api/main.go.
package email

import (
	"context"
	"log"
)

// Stub writes the verification link to the log instead of sending it. It makes
// no network call, so the flow and its tests work without a provider or
// credentials — copy the link out of the API log to finish verifying.
//
// It deliberately logs the raw link, so the token lands in the log. That is
// acceptable while no real provider exists, and it is why cmd/api logs a
// warning when this sender is selected in production.
type Stub struct {
	logf func(string, ...any)
}

func NewStub() *Stub { return &Stub{logf: log.Printf} }

// SendVerification implements the sender the auth service depends on.
func (s *Stub) SendVerification(ctx context.Context, to, link string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	s.logf("email stub: verifikasi untuk %s: %s", to, link)
	return nil
}
