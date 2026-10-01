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

	user, _, err := NewAuthService(queries, queries, queries, &fakeSender{}, "http://localhost:3000").Register(context.Background(), domain.RegisterParams{
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
	svc := NewBusinessService(queries, NewPoolTxRunner(pool))
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
	svc := NewBusinessService(queries, NewPoolTxRunner(pool))
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
	svc := NewAuthService(queries, queries, queries, &fakeSender{}, "http://localhost:3000")

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

// TestIntegrationEmailVerification is the only test that runs the verification
// SQL against the real schema: the token lookup by hash, the consume update,
// and the guarded UPDATE that stamps email_verified_at.
func TestIntegrationEmailVerification(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	sender := &fakeSender{}
	svc := NewAuthService(queries, queries, queries, sender, "http://localhost:3000")

	email := uniqueName("uji-verify") + "@example.com"
	user, _, err := svc.Register(ctx, domain.RegisterParams{
		Name: "Uji Verifikasi", Email: email, Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM users WHERE id = $1", user.ID)
	})

	firstToken := sender.tokenAt(t, 0)

	// Resend drops the pending token, so the first link is dead and only the
	// newest one works — against the real DELETE, not the fake.
	if err := svc.ResendVerification(ctx, user.ID); err != nil {
		t.Fatalf("ResendVerification: %v", err)
	}
	secondToken := sender.lastToken(t)
	if err := svc.VerifyEmail(ctx, firstToken); !errors.Is(err, domain.ErrInvalidToken) {
		t.Errorf("superseded token err = %v, want ErrInvalidToken", err)
	}

	if err := svc.VerifyEmail(ctx, secondToken); err != nil {
		t.Fatalf("VerifyEmail: %v", err)
	}
	row, err := queries.GetUserByID(ctx, store.GetUserByIDParams{ID: parseID(user.ID)})
	if err != nil {
		t.Fatalf("GetUserByID: %v", err)
	}
	if !row.EmailVerifiedAt.Valid {
		t.Error("email_verified_at is still NULL after verification")
	}

	// Idempotent against the real schema too.
	if err := svc.VerifyEmail(ctx, secondToken); err != nil {
		t.Errorf("second VerifyEmail: %v", err)
	}
	if err := svc.ResendVerification(ctx, user.ID); !errors.Is(err, domain.ErrEmailAlreadyVerified) {
		t.Errorf("ResendVerification err = %v, want ErrEmailAlreadyVerified", err)
	}
}

func TestIntegrationBookmarks(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	bookmarks := NewBookmarkService(queries, queries)
	businesses := NewBusinessService(queries, NewPoolTxRunner(pool))
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
	svc := NewBusinessService(store.New(pool), NewPoolTxRunner(pool))

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

func TestIntegrationTxRollsBackOnError(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	runner := NewPoolTxRunner(pool)

	slug := fmt.Sprintf("uji-rollback-%d", time.Now().UnixNano())
	sentinel := errors.New("boom")

	err := runner.RunInTx(ctx, func(repo BusinessRepository) error {
		if _, err := repo.InsertBusiness(ctx, store.InsertBusinessParams{
			Slug:          slug,
			Name:          "Uji Rollback",
			Category:      "F&B",
			Location:      "Bandung",
			Description:   "deskripsi",
			Story:         "cerita",
			FoundedYear:   2023,
			RevenueSeries: []float64{},
			Seeking:       []string{},
			OwnerName:     "Uji",
			OwnerRole:     "Pendiri",
			OwnerBio:      "bio",
			Status:        domain.StatusDraft,
		}); err != nil {
			return err
		}
		return sentinel
	})
	if !errors.Is(err, sentinel) {
		t.Fatalf("RunInTx err = %v, want the sentinel back", err)
	}

	// The insert above must not have survived the rollback.
	exists, err := queries.ExistsBusinessBySlug(ctx, store.ExistsBusinessBySlugParams{Slug: slug})
	if err != nil {
		t.Fatalf("ExistsBusinessBySlug: %v", err)
	}
	if exists {
		t.Errorf("business %q survived a rolled-back transaction", slug)
	}
}

func TestIntegrationListTotalSurvivesEmptyPage(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	svc := NewBusinessService(store.New(pool), NewPoolTxRunner(pool))

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

func TestIntegrationListMineShowsOwnProfilesOnly(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	svc := NewBusinessService(queries, NewPoolTxRunner(pool))
	owner := createTestOwner(t, pool, queries)
	other := createTestOwner(t, pool, queries)

	input := validCreateInput()
	input.Name = uniqueName("Uji Mine")
	created, err := svc.Create(ctx, owner, input)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM businesses WHERE id = $1", created.ID)
	})

	mine, err := svc.ListMine(ctx, owner, 1, MaxLimit)
	if err != nil {
		t.Fatalf("ListMine owner: %v", err)
	}
	if mine.Total != 1 || len(mine.Items) != 1 {
		t.Fatalf("owner total=%d items=%d, want 1/1", mine.Total, len(mine.Items))
	}
	if mine.Items[0].Status != domain.StatusDraft {
		t.Errorf("status = %q, want draft (the owner sees unpublished work)", mine.Items[0].Status)
	}
	if mine.Items[0].Slug != created.Slug {
		t.Errorf("slug = %q, want %q", mine.Items[0].Slug, created.Slug)
	}

	// Another account must not see someone else's draft.
	theirs, err := svc.ListMine(ctx, other, 1, MaxLimit)
	if err != nil {
		t.Fatalf("ListMine other: %v", err)
	}
	if theirs.Total != 0 || len(theirs.Items) != 0 {
		t.Errorf("other total=%d items=%d, want 0/0 (drafts are private)", theirs.Total, len(theirs.Items))
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

// countRows runs a single count query against the real database.
func countRows(t *testing.T, pool *pgxpool.Pool, query, arg string) int64 {
	t.Helper()

	var total int64
	if err := pool.QueryRow(context.Background(), query, arg).Scan(&total); err != nil {
		t.Fatalf("count (%s): %v", query, err)
	}
	return total
}

func TestIntegrationArchiveHidesProfileEverywhere(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	svc := NewBusinessService(queries, NewPoolTxRunner(pool))
	owner := createTestOwner(t, pool, queries)

	before := publishedTotal(t, ctx, svc)

	input := validCreateInput()
	input.Name = uniqueName("Uji Arsip")
	created, err := svc.Create(ctx, owner, input)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM businesses WHERE id = $1", created.ID)
	})

	published, err := svc.Publish(ctx, owner, created.ID)
	if err != nil {
		t.Fatalf("Publish: %v", err)
	}
	if got := publishedTotal(t, ctx, svc); got != before+1 {
		t.Fatalf("published total = %d, want %d", got, before+1)
	}

	if err := svc.Archive(ctx, owner, created.ID); err != nil {
		t.Fatalf("Archive: %v", err)
	}

	// The row is still there — that is the whole point of archiving.
	if got := countRows(t, pool, "SELECT count(*) FROM businesses WHERE id = $1::uuid", created.ID); got != 1 {
		t.Errorf("business rows = %d, want 1 (archived, not deleted)", got)
	}
	if got := publishedTotal(t, ctx, svc); got != before {
		t.Errorf("archived profile is still publicly listed: total %d, want %d", got, before)
	}
	if _, err := svc.BySlug(ctx, published.Slug); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("BySlug on archived err = %v, want ErrNotFound", err)
	}

	mine, err := svc.ListMine(ctx, owner, 1, MaxLimit)
	if err != nil {
		t.Fatalf("ListMine: %v", err)
	}
	if mine.Total != 0 {
		t.Errorf("archived profile still on the dashboard: total %d, want 0", mine.Total)
	}

	if _, err := svc.Publish(ctx, owner, created.ID); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("Publish on archived err = %v, want ErrNotFound (there is no way back)", err)
	}
}

func TestIntegrationDeleteAccountCascadesOwnedRows(t *testing.T) {
	pool := openTestPool(t)
	ctx := context.Background()
	queries := store.New(pool)
	businesses := NewBusinessService(queries, NewPoolTxRunner(pool))
	bookmarks := NewBookmarkService(queries, queries)
	auth := NewAuthService(queries, queries, queries, &fakeSender{}, "http://localhost:3000")

	email := uniqueName("uji-hapus") + "@example.com"
	user, _, err := auth.Register(ctx, domain.RegisterParams{
		Name: "Uji Hapus", Email: email, Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	// Belt and braces: if an assertion fails the account still goes away.
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DELETE FROM users WHERE email = $1", email)
	})

	input := validCreateInput()
	input.Name = uniqueName("Uji Hapus Bisnis")
	created, err := businesses.Create(ctx, user.ID, input)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if _, err := businesses.Publish(ctx, user.ID, created.ID); err != nil {
		t.Fatalf("Publish: %v", err)
	}
	// A bookmark on a seeded profile, so the user also owns a bookmarks row.
	if err := bookmarks.Add(ctx, user.ID, "kopi-ruang-senja"); err != nil {
		t.Fatalf("Add bookmark: %v", err)
	}

	if err := auth.DeleteAccount(ctx, user.ID, domain.DeleteAccountParams{Password: "rahasia123"}); err != nil {
		t.Fatalf("DeleteAccount: %v", err)
	}

	// One DELETE FROM users has to clear the whole footprint through the
	// foreign keys: the account, its session, its bookmark, its profile, and
	// that profile's children.
	cases := []struct {
		name  string
		query string
		arg   string
	}{
		{"user", "SELECT count(*) FROM users WHERE id = $1::uuid", user.ID},
		{"sessions", "SELECT count(*) FROM sessions WHERE user_id = $1::uuid", user.ID},
		{"bookmarks", "SELECT count(*) FROM bookmarks WHERE user_id = $1::uuid", user.ID},
		{"businesses", "SELECT count(*) FROM businesses WHERE owner_user_id = $1::uuid", user.ID},
		{"milestones", "SELECT count(*) FROM business_milestones WHERE business_id = $1::uuid", created.ID},
		{"bmc", "SELECT count(*) FROM bmc_entries WHERE business_id = $1::uuid", created.ID},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := countRows(t, pool, tc.query, tc.arg); got != 0 {
				t.Errorf("%s rows = %d, want 0 after the account was deleted", tc.name, got)
			}
		})
	}
}
