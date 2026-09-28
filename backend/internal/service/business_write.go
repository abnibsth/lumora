package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

// maxSlugAttempts caps the -2, -3, ... suffix loop so a pathological name
// fails loudly instead of looping forever.
const maxSlugAttempts = 100

// Create saves a new profile as a draft owned by userID. Milestones and BMC
// blocks arrive with the profile, so one insert plus the child inserts is the
// whole operation.
func (s *BusinessService) Create(ctx context.Context, userID string, input domain.CreateBusinessInput) (domain.OwnedBusiness, error) {
	if err := input.Validate(); err != nil {
		return domain.OwnedBusiness{}, err
	}
	ownerID, err := ownerUUID(userID)
	if err != nil {
		return domain.OwnedBusiness{}, err
	}

	slug, err := s.uniqueSlug(ctx, input.Name)
	if err != nil {
		return domain.OwnedBusiness{}, err
	}

	row, err := s.repo.InsertBusiness(ctx, store.InsertBusinessParams{
		Slug:             slug,
		OwnerUserID:      ownerID,
		Name:             input.Name,
		Category:         input.Category,
		Location:         input.Location,
		Description:      input.Description,
		Story:            input.Story,
		CoverImage:       input.CoverImage,
		CoverPosition:    input.CoverPosition,
		Logo:             input.Logo,
		FoundedYear:      int32(input.FoundedYear),
		RevenueLabel:     input.RevenueLabel,
		GrowthLabel:      input.GrowthLabel,
		RevenueSeries:    nonNilFloats(input.RevenueSeries),
		Seeking:          nonNilStrings(input.Seeking),
		SeekingObjective: input.SeekingObjective,
		OwnerName:        input.Owner.Name,
		OwnerRole:        input.Owner.Role,
		OwnerBio:         input.Owner.Bio,
		Status:           domain.StatusDraft,
		Verified:         false,
	})
	if isUniqueViolation(err) {
		// Only the slug is unique, and the suffix loop already checked it:
		// this is a concurrent create racing the same name.
		return domain.OwnedBusiness{}, &domain.ValidationError{Message: "Nama profil bentrok dengan profil lain, silakan coba lagi."}
	}
	if err != nil {
		return domain.OwnedBusiness{}, fmt.Errorf("insert business: %w", err)
	}

	if err := s.insertMilestones(ctx, row.ID, input.Milestones); err != nil {
		return domain.OwnedBusiness{}, err
	}
	if err := s.insertBmc(ctx, row.ID, input.BMC); err != nil {
		return domain.OwnedBusiness{}, err
	}

	return s.owned(ctx, row)
}

// Update merges a PATCH payload into a profile owned by userID. slug never
// changes (URLs must stay stable) and ownership never transfers.
func (s *BusinessService) Update(ctx context.Context, userID, id string, input domain.UpdateBusinessInput) (domain.OwnedBusiness, error) {
	if err := input.Validate(); err != nil {
		return domain.OwnedBusiness{}, err
	}
	row, err := s.ownedRow(ctx, userID, id)
	if err != nil {
		return domain.OwnedBusiness{}, err
	}

	merged := row
	if input.Name != nil {
		merged.Name = *input.Name
	}
	if input.Category != nil {
		merged.Category = *input.Category
	}
	if input.Location != nil {
		merged.Location = *input.Location
	}
	if input.Description != nil {
		merged.Description = *input.Description
	}
	if input.Story != nil {
		merged.Story = *input.Story
	}
	if input.CoverImage != nil {
		merged.CoverImage = clearEmpty(input.CoverImage)
	}
	if input.CoverPosition != nil {
		merged.CoverPosition = clearEmpty(input.CoverPosition)
	}
	if input.Logo != nil {
		merged.Logo = clearEmpty(input.Logo)
	}
	if input.FoundedYear != nil {
		merged.FoundedYear = int32(*input.FoundedYear)
	}
	if input.RevenueLabel != nil {
		merged.RevenueLabel = clearEmpty(input.RevenueLabel)
	}
	if input.GrowthLabel != nil {
		merged.GrowthLabel = clearEmpty(input.GrowthLabel)
	}
	if input.RevenueSeries != nil {
		merged.RevenueSeries = nonNilFloats(*input.RevenueSeries)
	}
	if input.Seeking != nil {
		merged.Seeking = nonNilStrings(*input.Seeking)
	}
	if input.SeekingObjective != nil {
		merged.SeekingObjective = clearEmpty(input.SeekingObjective)
	}
	if input.Owner != nil {
		merged.OwnerName = input.Owner.Name
		merged.OwnerRole = input.Owner.Role
		merged.OwnerBio = input.Owner.Bio
	}

	updated, err := s.repo.UpdateBusiness(ctx, updateParams(merged))
	if err != nil {
		return domain.OwnedBusiness{}, fmt.Errorf("update business: %w", err)
	}

	if input.Milestones != nil {
		if err := s.repo.DeleteMilestonesByBusiness(ctx, store.DeleteMilestonesByBusinessParams{BusinessID: updated.ID}); err != nil {
			return domain.OwnedBusiness{}, fmt.Errorf("replace milestones: %w", err)
		}
		if err := s.insertMilestones(ctx, updated.ID, *input.Milestones); err != nil {
			return domain.OwnedBusiness{}, err
		}
	}
	if input.BMC != nil {
		if err := s.repo.DeleteBmcEntriesByBusiness(ctx, store.DeleteBmcEntriesByBusinessParams{BusinessID: updated.ID}); err != nil {
			return domain.OwnedBusiness{}, fmt.Errorf("replace bmc: %w", err)
		}
		if err := s.insertBmc(ctx, updated.ID, *input.BMC); err != nil {
			return domain.OwnedBusiness{}, err
		}
	}

	return s.owned(ctx, updated)
}

// Publish flips a draft to published after checking the stored row is
// complete. Calling it on an already-published profile is a no-op.
func (s *BusinessService) Publish(ctx context.Context, userID, id string) (domain.OwnedBusiness, error) {
	row, err := s.ownedRow(ctx, userID, id)
	if err != nil {
		return domain.OwnedBusiness{}, err
	}
	if row.Status == domain.StatusPublished {
		return s.owned(ctx, row)
	}
	if err := domain.ValidatePublishable(toBusiness(row)); err != nil {
		return domain.OwnedBusiness{}, err
	}

	row.Status = domain.StatusPublished
	published, err := s.repo.UpdateBusiness(ctx, updateParams(row))
	if err != nil {
		return domain.OwnedBusiness{}, fmt.Errorf("publish business: %w", err)
	}
	return s.owned(ctx, published)
}

// ownedRow loads a profile and checks the caller owns it. Missing and
// foreign profiles are told apart so a UUID guess can't confirm a draft exists
// to a stranger while the owner still gets a clear 403.
func (s *BusinessService) ownedRow(ctx context.Context, userID, id string) (store.Business, error) {
	parsed, err := uuid.Parse(id)
	if err != nil {
		return store.Business{}, domain.ErrInvalidParameter
	}

	row, err := s.repo.GetBusinessByID(ctx, store.GetBusinessByIDParams{
		ID: pgtype.UUID{Bytes: parsed, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return store.Business{}, domain.ErrNotFound
	}
	if err != nil {
		return store.Business{}, fmt.Errorf("load business by id: %w", err)
	}
	if !row.OwnerUserID.Valid || keyOf(row.OwnerUserID) != userID {
		return store.Business{}, domain.ErrForbidden
	}
	return row, nil
}

// owned maps a row the caller already owns and re-reads its children, so the
// response always reflects what actually got stored.
func (s *BusinessService) owned(ctx context.Context, row store.Business) (domain.OwnedBusiness, error) {
	items := []domain.Business{toBusiness(row)}
	if err := hydrate(ctx, s.repo, items); err != nil {
		return domain.OwnedBusiness{}, err
	}
	return domain.OwnedBusiness{Business: items[0], Status: row.Status}, nil
}

// uniqueSlug derives a slug from the profile name and appends -2, -3, ... on
// collision instead of failing the create.
func (s *BusinessService) uniqueSlug(ctx context.Context, name string) (string, error) {
	base := slugify(name)
	for attempt := 1; attempt <= maxSlugAttempts; attempt++ {
		candidate := base
		if attempt > 1 {
			candidate = fmt.Sprintf("%s-%d", base, attempt)
		}
		exists, err := s.repo.ExistsBusinessBySlug(ctx, store.ExistsBusinessBySlugParams{Slug: candidate})
		if err != nil {
			return "", fmt.Errorf("check slug: %w", err)
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("no free slug after %d attempts for %q", maxSlugAttempts, base)
}

func (s *BusinessService) insertMilestones(ctx context.Context, businessID pgtype.UUID, items []domain.Milestone) error {
	for position, item := range items {
		if err := s.repo.InsertMilestone(ctx, store.InsertMilestoneParams{
			BusinessID:  businessID,
			Year:        int32(item.Year),
			Title:       item.Title,
			Description: optionalText(item.Description),
			Position:    int32(position),
		}); err != nil {
			return fmt.Errorf("insert milestone: %w", err)
		}
	}
	return nil
}

func (s *BusinessService) insertBmc(ctx context.Context, businessID pgtype.UUID, items []domain.BmcEntry) error {
	for position, item := range items {
		if err := s.repo.InsertBmcEntry(ctx, store.InsertBmcEntryParams{
			BusinessID: businessID,
			Label:      item.Label,
			Value:      item.Value,
			Position:   int32(position),
		}); err != nil {
			return fmt.Errorf("insert bmc entry: %w", err)
		}
	}
	return nil
}

func ownerUUID(userID string) (pgtype.UUID, error) {
	ownerID := parseID(userID)
	if !ownerID.Valid {
		return pgtype.UUID{}, domain.ErrInvalidParameter
	}
	return ownerID, nil
}

// updateParams flattens a (possibly merged) row into the full-row UPDATE.
func updateParams(row store.Business) store.UpdateBusinessParams {
	return store.UpdateBusinessParams{
		ID:               row.ID,
		Name:             row.Name,
		Category:         row.Category,
		Location:         row.Location,
		Description:      row.Description,
		Story:            row.Story,
		CoverImage:       row.CoverImage,
		CoverPosition:    row.CoverPosition,
		Logo:             row.Logo,
		FoundedYear:      row.FoundedYear,
		RevenueLabel:     row.RevenueLabel,
		GrowthLabel:      row.GrowthLabel,
		RevenueSeries:    nonNilFloats(row.RevenueSeries),
		Seeking:          nonNilStrings(row.Seeking),
		SeekingObjective: row.SeekingObjective,
		OwnerName:        row.OwnerName,
		OwnerRole:        row.OwnerRole,
		OwnerBio:         row.OwnerBio,
		Status:           row.Status,
		Verified:         row.Verified,
	}
}

// slugify builds a URL fragment from a profile name: ascii lowercase with
// runs of anything else collapsed into single dashes.
func slugify(value string) string {
	var builder strings.Builder
	lastDash := false
	for _, r := range strings.ToLower(strings.TrimSpace(value)) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			builder.WriteRune(r)
			lastDash = false
		case !lastDash && builder.Len() > 0:
			builder.WriteByte('-')
			lastDash = true
		}
	}
	slug := strings.Trim(builder.String(), "-")
	if slug == "" {
		return "bisnis"
	}
	return slug
}

// nonNilFloats/nonNilStrings keep NOT NULL array columns happy: pgx sends a
// nil slice as NULL, which would violate the constraint.
func nonNilFloats(values []float64) []float64 {
	if values == nil {
		return []float64{}
	}
	return values
}

func nonNilStrings(values []string) []string {
	if values == nil {
		return []string{}
	}
	return values
}

// clearEmpty turns a sent empty string on an optional field into NULL so the
// client can delete a cover, logo, or label.
func clearEmpty(value *string) *string {
	if value == nil || *value == "" {
		return nil
	}
	return value
}
