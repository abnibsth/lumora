package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

const (
	DefaultPage  = 1
	DefaultLimit = 12
	MaxLimit     = 50
)

// BusinessRepository is the slice of the sqlc store this service depends on.
// Declaring it here keeps the service compilable without a database and lets
// tests substitute a fake.
type BusinessRepository interface {
	ListPublishedBusinessIDs(ctx context.Context, arg store.ListPublishedBusinessIDsParams) ([]pgtype.UUID, error)
	CountPublishedBusinesses(ctx context.Context, arg store.CountPublishedBusinessesParams) (int64, error)
	GetBusinessesByIDs(ctx context.Context, arg store.GetBusinessesByIDsParams) ([]store.Business, error)
	ListBusinessesByOwner(ctx context.Context, arg store.ListBusinessesByOwnerParams) ([]store.Business, error)
	CountBusinessesByOwner(ctx context.Context, arg store.CountBusinessesByOwnerParams) (int64, error)
	GetPublishedBusinessBySlug(ctx context.Context, arg store.GetPublishedBusinessBySlugParams) (store.Business, error)
	ListMilestonesByBusinessIDs(ctx context.Context, arg store.ListMilestonesByBusinessIDsParams) ([]store.BusinessMilestone, error)
	ListBmcEntriesByBusinessIDs(ctx context.Context, arg store.ListBmcEntriesByBusinessIDsParams) ([]store.BmcEntry, error)
	ExistsBusinessBySlug(ctx context.Context, arg store.ExistsBusinessBySlugParams) (bool, error)
	GetBusinessByID(ctx context.Context, arg store.GetBusinessByIDParams) (store.Business, error)
	InsertBusiness(ctx context.Context, arg store.InsertBusinessParams) (store.Business, error)
	UpdateBusiness(ctx context.Context, arg store.UpdateBusinessParams) (store.Business, error)
	InsertMilestone(ctx context.Context, arg store.InsertMilestoneParams) error
	InsertBmcEntry(ctx context.Context, arg store.InsertBmcEntryParams) error
	DeleteMilestonesByBusiness(ctx context.Context, arg store.DeleteMilestonesByBusinessParams) error
	DeleteBmcEntriesByBusiness(ctx context.Context, arg store.DeleteBmcEntriesByBusinessParams) error
}

type BusinessService struct {
	repo BusinessRepository
	tx   Transactor
}

func NewBusinessService(repo BusinessRepository, tx Transactor) *BusinessService {
	return &BusinessService{repo: repo, tx: tx}
}

// List returns one page of published profiles plus the total match count.
func (s *BusinessService) List(ctx context.Context, p domain.BusinessListParams) (domain.BusinessList, error) {
	if p.Category != "" && !domain.ValidCategory(p.Category) {
		return domain.BusinessList{}, domain.ErrInvalidCategory
	}

	page := p.Page
	if page < 1 {
		page = DefaultPage
	}
	limit := p.Limit
	if limit < 1 {
		limit = DefaultLimit
	}
	if limit > MaxLimit {
		limit = MaxLimit
	}

	// Count first: `total` describes the whole result set, so it cannot come
	// from the paginated rows (an empty page would otherwise report 0).
	filters := store.CountPublishedBusinessesParams{
		Category: optionalText(p.Category),
		Location: optionalText(p.Location),
		Q:        optionalText(p.Query),
	}
	total, err := s.repo.CountPublishedBusinesses(ctx, filters)
	if err != nil {
		return domain.BusinessList{}, fmt.Errorf("count businesses: %w", err)
	}

	list := domain.BusinessList{Items: []domain.Business{}, Total: total, Page: page, Limit: limit}
	if total == 0 {
		return list, nil
	}

	ids, err := s.repo.ListPublishedBusinessIDs(ctx, store.ListPublishedBusinessIDsParams{
		Category: filters.Category,
		Location: filters.Location,
		Q:        filters.Q,
		Offset:   int32((page - 1) * limit),
		Limit:    int32(limit),
	})
	if err != nil {
		return domain.BusinessList{}, fmt.Errorf("list business ids: %w", err)
	}

	models, err := s.repo.GetBusinessesByIDs(ctx, store.GetBusinessesByIDsParams{Column1: ids})
	if err != nil {
		return domain.BusinessList{}, fmt.Errorf("load businesses by ids: %w", err)
	}

	items := make([]domain.Business, 0, len(models))
	for _, model := range models {
		items = append(items, toBusiness(model))
	}
	if err := hydrate(ctx, s.repo, items); err != nil {
		return domain.BusinessList{}, err
	}

	list.Items = items
	return list, nil
}

// BySlug returns one published profile, or domain.ErrNotFound.
func (s *BusinessService) BySlug(ctx context.Context, slug string) (domain.Business, error) {
	if slug == "" {
		return domain.Business{}, domain.ErrInvalidParameter
	}

	model, err := s.repo.GetPublishedBusinessBySlug(ctx, store.GetPublishedBusinessBySlugParams{Slug: slug})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Business{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Business{}, fmt.Errorf("load business by slug: %w", err)
	}

	// hydrate mutates slice elements, so pass the value in a slice and read it
	// back instead of hydrating a copy that gets thrown away.
	items := []domain.Business{toBusiness(model)}
	if err := hydrate(ctx, s.repo, items); err != nil {
		return domain.Business{}, err
	}
	return items[0], nil
}

// ListMine returns every profile owned by userID — drafts included — newest
// first, each item carrying its status. The public list only ever exposes
// published profiles; this is what the owner's dashboard reads.
func (s *BusinessService) ListMine(ctx context.Context, userID string, page, limit int) (domain.OwnedBusinessList, error) {
	ownerID, err := ownerUUID(userID)
	if err != nil {
		return domain.OwnedBusinessList{}, err
	}

	if page < 1 {
		page = DefaultPage
	}
	if limit < 1 {
		limit = DefaultLimit
	}
	if limit > MaxLimit {
		limit = MaxLimit
	}

	total, err := s.repo.CountBusinessesByOwner(ctx, store.CountBusinessesByOwnerParams{OwnerUserID: ownerID})
	if err != nil {
		return domain.OwnedBusinessList{}, fmt.Errorf("count own businesses: %w", err)
	}

	list := domain.OwnedBusinessList{Items: []domain.OwnedBusiness{}, Total: total, Page: page, Limit: limit}
	if total == 0 {
		return list, nil
	}

	rows, err := s.repo.ListBusinessesByOwner(ctx, store.ListBusinessesByOwnerParams{
		OwnerUserID: ownerID,
		Offset:      int32((page - 1) * limit),
		Limit:       int32(limit),
	})
	if err != nil {
		return domain.OwnedBusinessList{}, fmt.Errorf("list own businesses: %w", err)
	}

	// hydrate works on []domain.Business, so map first and carry the status
	// alongside, then zip the two back together.
	businesses := make([]domain.Business, 0, len(rows))
	statuses := make([]string, 0, len(rows))
	for _, row := range rows {
		businesses = append(businesses, toBusiness(row))
		statuses = append(statuses, row.Status)
	}
	if err := hydrate(ctx, s.repo, businesses); err != nil {
		return domain.OwnedBusinessList{}, err
	}

	items := make([]domain.OwnedBusiness, 0, len(businesses))
	for i := range businesses {
		items = append(items, domain.OwnedBusiness{Business: businesses[i], Status: statuses[i]})
	}
	list.Items = items
	return list, nil
}

// hydrate fills milestones and bmc for already-mapped businesses. One pair of
// queries for the whole batch instead of one per card. Shared with the
// bookmark service, so it takes the repository explicitly.
func hydrate(ctx context.Context, repo BusinessRepository, items []domain.Business) error {
	if len(items) == 0 {
		return nil
	}

	ids := make([]pgtype.UUID, 0, len(items))
	for _, item := range items {
		ids = append(ids, parseID(item.ID))
	}

	milestones, err := repo.ListMilestonesByBusinessIDs(ctx, store.ListMilestonesByBusinessIDsParams{Column1: ids})
	if err != nil {
		return fmt.Errorf("load milestones: %w", err)
	}
	entries, err := repo.ListBmcEntriesByBusinessIDs(ctx, store.ListBmcEntriesByBusinessIDsParams{Column1: ids})
	if err != nil {
		return fmt.Errorf("load bmc entries: %w", err)
	}

	milestonesByBusiness := make(map[string][]domain.Milestone, len(items))
	for _, row := range milestones {
		key := keyOf(row.BusinessID)
		milestonesByBusiness[key] = append(milestonesByBusiness[key], domain.Milestone{
			Year:        int(row.Year),
			Title:       row.Title,
			Description: deref(row.Description),
		})
	}
	bmcByBusiness := make(map[string][]domain.BmcEntry, len(items))
	for _, row := range entries {
		key := keyOf(row.BusinessID)
		bmcByBusiness[key] = append(bmcByBusiness[key], domain.BmcEntry{Label: row.Label, Value: row.Value})
	}

	for i := range items {
		key := items[i].ID
		if milestoneRows := milestonesByBusiness[key]; len(milestoneRows) > 0 {
			items[i].Milestones = milestoneRows
		}
		if bmcRows := bmcByBusiness[key]; len(bmcRows) > 0 {
			items[i].BMC = bmcRows
		}
	}
	return nil
}

// toBusiness maps one sqlc row to the API shape. It is the only place that
// knows both representations.
func toBusiness(b store.Business) domain.Business {
	return domain.Business{
		ID:               keyOf(b.ID),
		Slug:             b.Slug,
		Name:             b.Name,
		Category:         b.Category,
		Location:         b.Location,
		Description:      b.Description,
		Story:            b.Story,
		CoverImage:       b.CoverImage,
		CoverPosition:    b.CoverPosition,
		Logo:             b.Logo,
		FoundedYear:      int(b.FoundedYear),
		RevenueLabel:     b.RevenueLabel,
		GrowthLabel:      b.GrowthLabel,
		RevenueSeries:    b.RevenueSeries,
		Seeking:          b.Seeking,
		SeekingObjective: b.SeekingObjective,
		Owner: domain.Owner{
			Name: b.OwnerName,
			Role: b.OwnerRole,
			Bio:  b.OwnerBio,
		},
		Milestones: []domain.Milestone{},
		BMC:        []domain.BmcEntry{},
		Verified:   b.Verified,
	}
}

// optionalText turns an empty filter into a NULL sqlc parameter, which the
// query reads as "no filter".
func optionalText(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func keyOf(id pgtype.UUID) string {
	return uuid.UUID(id.Bytes).String()
}

func parseID(value string) pgtype.UUID {
	parsed, err := uuid.Parse(value)
	if err != nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: parsed, Valid: true}
}

func deref(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
