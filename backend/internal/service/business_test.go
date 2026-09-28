package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

// fakeRepo implements BusinessRepository with plain maps.
type fakeRepo struct {
	rows       []pgtype.UUID
	total      int64
	byID       map[string]store.Business
	bySlug     map[string]store.Business
	milestones map[string][]store.BusinessMilestone
	bmc        map[string][]store.BmcEntry
}

func (f *fakeRepo) ListPublishedBusinessIDs(context.Context, store.ListPublishedBusinessIDsParams) ([]pgtype.UUID, error) {
	return f.rows, nil
}

func (f *fakeRepo) CountPublishedBusinesses(context.Context, store.CountPublishedBusinessesParams) (int64, error) {
	return f.total, nil
}

func (f *fakeRepo) GetBusinessesByIDs(_ context.Context, arg store.GetBusinessesByIDsParams) ([]store.Business, error) {
	var items []store.Business
	for _, id := range arg.Column1 {
		if business, ok := f.byID[keyOf(id)]; ok {
			items = append(items, business)
		}
	}
	return items, nil
}

func (f *fakeRepo) GetPublishedBusinessBySlug(_ context.Context, arg store.GetPublishedBusinessBySlugParams) (store.Business, error) {
	business, ok := f.bySlug[arg.Slug]
	if !ok {
		return store.Business{}, pgx.ErrNoRows
	}
	return business, nil
}

func (f *fakeRepo) ListMilestonesByBusinessIDs(_ context.Context, arg store.ListMilestonesByBusinessIDsParams) ([]store.BusinessMilestone, error) {
	var items []store.BusinessMilestone
	for _, id := range arg.Column1 {
		items = append(items, f.milestones[keyOf(id)]...)
	}
	return items, nil
}

func (f *fakeRepo) ListBmcEntriesByBusinessIDs(_ context.Context, arg store.ListBmcEntriesByBusinessIDsParams) ([]store.BmcEntry, error) {
	var items []store.BmcEntry
	for _, id := range arg.Column1 {
		items = append(items, f.bmc[keyOf(id)]...)
	}
	return items, nil
}

func (f *fakeRepo) ExistsBusinessBySlug(_ context.Context, arg store.ExistsBusinessBySlugParams) (bool, error) {
	_, ok := f.bySlug[arg.Slug]
	return ok, nil
}

func (f *fakeRepo) GetBusinessByID(_ context.Context, arg store.GetBusinessByIDParams) (store.Business, error) {
	business, ok := f.byID[keyOf(arg.ID)]
	if !ok {
		return store.Business{}, pgx.ErrNoRows
	}
	return business, nil
}

func (f *fakeRepo) InsertBusiness(_ context.Context, arg store.InsertBusinessParams) (store.Business, error) {
	if _, taken := f.bySlug[arg.Slug]; taken {
		return store.Business{}, &pgconn.PgError{Code: "23505"}
	}
	row := store.Business{
		ID:               pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Slug:             arg.Slug,
		OwnerUserID:      arg.OwnerUserID,
		Name:             arg.Name,
		Category:         arg.Category,
		Location:         arg.Location,
		Description:      arg.Description,
		Story:            arg.Story,
		CoverImage:       arg.CoverImage,
		CoverPosition:    arg.CoverPosition,
		Logo:             arg.Logo,
		FoundedYear:      arg.FoundedYear,
		RevenueLabel:     arg.RevenueLabel,
		GrowthLabel:      arg.GrowthLabel,
		RevenueSeries:    arg.RevenueSeries,
		Seeking:          arg.Seeking,
		SeekingObjective: arg.SeekingObjective,
		OwnerName:        arg.OwnerName,
		OwnerRole:        arg.OwnerRole,
		OwnerBio:         arg.OwnerBio,
		Status:           arg.Status,
		Verified:         arg.Verified,
	}
	f.byID[keyOf(row.ID)] = row
	f.bySlug[arg.Slug] = row
	return row, nil
}

func (f *fakeRepo) UpdateBusiness(_ context.Context, arg store.UpdateBusinessParams) (store.Business, error) {
	key := keyOf(arg.ID)
	existing, ok := f.byID[key]
	if !ok {
		return store.Business{}, pgx.ErrNoRows
	}
	existing.Name = arg.Name
	existing.Category = arg.Category
	existing.Location = arg.Location
	existing.Description = arg.Description
	existing.Story = arg.Story
	existing.CoverImage = arg.CoverImage
	existing.CoverPosition = arg.CoverPosition
	existing.Logo = arg.Logo
	existing.FoundedYear = arg.FoundedYear
	existing.RevenueLabel = arg.RevenueLabel
	existing.GrowthLabel = arg.GrowthLabel
	existing.RevenueSeries = arg.RevenueSeries
	existing.Seeking = arg.Seeking
	existing.SeekingObjective = arg.SeekingObjective
	existing.OwnerName = arg.OwnerName
	existing.OwnerRole = arg.OwnerRole
	existing.OwnerBio = arg.OwnerBio
	existing.Status = arg.Status
	existing.Verified = arg.Verified
	f.byID[key] = existing
	f.bySlug[existing.Slug] = existing
	return existing, nil
}

func (f *fakeRepo) InsertMilestone(_ context.Context, arg store.InsertMilestoneParams) error {
	key := keyOf(arg.BusinessID)
	f.milestones[key] = append(f.milestones[key], store.BusinessMilestone{
		ID:          pgtype.UUID{Bytes: uuid.New(), Valid: true},
		BusinessID:  arg.BusinessID,
		Year:        arg.Year,
		Title:       arg.Title,
		Description: arg.Description,
		Position:    arg.Position,
	})
	return nil
}

func (f *fakeRepo) InsertBmcEntry(_ context.Context, arg store.InsertBmcEntryParams) error {
	key := keyOf(arg.BusinessID)
	f.bmc[key] = append(f.bmc[key], store.BmcEntry{
		ID:         pgtype.UUID{Bytes: uuid.New(), Valid: true},
		BusinessID: arg.BusinessID,
		Label:      arg.Label,
		Value:      arg.Value,
		Position:   arg.Position,
	})
	return nil
}

func (f *fakeRepo) DeleteMilestonesByBusiness(_ context.Context, arg store.DeleteMilestonesByBusinessParams) error {
	delete(f.milestones, keyOf(arg.BusinessID))
	return nil
}

func (f *fakeRepo) DeleteBmcEntriesByBusiness(_ context.Context, arg store.DeleteBmcEntriesByBusinessParams) error {
	delete(f.bmc, keyOf(arg.BusinessID))
	return nil
}

func newRow(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func newBusiness(id uuid.UUID, slug string) store.Business {
	return store.Business{
		ID:            pgtype.UUID{Bytes: id, Valid: true},
		Slug:          slug,
		Name:          slug,
		Category:      "F&B",
		Location:      "Bandung",
		Description:   "deskripsi",
		Story:         "cerita",
		FoundedYear:   2023,
		RevenueSeries: []float64{1, 2},
		Seeking:       []string{"Mitra Ekspansi"},
		OwnerName:     "Raka",
		OwnerRole:     "Pendiri",
		OwnerBio:      "bio",
		Status:        "published",
	}
}

// fixtureID is the business newFixture creates; shared with bookmarks_test.
var fixtureID = uuid.MustParse("6cceac2f-7a80-4f9e-98ba-391d61be10fc")

func newFixture() *fakeRepo {
	id := fixtureID
	business := newBusiness(id, "kopi-ruang-senja")
	key := keyOf(business.ID)
	return &fakeRepo{
		rows:   []pgtype.UUID{newRow(id)},
		total:  7,
		byID:   map[string]store.Business{key: business},
		bySlug: map[string]store.Business{"kopi-ruang-senja": business},
		milestones: map[string][]store.BusinessMilestone{
			key: {{BusinessID: business.ID, Year: 2023, Title: "Usaha mulai berjalan"}},
		},
		bmc: map[string][]store.BmcEntry{
			key: {{BusinessID: business.ID, Label: "Proposisi Nilai", Value: "value"}},
		},
	}
}

func TestBySlugHydratesChildren(t *testing.T) {
	svc := NewBusinessService(newFixture())

	got, err := svc.BySlug(context.Background(), "kopi-ruang-senja")
	if err != nil {
		t.Fatalf("BySlug: %v", err)
	}
	if len(got.Milestones) != 1 {
		t.Errorf("milestones = %d, want 1 (regression: hydrate used to mutate a copy)", len(got.Milestones))
	}
	if len(got.BMC) != 1 {
		t.Errorf("bmc = %d, want 1", len(got.BMC))
	}
	if got.Owner.Name != "Raka" {
		t.Errorf("owner.name = %q, want %q", got.Owner.Name, "Raka")
	}
}

func TestBySlugNotFound(t *testing.T) {
	svc := NewBusinessService(newFixture())

	_, err := svc.BySlug(context.Background(), "tidak-ada")
	if !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("err = %v, want domain.ErrNotFound", err)
	}
}

func TestListInvalidCategory(t *testing.T) {
	svc := NewBusinessService(newFixture())

	_, err := svc.List(context.Background(), domain.BusinessListParams{Category: "Salah"})
	if !errors.Is(err, domain.ErrInvalidCategory) {
		t.Errorf("err = %v, want domain.ErrInvalidCategory", err)
	}
}

func TestListReturnsTotalAndChildren(t *testing.T) {
	svc := NewBusinessService(newFixture())

	got, err := svc.List(context.Background(), domain.BusinessListParams{})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got.Total != 7 {
		t.Errorf("total = %d, want 7", got.Total)
	}
	if len(got.Items) != 1 {
		t.Fatalf("items = %d, want 1", len(got.Items))
	}
	if len(got.Items[0].Milestones) != 1 || len(got.Items[0].BMC) != 1 {
		t.Errorf("children not hydrated: milestones=%d bmc=%d",
			len(got.Items[0].Milestones), len(got.Items[0].BMC))
	}
}

func TestListEmptyResultKeepsPaginationMeta(t *testing.T) {
	repo := newFixture()
	repo.rows = nil // page past the last row
	svc := NewBusinessService(repo)

	got, err := svc.List(context.Background(), domain.BusinessListParams{Page: 3, Limit: 12})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	// The page is empty, but 7 profiles still match, so total must not collapse
	// to 0 (regression: total used to come from the paginated rows).
	if got.Total != 7 || len(got.Items) != 0 {
		t.Errorf("total=%d items=%d, want 7/0", got.Total, len(got.Items))
	}
	if got.Page != 3 || got.Limit != 12 {
		t.Errorf("page=%d limit=%d, want 3/12 (pagination meta must survive an empty page)", got.Page, got.Limit)
	}
}
