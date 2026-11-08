package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/alfian/lumora/backend/internal/domain"
)

type AnalyticsDB interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type AnalyticsService struct {
	db AnalyticsDB
}

func NewAnalyticsService(db AnalyticsDB) *AnalyticsService {
	return &AnalyticsService{db: db}
}

// PseudonymizeVisitor generates an irreversible hashed fingerprint from visitor signals.
func PseudonymizeVisitor(ip, userAgent, date string) string {
	hasher := sha256.New()
	hasher.Write([]byte(fmt.Sprintf("%s|%s|%s|lumora-salt-2026", ip, userAgent, date)))
	return hex.EncodeToString(hasher.Sum(nil))[:24]
}

// RecordEvent records an analytics interaction with deduplication and owner exclusion.
func (s *AnalyticsService) RecordEvent(ctx context.Context, businessIDOrSlug string, in domain.RecordAnalyticsEventInput, visitorHash string, callerUserID string) error {
	if err := in.Validate(); err != nil {
		return err
	}

	var bizID, ownerUserID string
	var status string
	err := s.db.QueryRow(ctx, `
		SELECT id::text, COALESCE(owner_user_id::text, ''), status
		FROM businesses
		WHERE id::text = $1 OR slug = $1`, businessIDOrSlug).Scan(&bizID, &ownerUserID, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("find business: %w", err)
	}

	// Rule 1: Exclude owner's own visits from inflating metrics
	if callerUserID != "" && callerUserID == ownerUserID {
		return nil
	}

	// Rule 2: Anti-refresh deduplication (15-minute cooldown per visitor hash for same business view)
	if in.EventType == domain.AnalyticsEventView && visitorHash != "" {
		var recentExists bool
		_ = s.db.QueryRow(ctx, `
			SELECT EXISTS(
				SELECT 1 FROM business_analytics_events
				WHERE business_id = $1::uuid
				  AND event_type = $2
				  AND visitor_hash = $3
				  AND created_at >= now() - interval '15 minutes'
			)`, bizID, in.EventType, visitorHash).Scan(&recentExists)
		if recentExists {
			return nil
		}
	}

	if visitorHash == "" {
		visitorHash = "anon-" + hex.EncodeToString([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))[:16]
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO business_analytics_events (business_id, event_type, source, visitor_hash, created_at)
		VALUES ($1::uuid, $2, $3, $4, now())`,
		bizID, in.EventType, in.Source, visitorHash)
	if err != nil {
		return fmt.Errorf("insert analytics event: %w", err)
	}

	return nil
}

// GetAnalytics computes full aggregate metrics, deltas, time series, and funnel for a business owner.
func (s *AnalyticsService) GetAnalytics(ctx context.Context, callerUserID, businessIDOrSlug, rangeParam string) (domain.BusinessAnalytics, error) {
	var bizID, ownerUserID, name, slug, status string
	err := s.db.QueryRow(ctx, `
		SELECT id::text, COALESCE(owner_user_id::text, ''), name, slug, status
		FROM businesses
		WHERE id::text = $1 OR slug = $1`, businessIDOrSlug).Scan(&bizID, &ownerUserID, &name, &slug, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.BusinessAnalytics{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.BusinessAnalytics{}, fmt.Errorf("load business: %w", err)
	}

	// Rule: UMKM can only view analytics for businesses they own
	if ownerUserID != callerUserID {
		return domain.BusinessAnalytics{}, domain.ErrForbidden
	}

	var days int
	switch rangeParam {
	case "7d":
		days = 7
	case "90d":
		days = 90
	default:
		rangeParam = "30d"
		days = 30
	}

	now := time.Now().UTC()
	currentStart := now.AddDate(0, 0, -days)
	prevStart := currentStart.AddDate(0, 0, -days)

	// --- 1. Current Period Metrics ---
	var curViews, curUnique, curImpressions, curContactClicks int64
	err = s.db.QueryRow(ctx, `
		SELECT 
			count(*) FILTER (WHERE event_type = 'view'),
			count(DISTINCT visitor_hash) FILTER (WHERE event_type = 'view'),
			count(*) FILTER (WHERE event_type = 'catalog_impression'),
			count(*) FILTER (WHERE event_type = 'contact_click')
		FROM business_analytics_events
		WHERE business_id = $1::uuid
		  AND created_at >= $2 AND created_at <= $3`,
		bizID, currentStart, now).Scan(&curViews, &curUnique, &curImpressions, &curContactClicks)
	if err != nil {
		return domain.BusinessAnalytics{}, fmt.Errorf("query current analytics: %w", err)
	}

	// Current bookmarks
	var curBookmarks int64
	_ = s.db.QueryRow(ctx, `
		SELECT count(*) FROM bookmarks
		WHERE business_id = $1::uuid
		  AND created_at >= $2 AND created_at <= $3`,
		bizID, currentStart, now).Scan(&curBookmarks)

	// Current collaboration requests received
	var curCollab int64
	_ = s.db.QueryRow(ctx, `
		SELECT count(*) FROM collaboration_requests
		WHERE business_id = $1::uuid
		  AND direction = 'partner_to_umkm'
		  AND created_at >= $2 AND created_at <= $3`,
		bizID, currentStart, now).Scan(&curCollab)

	// --- 2. Previous Period Metrics (For Comparison Deltas) ---
	var prevViews, prevUnique, prevImpressions, prevContactClicks int64
	_ = s.db.QueryRow(ctx, `
		SELECT 
			count(*) FILTER (WHERE event_type = 'view'),
			count(DISTINCT visitor_hash) FILTER (WHERE event_type = 'view'),
			count(*) FILTER (WHERE event_type = 'catalog_impression'),
			count(*) FILTER (WHERE event_type = 'contact_click')
		FROM business_analytics_events
		WHERE business_id = $1::uuid
		  AND created_at >= $2 AND created_at < $3`,
		bizID, prevStart, currentStart).Scan(&prevViews, &prevUnique, &prevImpressions, &prevContactClicks)

	var prevBookmarks int64
	_ = s.db.QueryRow(ctx, `
		SELECT count(*) FROM bookmarks
		WHERE business_id = $1::uuid
		  AND created_at >= $2 AND created_at < $3`,
		bizID, prevStart, currentStart).Scan(&prevBookmarks)

	var prevCollab int64
	_ = s.db.QueryRow(ctx, `
		SELECT count(*) FROM collaboration_requests
		WHERE business_id = $1::uuid
		  AND direction = 'partner_to_umkm'
		  AND created_at >= $2 AND created_at < $3`,
		bizID, prevStart, currentStart).Scan(&prevCollab)

	calcDelta := func(cur, prev int64) float64 {
		if prev == 0 {
			if cur > 0 {
				return 100.0
			}
			return 0.0
		}
		delta := (float64(cur-prev) / float64(prev)) * 100.0
		return math.Round(delta*10) / 10
	}

	summary := domain.AnalyticsSummary{
		ProfileViews:       curViews,
		UniqueVisitors:     curUnique,
		CatalogImpressions: curImpressions,
		BookmarksCount:     curBookmarks,
		CollabRequests:     curCollab,
		ContactClicks:      curContactClicks,
		ViewsChange:        calcDelta(curViews, prevViews),
		VisitorsChange:     calcDelta(curUnique, prevUnique),
		ImpressionsChange:  calcDelta(curImpressions, prevImpressions),
		BookmarksChange:    calcDelta(curBookmarks, prevBookmarks),
		CollabChange:       calcDelta(curCollab, prevCollab),
		ContactChange:      calcDelta(curContactClicks, prevContactClicks),
	}

	// --- 3. Daily Time Series ---
	// Build map of points initialized to 0 for every single day in range
	timeSeriesMap := make(map[string]*domain.AnalyticsTimeSeriesPoint)
	timeSeriesKeys := make([]string, 0, days)
	for i := days - 1; i >= 0; i-- {
		dayStr := now.AddDate(0, 0, -i).Format("2006-01-02")
		pt := &domain.AnalyticsTimeSeriesPoint{Date: dayStr, Views: 0, UniqueVisitors: 0}
		timeSeriesMap[dayStr] = pt
		timeSeriesKeys = append(timeSeriesKeys, dayStr)
	}

	tsRows, err := s.db.Query(ctx, `
		SELECT 
			to_char(created_at, 'YYYY-MM-DD') AS day,
			count(*) AS views,
			count(DISTINCT visitor_hash) AS visitors
		FROM business_analytics_events
		WHERE business_id = $1::uuid
		  AND event_type = 'view'
		  AND created_at >= $2 AND created_at <= $3
		GROUP BY 1
		ORDER BY 1 ASC`,
		bizID, currentStart, now)
	if err == nil {
		defer tsRows.Close()
		for tsRows.Next() {
			var d string
			var v, u int64
			if scanErr := tsRows.Scan(&d, &v, &u); scanErr == nil {
				if pt, ok := timeSeriesMap[d]; ok {
					pt.Views = v
					pt.UniqueVisitors = u
				}
			}
		}
	}

	timeSeries := make([]domain.AnalyticsTimeSeriesPoint, 0, len(timeSeriesKeys))
	for _, k := range timeSeriesKeys {
		timeSeries = append(timeSeries, *timeSeriesMap[k])
	}

	// --- 4. Funnel Stages ---
	calcConv := func(cur, base int64) float64 {
		if base == 0 {
			if cur > 0 {
				return 100.0
			}
			return 0.0
		}
		conv := (float64(cur) / float64(base)) * 100.0
		return math.Min(100.0, math.Round(conv*10)/10)
	}

	funnel := []domain.AnalyticsFunnelStep{
		{Stage: "Tayangan Katalog", Count: curImpressions, Conversion: 100.0},
		{Stage: "Kunjungan Profil", Count: curViews, Conversion: calcConv(curViews, curImpressions)},
		{Stage: "Disimpan Mitra", Count: curBookmarks, Conversion: calcConv(curBookmarks, curViews)},
		{Stage: "Permintaan Kolaborasi", Count: curCollab, Conversion: calcConv(curCollab, curBookmarks)},
	}

	// --- 5. Traffic Source Distribution ---
	sourceRows, err := s.db.Query(ctx, `
		SELECT source, count(*)
		FROM business_analytics_events
		WHERE business_id = $1::uuid
		  AND event_type = 'view'
		  AND created_at >= $2 AND created_at <= $3
		GROUP BY source
		ORDER BY count(*) DESC`,
		bizID, currentStart, now)

	sourceCounts := map[string]int64{
		domain.AnalyticsSourceExplore:  0,
		domain.AnalyticsSourceSearch:   0,
		domain.AnalyticsSourceMatching: 0,
		domain.AnalyticsSourceDirect:   0,
	}

	if err == nil {
		defer sourceRows.Close()
		for sourceRows.Next() {
			var src string
			var count int64
			if err := sourceRows.Scan(&src, &count); err == nil {
				sourceCounts[src] = count
			}
		}
	}

	sourceLabels := map[string]string{
		domain.AnalyticsSourceExplore:  "Jelajahi UMKM",
		domain.AnalyticsSourceSearch:   "Pencarian Katalog",
		domain.AnalyticsSourceMatching: "Smart Matching Rekomendasi",
		domain.AnalyticsSourceDirect:   "Tautan Langsung / Berbagi",
	}

	trafficSources := make([]domain.AnalyticsTrafficSource, 0, 4)
	totalViewsBase := curViews
	if totalViewsBase == 0 {
		totalViewsBase = 1
	}

	for _, src := range []string{domain.AnalyticsSourceExplore, domain.AnalyticsSourceSearch, domain.AnalyticsSourceMatching, domain.AnalyticsSourceDirect} {
		c := sourceCounts[src]
		pct := (float64(c) / float64(totalViewsBase)) * 100.0
		trafficSources = append(trafficSources, domain.AnalyticsTrafficSource{
			Source:     src,
			Label:      sourceLabels[src],
			Count:      c,
			Percentage: math.Round(pct*10) / 10,
		})
	}

	return domain.BusinessAnalytics{
		BusinessID:    bizID,
		BusinessName:  name,
		BusinessSlug:  slug,
		Status:        status,
		Range:         rangeParam,
		StartDate:     currentStart,
		EndDate:       now,
		Summary:       summary,
		TimeSeries:    timeSeries,
		Funnel:        funnel,
		TrafficSource: trafficSources,
	}, nil
}
