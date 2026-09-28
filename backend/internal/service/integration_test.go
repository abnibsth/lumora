//go:build integration

package service

// Integration tests run against the real Postgres instead of the fakes used
// everywhere else: they are the only ones exercising the generated SQL, array
// columns, ON CONFLICT, unique violations, and cascading deletes.
//
// Run with:
//
//	go test -tags integration ./internal/service -run Integration -v
//
// TEST_DATABASE_URL overrides the local default. The suite skips itself when
// Postgres is unreachable, and every row it creates is deleted on cleanup so
// the 9 seeded profiles stay untouched.

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

const defaultTestDSN = "postgres://lumora:lumora@localhost:5432/lumora?sslmode=disable"

func openTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = defaultTestDSN
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Skipf("postgres tidak tersedia: %v", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		t.Skipf("postgres tidak terjangkau: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// uniqueName guarantees slug and email uniqueness across runs without
// touching the seeded rows.
func uniqueName(prefix string) string {
	return fmt.Sprintf("%s %d", prefix, time.Now().UnixNano())
}

// createTestOwner registers a throwaway account so owned rows satisfy the
// real foreign key, and deletes it when the test ends (sessions and bookmarks
// cascade).
func createTestOwner(t *testing.T, pool *pgxpool.Pool, queries *store.Queries) string {
	t.Helper()

	user, _, err := NewAuthService(queries, queries).Register(context.Background(), domain.RegisterParams{
		Name:     "Uji Owner",
		Email:    uniqueName("uji-owner") + "@example.com",
		Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register owner: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM users WHERE id = $1", user.ID)
	})
	return user.ID
}

func TestIntegrationBusinessLifecycle(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	svc := NewBusinessService(queries)
	owner := createTestOwner(t, pool, queries)

	before := publishedTotal(t, ctx, svc)

	name := uniqueName("Uji Lifecycle")
	input := validCreateInput()
	input.Name = name

	created, err := svc.Create(ctx, owner, input)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM businesses WHERE id = $1", created.ID)
	})

	if created.Status != domain.StatusDraft {
		t.Errorf("status = %q, want draft", created.Status)
	}
	if got := publishedTotal(t, ctx, svc); got != before {
		t.Errorf("draft leaked into the public list: total %d -> %d", before, got)
	}
	if _, err := svc.BySlug(ctx, created.Slug); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("BySlug on draft err = %v, want ErrNotFound", err)
	}

	updated, err := svc.Update(ctx, owner, created.ID, domain.UpdateBusinessInput{})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if updated.Slug != created.Slug || updated.Status != domain.StatusDraft {
		t.Errorf("slug=%q status=%q, want unchanged", updated.Slug, updated.Status)
	}

	published, err := svc.Publish(ctx, owner, created.ID)
	if err != nil {
		t.Fatalf("Publish: %v", err)
	}
	if published.Status != domain.StatusPublished {
		t.Errorf("status = %q, want published", published.Status)
	}
	if got := publishedTotal(t, ctx, svc); got != before+1 {
		t.Errorf("published total = %d, want %d", got, before+1)
	}

	detail, err := svc.BySlug(ctx, published.Slug)
	if err != nil {
		t.Fatalf("BySlug after publish: %v", err)
	}
	if len(detail.Milestones) != 2 || len(detail.BMC) != 1 {
		t.Errorf("children from the database: milestones=%d bmc=%d, want 2/1",
			len(detail.Milestones), len(detail.BMC))
	}
}

func TestIntegrationSlugNeverCollidesWithSeed(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	svc := NewBusinessService(queries)
	owner := createTestOwner(t, pool, queries)

	input := validCreateInput()
	input.Name = "Kopi Ruang Senja" // sudah ada di seed

	created, err := svc.Create(ctx, owner, input)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM businesses WHERE id = $1", created.ID)
	})

	if created.Slug == "kopi-ruang-senja" {
		t.Errorf("slug = %q, want a -2 suffix instead of the seeded slug", created.Slug)
	}
}

func TestIntegrationAuthSessionLifecycle(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	svc := NewAuthService(queries, queries)

	email := uniqueName("uji-auth") + "@example.com"
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM users WHERE email = $1", email)
	})

	_, session, err := svc.Register(ctx, domain.RegisterParams{
		Name: "Uji Auth", Email: email, Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}

	// Real unique violation (23505) on users.email, mapped to ErrEmailTaken.
	if _, _, err := svc.Register(ctx, domain.RegisterParams{
		Name: "Lagi", Email: email, Password: "rahasia123",
	}); !errors.Is(err, domain.ErrEmailTaken) {
		t.Errorf("duplicate register err = %v, want ErrEmailTaken", err)
	}

	if _, err := svc.UserByToken(ctx, session.Token); err != nil {
		t.Errorf("UserByToken: %v", err)
	}
	if _, _, err := svc.Login(ctx, domain.LoginParams{Email: email, Password: "salah"}); err == nil {
		t.Error("login with wrong password succeeded")
	}
	if _, _, err := svc.Login(ctx, domain.LoginParams{Email: email, Password: "rahasia123"}); err != nil {
		t.Errorf("login: %v", err)
	}
	if err := svc.Logout(ctx, session.Token); err != nil {
		t.Fatalf("Logout: %v", err)
	}
	if _, err := svc.UserByToken(ctx, session.Token); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("UserByToken after logout err = %v, want ErrUnauthenticated", err)
	}
}

func TestIntegrationBookmarks(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	bookmarks := NewBookmarkService(queries, queries)
	businesses := NewBusinessService(queries)
	user := createTestOwner(t, pool, queries)

	if err := bookmarks.Add(ctx, user, "kopi-ruang-senja"); err != nil {
		t.Fatalf("Add seed slug: %v", err)
	}
	if err := bookmarks.Add(ctx, user, "kopi-ruang-senja"); err != nil {
		t.Errorf("Add again err = %v, want nil (idempotent)", err)
	}

	list, err := bookmarks.List(ctx, user)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if list.Total != 1 || len(list.Items) != 1 {
		t.Fatalf("total=%d items=%d, want 1/1 (ON CONFLICT must not duplicate)", list.Total, len(list.Items))
	}
	if len(list.Items[0].Milestones) == 0 {
		t.Error("bookmark list was not hydrated against the real database")
	}

	// A draft cannot be bookmarked, and it is indistinguishable from "no such
	// profile".
	input := validCreateInput()
	input.Name = uniqueName("Uji Draft")
	draft, err := businesses.Create(ctx, user, input)
	if err != nil {
		t.Fatalf("Create draft: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM businesses WHERE id = $1", draft.ID)
	})
	if err := bookmarks.Add(ctx, user, draft.Slug); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Add draft err = %v, want ErrNotFound", err)
	}

	if err := bookmarks.Remove(ctx, user, "kopi-ruang-senja"); err != nil {
		t.Errorf("Remove: %v", err)
	}
	if err := bookmarks.Remove(ctx, user, "kopi-ruang-senja"); err != nil {
		t.Errorf("Remove again err = %v, want nil (idempotent)", err)
	}
	after, err := bookmarks.List(ctx, user)
	if err != nil {
		t.Fatalf("List after remove: %v", err)
	}
	if after.Total != 0 {
		t.Errorf("total = %d after remove, want 0", after.Total)
	}
}

func TestIntegrationSeedProfilesAreReadable(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	svc := NewBusinessService(store.New(pool))

	if got := publishedTotal(t, ctx, svc); got < 9 {
		t.Errorf("published profiles = %d, want at least the 9 seeded", got)
	}

	detail, err := svc.BySlug(ctx, "kopi-ruang-senja")
	if err != nil {
		t.Fatalf("BySlug seed: %v", err)
	}
	if len(detail.Milestones) == 0 || len(detail.BMC) == 0 {
		t.Errorf("seed hydration empty: milestones=%d bmc=%d", len(detail.Milestones), len(detail.BMC))
	}
	if detail.Owner.Name == "" {
		t.Error("seed owner not mapped")
	}
}

func TestIntegrationListTotalSurvivesEmptyPage(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	svc := NewBusinessService(store.New(pool))

	first, err := svc.List(ctx, domain.BusinessListParams{Limit: MaxLimit})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if first.Total == 0 {
		t.Fatal("expected the seeded profiles to exist")
	}

	// A page past the last row returns no items, but the envelope must still
	// report how many profiles match (regression: total used to collapse to 0).
	far, err := svc.List(ctx, domain.BusinessListParams{Page: 1000, Limit: MaxLimit})
	if err != nil {
		t.Fatalf("List far page: %v", err)
	}
	if len(far.Items) != 0 {
		t.Errorf("items = %d, want 0 on an out-of-range page", len(far.Items))
	}
	if far.Total != first.Total {
		t.Errorf("total = %d on an empty page, want %d", far.Total, first.Total)
	}
}

func publishedTotal(t *testing.T, ctx context.Context, svc *BusinessService) int64 {
	t.Helper()
	list, err := svc.List(ctx, domain.BusinessListParams{Limit: MaxLimit})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	return list.Total
}
