package service

import "context"

// VerificationSender is the provider-shaped slice of the email stack
// AuthService needs. Declared on the consumer side, like Drafter, so the
// service compiles with no provider wired and tests can substitute a fake.
//
// It takes a finished link rather than a token so the sender never has to know
// how links are built, and so the stub can log exactly what a real provider
// would deliver.
type VerificationSender interface {
	SendVerification(ctx context.Context, to, link string) error
}
