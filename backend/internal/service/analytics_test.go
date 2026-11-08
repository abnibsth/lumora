package service

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/alfian/lumora/backend/internal/domain"
)

type fakeAnalyticsDB struct {
	businessID   string
	ownerUserID  string
	name         string
	slug         string
	status       string
	existsRecent bool
	views        int64
	visitors     int64
	impressions  int64
	clicks       int64
	bookmarks    int64
	collabs      int64
	recorded     bool
	err          error
}

func (f *fakeAnalyticsDB) QueryRow(_ context.Context, sql string, _ ...any) pgx.Row {
	return &fakeAnalyticsRow{db: f, sql: sql}
}

func (f *fakeAnalyticsDB) Query(_ context.Context, _ string, _ ...any) (pgx.Rows, error) {
	return &fakeAnalyticsRows{}, nil
}

func (f *fakeAnalyticsDB) Exec(_ context.Context, _ string, _ ...any) (pgconn.CommandTag, error) {
	f.recorded = true
	return pgconn.CommandTag{}, f.err
}

type fakeAnalyticsRow struct {
	db  *fakeAnalyticsDB
	sql string
}

func (r *fakeAnalyticsRow) Scan(dest ...any) error {
	if r.db.err != nil {
		return r.db.err
	}

	// Route 1: business lookup
	if len(dest) == 3 {
		*dest[0].(*string) = r.db.businessID
		*dest[1].(*string) = r.db.ownerUserID
		*dest[2].(*string) = r.db.status
		return nil
	}
	// Route 2: full business lookup for analytics
	if len(dest) == 5 {
		*dest[0].(*string) = r.db.businessID
		*dest[1].(*string) = r.db.ownerUserID
		*dest[2].(*string) = r.db.name
		*dest[3].(*string) = r.db.slug
		*dest[4].(*string) = r.db.status
		return nil
	}
	// Route 3: recent exists check
	if len(dest) == 1 {
		switch d := dest[0].(type) {
		case *bool:
			*d = r.db.existsRecent
			return nil
		case *int64:
			*d = r.db.bookmarks
			return nil
		}
	}
	// Route 4: aggregate counts (views, unique, impressions, clicks)
	if len(dest) == 4 {
		*dest[0].(*int64) = r.db.views
		*dest[1].(*int64) = r.db.visitors
		*dest[2].(*int64) = r.db.impressions
		*dest[3].(*int64) = r.db.clicks
		return nil
	}

	return nil
}

type fakeAnalyticsRows struct{}

func (r *fakeAnalyticsRows) Close()                                       {}
func (r *fakeAnalyticsRows) Err() error                                   { return nil }
func (r *fakeAnalyticsRows) CommandTag() pgconn.CommandTag                { return pgconn.CommandTag{} }
func (r *fakeAnalyticsRows) FieldDescriptions() []pgconn.FieldDescription { return nil }
func (r *fakeAnalyticsRows) Next() bool                                   { return false }
func (r *fakeAnalyticsRows) Scan(...any) error                            { return nil }
func (r *fakeAnalyticsRows) Values() ([]any, error)                       { return nil, nil }
func (r *fakeAnalyticsRows) RawValues() [][]byte                          { return nil }
func (r *fakeAnalyticsRows) Conn() *pgx.Conn                              { return nil }

func TestPseudonymizeVisitor_DeterministicAndMasked(t *testing.T) {
	hash1 := PseudonymizeVisitor("192.168.1.1", "Mozilla/5.0", "2026-11-08")
	hash2 := PseudonymizeVisitor("192.168.1.1", "Mozilla/5.0", "2026-11-08")
	hash3 := PseudonymizeVisitor("192.168.1.2", "Mozilla/5.0", "2026-11-08")

	if hash1 != hash2 {
		t.Errorf("expected deterministic hash, got %q vs %q", hash1, hash2)
	}
	if hash1 == hash3 {
		t.Errorf("different IP should produce different hash")
	}
	if len(hash1) != 24 {
		t.Errorf("expected 24 char hash, got %d", len(hash1))
	}
}

func TestRecordEvent_ExcludesOwner(t *testing.T) {
	db := &fakeAnalyticsDB{
		businessID:  "biz-1",
		ownerUserID: "usr-owner-1",
		status:      "published",
	}
	svc := NewAnalyticsService(db)

	err := svc.RecordEvent(context.Background(), "biz-1", domain.RecordAnalyticsEventInput{
		EventType: domain.AnalyticsEventView,
		Source:    domain.AnalyticsSourceExplore,
	}, "vh-123", "usr-owner-1")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if db.recorded {
		t.Error("owner visit should NOT be recorded")
	}
}

func TestRecordEvent_DeduplicatesRecentViews(t *testing.T) {
	db := &fakeAnalyticsDB{
		businessID:   "biz-1",
		ownerUserID:  "usr-owner-1",
		status:       "published",
		existsRecent: true, // within 15 mins
	}
	svc := NewAnalyticsService(db)

	err := svc.RecordEvent(context.Background(), "biz-1", domain.RecordAnalyticsEventInput{
		EventType: domain.AnalyticsEventView,
		Source:    domain.AnalyticsSourceExplore,
	}, "vh-123", "usr-visitor-2")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if db.recorded {
		t.Error("duplicate recent view within cooldown should NOT be inserted")
	}
}

func TestGetAnalytics_EnforcesOwnership(t *testing.T) {
	db := &fakeAnalyticsDB{
		businessID:  "biz-1",
		ownerUserID: "usr-owner-1",
		name:        "Kopi Ruang Senja",
		slug:        "kopi-ruang-senja",
		status:      "published",
	}
	svc := NewAnalyticsService(db)

	// Caller is stranger
	_, err := svc.GetAnalytics(context.Background(), "usr-stranger-99", "biz-1", "30d")
	if !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("expected ErrForbidden for stranger, got %v", err)
	}

	// Caller is owner
	res, err := svc.GetAnalytics(context.Background(), "usr-owner-1", "biz-1", "30d")
	if err != nil {
		t.Fatalf("unexpected error for owner: %v", err)
	}
	if res.BusinessID != "biz-1" {
		t.Errorf("got businessID %q, want biz-1", res.BusinessID)
	}
	if res.Range != "30d" {
		t.Errorf("got range %q, want 30d", res.Range)
	}
	if len(res.TimeSeries) != 30 {
		t.Errorf("expected 30 time series points for 30d, got %d", len(res.TimeSeries))
	}
	if len(res.Funnel) != 4 {
		t.Errorf("expected 4 funnel stages, got %d", len(res.Funnel))
	}
}
