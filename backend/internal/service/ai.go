package service

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/alfian/lumora/backend/internal/domain"
)

// Drafter is the provider-shaped slice of the AI stack this service needs.
// Declared on the consumer side so the service compiles without any provider
// and tests can substitute a fake — same idea as BusinessRepository.
type Drafter interface {
	Draft(ctx context.Context, in domain.DraftProfileInput) (domain.DraftProfile, error)
}

// DefaultAITimeout caps a single generation so a hung provider cannot hold a
// request open indefinitely.
const DefaultAITimeout = 15 * time.Second

type AIDraftService struct {
	drafter Drafter
	timeout time.Duration
}

func NewAIDraftService(drafter Drafter, timeout time.Duration) *AIDraftService {
	if timeout <= 0 {
		timeout = DefaultAITimeout
	}
	return &AIDraftService{drafter: drafter, timeout: timeout}
}

// Draft validates the narrative, generates a draft and clamps it to the limits
// the write endpoints enforce. Every provider failure collapses into
// domain.ErrAIUnavailable: the HTTP layer only has to map one retryable code,
// and no provider detail reaches the client.
func (s *AIDraftService) Draft(ctx context.Context, in domain.DraftProfileInput) (domain.DraftProfile, error) {
	if err := in.Validate(); err != nil {
		return domain.DraftProfile{}, err
	}

	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	draft, err := s.drafter.Draft(ctx, in)
	if err != nil {
		// The narrative is free text that can carry names and contact details,
		// and a provider error may embed the prompt. Log the shape of the
		// failure and how long it took, never the payload.
		if errors.Is(err, context.DeadlineExceeded) {
			log.Printf("ai draft: provider timed out after %s", s.timeout)
		} else {
			log.Printf("ai draft: provider failed (%T)", err)
		}
		return domain.DraftProfile{}, domain.ErrAIUnavailable
	}

	draft.Sanitize()
	return draft, nil
}
