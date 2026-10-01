package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

const (
	ownerID = "4f446e73-4e11-46f7-9b6b-35a1585bdf3c"
	otherID = "11111111-2222-3333-4444-555555555555"
)

// newEmptyRepo is an empty fake: the write tests build their own data and
// need full control over which slugs are already taken.
func newEmptyRepo() *fakeRepo {
	return &fakeRepo{
		byID:       map[string]store.Business{},
		bySlug:     map[string]store.Business{},
		milestones: map[string][]store.BusinessMilestone{},
		bmc:        map[string][]store.BmcEntry{},
	}
}

func validCreateInput() domain.CreateBusinessInput {
	return domain.CreateBusinessInput{
		Name:          "Kopi Ruang Senja",
		Category:      "F&B",
		Location:      "Bandung",
		Description:   "Kedai kopi kecil dengan biji lokal pilihan.",
		Story:         "Berawal dari garasi rumah pada 2023.",
		FoundedYear:   2023,
		RevenueSeries: []float64{120, 150, 180},
		Seeking:       []string{"Mitra Ekspansi"},
		Owner:         domain.Owner{Name: "Raka", Role: "Pendiri", Bio: "Pecinta kopi."},
		Milestones: []domain.Milestone{
			{Year: 2023, Title: "Usaha mulai berjalan"},
			{Year: 2024, Title: "Cabang kedua"},
		},
		BMC: []domain.BmcEntry{
			{Label: "Proposisi Nilai", Value: "Kopi lokal terbaik"},
		},
	}
}

func TestCreateSavesDraftOwnedByCaller(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)

	created, err := svc.Create(context.Background(), ownerID, validCreateInput())
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.Status != domain.StatusDraft {
		t.Errorf("status = %q, want draft", created.Status)
	}
	if created.Slug != "kopi-ruang-senja" {
		t.Errorf("slug = %q, want kopi-ruang-senja", created.Slug)
	}
	if created.ID == "" || created.ID == "00000000-0000-0000-0000-000000000000" {
		t.Errorf("id = %q, want a real uuid", created.ID)
	}
	if len(created.Milestones) != 2 {
		t.Errorf("milestones = %d, want 2", len(created.Milestones))
	}
	if len(created.BMC) != 1 {
		t.Errorf("bmc = %d, want 1", len(created.BMC))
	}

	row, err := repo.GetBusinessByID(context.Background(), store.GetBusinessByIDParams{ID: parseID(created.ID)})
	if err != nil {
		t.Fatalf("GetBusinessByID: %v", err)
	}
	if !row.OwnerUserID.Valid || keyOf(row.OwnerUserID) != ownerID {
		t.Errorf("owner = %v, want %s", row.OwnerUserID, ownerID)
	}
	if row.Status != domain.StatusDraft {
		t.Errorf("stored status = %q, want draft", row.Status)
	}
}

func TestCreateGeneratesUniqueSlug(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)

	input := validCreateInput()
	if _, err := svc.Create(context.Background(), ownerID, input); err != nil {
		t.Fatalf("first Create: %v", err)
	}
	second, err := svc.Create(context.Background(), ownerID, input)
	if err != nil {
		t.Fatalf("second Create: %v", err)
	}
	if second.Slug != "kopi-ruang-senja-2" {
		t.Errorf("slug = %q, want kopi-ruang-senja-2", second.Slug)
	}
}

func TestCreateRejectsInvalidPayload(t *testing.T) {
	svc := newService(newFixture())

	cases := []struct {
		name   string
		mutate func(*domain.CreateBusinessInput)
	}{
		{"empty name", func(i *domain.CreateBusinessInput) { i.Name = "  " }},
		{"missing story", func(i *domain.CreateBusinessInput) { i.Story = "" }},
		{"founded year zero", func(i *domain.CreateBusinessInput) { i.FoundedYear = 0 }},
		{"negative revenue point", func(i *domain.CreateBusinessInput) { i.RevenueSeries = []float64{-1} }},
		{"too many milestones", func(i *domain.CreateBusinessInput) {
			i.Milestones = make([]domain.Milestone, domain.MaxMilestones+1)
			for j := range i.Milestones {
				i.Milestones[j] = domain.Milestone{Year: 2024, Title: "x"}
			}
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			input := validCreateInput()
			tc.mutate(&input)
			_, err := svc.Create(context.Background(), ownerID, input)
			var validationErr *domain.ValidationError
			if !errors.As(err, &validationErr) {
				t.Errorf("err = %v, want *domain.ValidationError", err)
			}
		})
	}
}

// Categories get their own sentinel so the HTTP layer can answer with the
// invalid_category code, same as the list endpoint does for filters.
func TestCreateRejectsUnknownCategory(t *testing.T) {
	svc := newService(newFixture())

	input := validCreateInput()
	input.Category = "Lainnya"
	_, err := svc.Create(context.Background(), ownerID, input)
	if !errors.Is(err, domain.ErrInvalidCategory) {
		t.Errorf("err = %v, want domain.ErrInvalidCategory", err)
	}
}

func TestUpdateRequiresOwnership(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)
	created, err := svc.Create(context.Background(), ownerID, validCreateInput())
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	name := "Nama Baru"
	if _, err := svc.Update(context.Background(), otherID, created.ID, domain.UpdateBusinessInput{Name: &name}); !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("other user err = %v, want ErrForbidden", err)
	}
	if _, err := svc.Update(context.Background(), ownerID, "bukan-uuid", domain.UpdateBusinessInput{Name: &name}); !errors.Is(err, domain.ErrInvalidParameter) {
		t.Errorf("bad id err = %v, want ErrInvalidParameter", err)
	}
	if _, err := svc.Update(context.Background(), ownerID, otherID, domain.UpdateBusinessInput{Name: &name}); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("missing id err = %v, want ErrNotFound", err)
	}
}

func TestUpdateMergesOnlySentFields(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)
	created, err := svc.Create(context.Background(), ownerID, validCreateInput())
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	emptyLogo := ""
	updated, err := svc.Update(context.Background(), ownerID, created.ID, domain.UpdateBusinessInput{
		Name:       strPtr("Kopi Ruang Senja 2"),
		CoverImage: strPtr("https://cdn.example.com/cover.jpg"),
		Logo:       &emptyLogo,
	})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if updated.Name != "Kopi Ruang Senja 2" {
		t.Errorf("name = %q", updated.Name)
	}
	if updated.Slug != created.Slug {
		t.Errorf("slug changed to %q, want stable %q", updated.Slug, created.Slug)
	}
	if updated.Category != "F&B" || updated.Story != validCreateInput().Story {
		t.Errorf("unsent fields were touched: category=%q story=%q", updated.Category, updated.Story)
	}
	if updated.CoverImage == nil || *updated.CoverImage != "https://cdn.example.com/cover.jpg" {
		t.Errorf("coverImage = %v, want the sent URL", updated.CoverImage)
	}
	if updated.Logo != nil {
		t.Errorf("logo = %v, want nil (empty string clears it)", updated.Logo)
	}
	if len(updated.Milestones) != 2 {
		t.Errorf("milestones = %d, want untouched 2", len(updated.Milestones))
	}
	if updated.Status != domain.StatusDraft {
		t.Errorf("status = %q, want still draft", updated.Status)
	}
}

func TestUpdateReplacesChildrenWhenSent(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)
	created, err := svc.Create(context.Background(), ownerID, validCreateInput())
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	newMilestones := []domain.Milestone{{Year: 2025, Title: "Mulai ekspor"}}
	newBmc := []domain.BmcEntry{{Label: "Segmen Pelanggan", Value: "Anak muda"}}
	updated, err := svc.Update(context.Background(), ownerID, created.ID, domain.UpdateBusinessInput{
		Milestones: &newMilestones,
		BMC:        &newBmc,
	})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if len(updated.Milestones) != 1 || updated.Milestones[0].Title != "Mulai ekspor" {
		t.Errorf("milestones = %+v, want the replaced list", updated.Milestones)
	}
	if len(updated.BMC) != 1 || updated.BMC[0].Label != "Segmen Pelanggan" {
		t.Errorf("bmc = %+v, want the replaced list", updated.BMC)
	}
}

func TestPublishPromotesAndRejectsStrangers(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)
	created, err := svc.Create(context.Background(), ownerID, validCreateInput())
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if _, err := svc.Publish(context.Background(), otherID, created.ID); !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("other user err = %v, want ErrForbidden", err)
	}

	published, err := svc.Publish(context.Background(), ownerID, created.ID)
	if err != nil {
		t.Fatalf("Publish: %v", err)
	}
	if published.Status != domain.StatusPublished {
		t.Errorf("status = %q, want published", published.Status)
	}

	// Idempotent: publishing twice stays published and does not error.
	again, err := svc.Publish(context.Background(), ownerID, created.ID)
	if err != nil {
		t.Fatalf("second Publish: %v", err)
	}
	if again.Status != domain.StatusPublished {
		t.Errorf("status = %q, want published", again.Status)
	}
}

func TestPublishRequiresCompleteProfile(t *testing.T) {
	repo := newFixture()
	svc := newService(repo)

	// A draft missing its story, as if written directly to the database.
	row := newBusiness(uuid.New(), "belum-lengkap")
	row.Status = domain.StatusDraft
	row.Story = ""
	row.OwnerUserID = parseID(ownerID)
	repo.byID[keyOf(row.ID)] = row

	if _, err := svc.Publish(context.Background(), ownerID, keyOf(row.ID)); err == nil {
		t.Fatal("Publish on incomplete draft returned no error")
	} else {
		var validationErr *domain.ValidationError
		if !errors.As(err, &validationErr) {
			t.Errorf("err = %v, want *domain.ValidationError", err)
		}
	}
}

func TestArchiveHidesProfileFromEveryWritePath(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)
	created, err := svc.Create(context.Background(), ownerID, validCreateInput())
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if err := svc.Archive(context.Background(), ownerID, created.ID); err != nil {
		t.Fatalf("Archive: %v", err)
	}

	row, err := repo.GetBusinessByID(context.Background(), store.GetBusinessByIDParams{ID: parseID(created.ID)})
	if err != nil {
		t.Fatalf("GetBusinessByID: %v", err)
	}
	if row.Status != domain.StatusArchived {
		t.Errorf("stored status = %q, want archived", row.Status)
	}

	// The row survives, but every write path treats it as gone. Republishing
	// must not be a way back.
	name := "Nama Baru"
	if _, err := svc.Update(context.Background(), ownerID, created.ID, domain.UpdateBusinessInput{Name: &name}); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Update err = %v, want ErrNotFound", err)
	}
	if _, err := svc.Publish(context.Background(), ownerID, created.ID); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Publish err = %v, want ErrNotFound", err)
	}
	if err := svc.Archive(context.Background(), ownerID, created.ID); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("second Archive err = %v, want ErrNotFound", err)
	}
}

func TestArchiveRequiresOwnership(t *testing.T) {
	repo := newEmptyRepo()
	svc := newService(repo)
	created, err := svc.Create(context.Background(), ownerID, validCreateInput())
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if err := svc.Archive(context.Background(), otherID, created.ID); !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("other user err = %v, want ErrForbidden", err)
	}
	if err := svc.Archive(context.Background(), ownerID, "bukan-uuid"); !errors.Is(err, domain.ErrInvalidParameter) {
		t.Errorf("bad id err = %v, want ErrInvalidParameter", err)
	}
	if err := svc.Archive(context.Background(), ownerID, otherID); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("missing id err = %v, want ErrNotFound", err)
	}
}

func TestArchiveRefusesOwnerlessProfile(t *testing.T) {
	repo := newFixture()
	svc := newService(repo)

	// A seeded demo row has a NULL owner, so no account may archive it.
	row := newBusiness(uuid.New(), "profil-seed")
	repo.byID[keyOf(row.ID)] = row

	if err := svc.Archive(context.Background(), ownerID, keyOf(row.ID)); !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("err = %v, want ErrForbidden", err)
	}
}

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Kopi Ruang Senja":       "kopi-ruang-senja",
		"  Toko!!  Serba  Ada  ": "toko-serba-ada",
		"UMKM-Bersama":           "umkm-bersama",
		"***":                    "bisnis",
		"":                       "bisnis",
	}
	for input, want := range cases {
		if got := slugify(input); got != want {
			t.Errorf("slugify(%q) = %q, want %q", input, got, want)
		}
	}
}

func strPtr(value string) *string { return &value }
