package service

import (
	"context"
	"errors"
	"testing"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

type fakeBookmarkStore struct {
	rows     map[string][]store.Business
	inserted []store.InsertBookmarkParams
	deleted  []store.DeleteBookmarkParams
}

func newFakeBookmarkStore() *fakeBookmarkStore {
	return &fakeBookmarkStore{rows: map[string][]store.Business{}}
}

func (f *fakeBookmarkStore) ListBookmarks(_ context.Context, arg store.ListBookmarksParams) ([]store.Business, error) {
	return f.rows[keyOf(arg.UserID)], nil
}

func (f *fakeBookmarkStore) InsertBookmark(_ context.Context, arg store.InsertBookmarkParams) error {
	f.inserted = append(f.inserted, arg)
	return nil
}

func (f *fakeBookmarkStore) DeleteBookmark(_ context.Context, arg store.DeleteBookmarkParams) error {
	f.deleted = append(f.deleted, arg)
	return nil
}

func TestBookmarkListHydratesChildren(t *testing.T) {
	repo := newFixture()
	bookmarks := newFakeBookmarkStore()
	bookmarks.rows[ownerID] = []store.Business{repo.bySlug["kopi-ruang-senja"]}
	svc := NewBookmarkService(bookmarks, repo)

	got, err := svc.List(context.Background(), ownerID)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got.Total != 1 || len(got.Items) != 1 {
		t.Errorf("total=%d items=%d, want 1/1", got.Total, len(got.Items))
	}
	if len(got.Items[0].Milestones) != 1 || len(got.Items[0].BMC) != 1 {
		t.Errorf("children not hydrated: milestones=%d bmc=%d",
			len(got.Items[0].Milestones), len(got.Items[0].BMC))
	}
}

func TestBookmarkListEmptyIsNotNil(t *testing.T) {
	svc := NewBookmarkService(newFakeBookmarkStore(), newFixture())

	got, err := svc.List(context.Background(), ownerID)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got.Total != 0 || got.Items == nil {
		t.Errorf("total=%d items=%v, want 0 and a non-nil empty slice", got.Total, got.Items)
	}
}

func TestBookmarkAddRequiresPublishedProfile(t *testing.T) {
	bookmarks := newFakeBookmarkStore()
	svc := NewBookmarkService(bookmarks, newFixture())

	if err := svc.Add(context.Background(), ownerID, "tidak-ada"); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("unknown slug err = %v, want ErrNotFound", err)
	}
	if err := svc.Add(context.Background(), ownerID, "  "); !errors.Is(err, domain.ErrInvalidParameter) {
		t.Errorf("empty slug err = %v, want ErrInvalidParameter", err)
	}
	if len(bookmarks.inserted) != 0 {
		t.Errorf("inserted %d rows, want none", len(bookmarks.inserted))
	}
}

func TestBookmarkAddStoresForCaller(t *testing.T) {
	repo := newFixture()
	bookmarks := newFakeBookmarkStore()
	svc := NewBookmarkService(bookmarks, repo)
	wantBusiness := repo.bySlug["kopi-ruang-senja"]

	if err := svc.Add(context.Background(), ownerID, "kopi-ruang-senja"); err != nil {
		t.Fatalf("Add: %v", err)
	}
	if len(bookmarks.inserted) != 1 {
		t.Fatalf("inserted %d rows, want 1", len(bookmarks.inserted))
	}
	got := bookmarks.inserted[0]
	if keyOf(got.UserID) != ownerID {
		t.Errorf("user_id = %s, want %s", keyOf(got.UserID), ownerID)
	}
	if got.BusinessID != wantBusiness.ID {
		t.Errorf("business_id = %s, want %s", keyOf(got.BusinessID), keyOf(wantBusiness.ID))
	}

	// Repeating is a no-op at the service level (the ON CONFLICT clause
	// absorbs it), so no error and still exactly one recorded insert.
	if err := svc.Add(context.Background(), ownerID, "kopi-ruang-senja"); err != nil {
		t.Errorf("second Add: %v", err)
	}
}

func TestBookmarkRemoveIsIdempotent(t *testing.T) {
	bookmarks := newFakeBookmarkStore()
	svc := NewBookmarkService(bookmarks, newFixture())

	if err := svc.Remove(context.Background(), ownerID, "sudah-hilang"); err != nil {
		t.Errorf("Remove unknown slug err = %v, want nil (idempotent)", err)
	}
	if err := svc.Remove(context.Background(), ownerID, ""); !errors.Is(err, domain.ErrInvalidParameter) {
		t.Errorf("empty slug err = %v, want ErrInvalidParameter", err)
	}
	if len(bookmarks.deleted) != 1 || bookmarks.deleted[0].Slug != "sudah-hilang" {
		t.Errorf("deleted = %+v, want one row for sudah-hilang", bookmarks.deleted)
	}
	if !bookmarks.deleted[0].UserID.Valid {
		t.Error("delete was issued without a valid user id")
	}
}
