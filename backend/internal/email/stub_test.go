package email

import (
	"context"
	"fmt"
	"strings"
	"testing"
)

func TestSendVerificationLogsTheLink(t *testing.T) {
	var lines []string
	stub := &Stub{logf: func(format string, args ...any) {
		lines = append(lines, fmt.Sprintf(format, args...))
	}}

	const (
		to   = "budi@example.com"
		link = "https://app.example/verify-email?token=abc"
	)
	if err := stub.SendVerification(context.Background(), to, link); err != nil {
		t.Fatalf("SendVerification: %v", err)
	}

	if len(lines) != 1 {
		t.Fatalf("logged %d lines, want 1", len(lines))
	}
	if !strings.Contains(lines[0], to) {
		t.Errorf("log line %q does not name the recipient", lines[0])
	}
	if !strings.Contains(lines[0], link) {
		t.Errorf("log line %q does not carry the link", lines[0])
	}
}

func TestSendVerificationRespectsCancelledContext(t *testing.T) {
	// The stub must behave like a real sender: a cancelled request must not
	// report success, or the service would treat a dead send as delivered.
	called := false
	stub := &Stub{logf: func(string, ...any) { called = true }}

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	if err := stub.SendVerification(ctx, "budi@example.com", "link"); err == nil {
		t.Error("SendVerification with a cancelled context returned nil, want the context error")
	}
	if called {
		t.Error("the stub logged a link for a cancelled request")
	}
}

func TestNewStubIsReadyToUse(t *testing.T) {
	// Guards NewStub wiring its logf; a nil one would panic on the first send.
	if err := NewStub().SendVerification(context.Background(), "budi@example.com", "link"); err != nil {
		t.Errorf("SendVerification: %v", err)
	}
}
