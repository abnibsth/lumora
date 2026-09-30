package email

import (
	"bytes"
	"context"
	"log/slog"
	"strings"
	"testing"
)

func TestSendVerificationLogsTheLink(t *testing.T) {
	var buf bytes.Buffer
	stub := &Stub{logger: slog.New(slog.NewTextHandler(&buf, nil))}

	const (
		to   = "budi@example.com"
		link = "https://app.example/verify-email?token=abc"
	)
	if err := stub.SendVerification(context.Background(), to, link); err != nil {
		t.Fatalf("SendVerification: %v", err)
	}

	logged := buf.String()
	if !strings.Contains(logged, to) {
		t.Errorf("log line %q does not name the recipient", logged)
	}
	if !strings.Contains(logged, link) {
		t.Errorf("log line %q does not carry the link", logged)
	}
}

func TestSendVerificationRespectsCancelledContext(t *testing.T) {
	// The stub must behave like a real sender: a cancelled request must not
	// report success, or the service would treat a dead send as delivered.
	var buf bytes.Buffer
	stub := &Stub{logger: slog.New(slog.NewTextHandler(&buf, nil))}

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	if err := stub.SendVerification(ctx, "budi@example.com", "link"); err == nil {
		t.Error("SendVerification with a cancelled context returned nil, want the context error")
	}
	if buf.Len() != 0 {
		t.Errorf("the stub logged a link for a cancelled request: %q", buf.String())
	}
}

func TestNewStubIsReadyToUse(t *testing.T) {
	// Guards NewStub wiring its logger; a nil one would panic on the first send.
	if err := NewStub().SendVerification(context.Background(), "budi@example.com", "link"); err != nil {
		t.Errorf("SendVerification: %v", err)
	}
}
