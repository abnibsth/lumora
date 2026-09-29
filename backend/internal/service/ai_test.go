package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/alfian/lumora/backend/internal/domain"
)

// fakeDrafter stands in for a provider: canned output, canned error, or a hang
// until the context is cancelled.
type fakeDrafter struct {
	result domain.DraftProfile
	err    error

	blockUntilDone bool

	called   bool
	gotInput domain.DraftProfileInput
}

func (f *fakeDrafter) Draft(ctx context.Context, in domain.DraftProfileInput) (domain.DraftProfile, error) {
	f.called = true
	f.gotInput = in

	if f.blockUntilDone {
		<-ctx.Done()
		return domain.DraftProfile{}, ctx.Err()
	}
	return f.result, f.err
}

func TestAIDraftRejectsInvalidNarrativeWithoutCallingProvider(t *testing.T) {
	drafter := &fakeDrafter{}
	svc := NewAIDraftService(drafter, time.Second)

	_, err := svc.Draft(context.Background(), domain.DraftProfileInput{Narrative: "kopi"})

	var validationErr *domain.ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("err = %v (%T), want *domain.ValidationError", err, err)
	}
	if drafter.called {
		t.Error("provider was called for an invalid narrative")
	}
}

func TestAIDraftPassesNarrativeToProvider(t *testing.T) {
	drafter := &fakeDrafter{}
	svc := NewAIDraftService(drafter, time.Second)

	if _, err := svc.Draft(context.Background(), domain.DraftProfileInput{Narrative: "  kedai kopi di Bandung sejak 2015  "}); err != nil {
		t.Fatalf("Draft: %v", err)
	}
	if drafter.gotInput.Narrative != "kedai kopi di Bandung sejak 2015" {
		t.Errorf("provider got %q, want the trimmed narrative", drafter.gotInput.Narrative)
	}
}

func TestAIDraftSanitizesProviderOutput(t *testing.T) {
	drafter := &fakeDrafter{result: domain.DraftProfile{
		Name:        strings.Repeat("a", domain.MaxNameLength+50),
		Category:    "Pertambangan",
		FoundedYear: 1500,
		Milestones: []domain.Milestone{
			{Year: 2020, Title: "Valid"},
			{Year: 1500, Title: "Tahun di luar rentang"},
		},
	}}
	svc := NewAIDraftService(drafter, time.Second)

	got, err := svc.Draft(context.Background(), domain.DraftProfileInput{Narrative: "kedai kopi di Bandung sejak 2015"})
	if err != nil {
		t.Fatalf("Draft: %v", err)
	}

	if len(got.Name) > domain.MaxNameLength {
		t.Errorf("len(Name) = %d, want <= %d", len(got.Name), domain.MaxNameLength)
	}
	if got.Category != "" {
		t.Errorf("Category = %q, want empty for a value outside the enum", got.Category)
	}
	if got.FoundedYear != 0 {
		t.Errorf("FoundedYear = %d, want 0 for a value outside the range", got.FoundedYear)
	}
	if len(got.Milestones) != 1 || got.Milestones[0].Title != "Valid" {
		t.Errorf("Milestones = %+v, want only the valid entry", got.Milestones)
	}
}

func TestAIDraftNeverReturnsNilSlices(t *testing.T) {
	svc := NewAIDraftService(&fakeDrafter{}, time.Second)

	got, err := svc.Draft(context.Background(), domain.DraftProfileInput{Narrative: "kedai kopi di Bandung sejak 2015"})
	if err != nil {
		t.Fatalf("Draft: %v", err)
	}

	if got.Milestones == nil || got.BMC == nil || got.Seeking == nil || got.Suggestions == nil {
		t.Errorf("nil slice in result: %+v", got)
	}
}

func TestAIDraftMapsProviderErrorToUnavailable(t *testing.T) {
	svc := NewAIDraftService(&fakeDrafter{err: errors.New("provider exploded")}, time.Second)

	_, err := svc.Draft(context.Background(), domain.DraftProfileInput{Narrative: "kedai kopi di Bandung sejak 2015"})

	if !errors.Is(err, domain.ErrAIUnavailable) {
		t.Fatalf("err = %v, want domain.ErrAIUnavailable", err)
	}
}

func TestAIDraftMapsDeadlineExceededToUnavailable(t *testing.T) {
	svc := NewAIDraftService(&fakeDrafter{err: context.DeadlineExceeded}, time.Second)

	_, err := svc.Draft(context.Background(), domain.DraftProfileInput{Narrative: "kedai kopi di Bandung sejak 2015"})

	if !errors.Is(err, domain.ErrAIUnavailable) {
		t.Fatalf("err = %v, want domain.ErrAIUnavailable", err)
	}
}

func TestAIDraftTimesOutAHangingProvider(t *testing.T) {
	svc := NewAIDraftService(&fakeDrafter{blockUntilDone: true}, 20*time.Millisecond)

	done := make(chan error, 1)
	go func() {
		_, err := svc.Draft(context.Background(), domain.DraftProfileInput{Narrative: "kedai kopi di Bandung sejak 2015"})
		done <- err
	}()

	select {
	case err := <-done:
		if !errors.Is(err, domain.ErrAIUnavailable) {
			t.Fatalf("err = %v, want domain.ErrAIUnavailable", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("Draft did not return; the timeout was not applied")
	}
}

func TestAIDraftFallsBackToDefaultTimeout(t *testing.T) {
	for _, timeout := range []time.Duration{0, -time.Second} {
		svc := NewAIDraftService(&fakeDrafter{}, timeout)
		if svc.timeout != DefaultAITimeout {
			t.Errorf("timeout %v gave %v, want DefaultAITimeout", timeout, svc.timeout)
		}
	}
}
