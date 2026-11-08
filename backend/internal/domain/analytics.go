package domain

import (
	"strings"
	"time"
)

const (
	AnalyticsEventView              = "view"
	AnalyticsEventCatalogImpression = "catalog_impression"
	AnalyticsEventContactClick      = "contact_click"

	AnalyticsSourceDirect   = "direct"
	AnalyticsSourceExplore  = "explore"
	AnalyticsSourceSearch   = "search"
	AnalyticsSourceMatching = "matching"
)

func ValidAnalyticsEventType(t string) bool {
	switch t {
	case AnalyticsEventView, AnalyticsEventCatalogImpression, AnalyticsEventContactClick:
		return true
	default:
		return false
	}
}

func NormalizeAnalyticsSource(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case AnalyticsSourceExplore:
		return AnalyticsSourceExplore
	case AnalyticsSourceSearch:
		return AnalyticsSourceSearch
	case AnalyticsSourceMatching:
		return AnalyticsSourceMatching
	default:
		return AnalyticsSourceDirect
	}
}

type AnalyticsSummary struct {
	ProfileViews       int64   `json:"profileViews"`
	UniqueVisitors     int64   `json:"uniqueVisitors"`
	CatalogImpressions int64   `json:"catalogImpressions"`
	BookmarksCount     int64   `json:"bookmarksCount"`
	CollabRequests     int64   `json:"collabRequests"`
	ContactClicks      int64   `json:"contactClicks"`

	// Percentage change compared to previous period of same duration
	ViewsChange       float64 `json:"viewsChange"`
	VisitorsChange    float64 `json:"visitorsChange"`
	ImpressionsChange float64 `json:"impressionsChange"`
	BookmarksChange   float64 `json:"bookmarksChange"`
	CollabChange      float64 `json:"collabChange"`
	ContactChange     float64 `json:"contactChange"`
}

type AnalyticsTimeSeriesPoint struct {
	Date           string `json:"date"` // YYYY-MM-DD
	Views          int64  `json:"views"`
	UniqueVisitors int64  `json:"uniqueVisitors"`
}

type AnalyticsFunnelStep struct {
	Stage      string  `json:"stage"` // "Tayangan Katalog", "Kunjungan Profil", "Bisnis Disimpan", "Permintaan Kolaborasi"
	Count      int64   `json:"count"`
	Conversion float64 `json:"conversion"` // % conversion from previous step
}

type AnalyticsTrafficSource struct {
	Source     string  `json:"source"`     // "explore", "search", "matching", "direct"
	Label      string  `json:"label"`      // "Jelajahi UMKM", "Pencarian", "Smart Matching", "Tautan Langsung"
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"` // % of total views
}

type BusinessAnalytics struct {
	BusinessID    string                     `json:"businessId"`
	BusinessName  string                     `json:"businessName"`
	BusinessSlug  string                     `json:"businessSlug"`
	Status        string                     `json:"status"`
	Range         string                     `json:"range"` // "7d", "30d", "90d"
	StartDate     time.Time                  `json:"startDate"`
	EndDate       time.Time                  `json:"endDate"`
	Summary       AnalyticsSummary           `json:"summary"`
	TimeSeries    []AnalyticsTimeSeriesPoint `json:"timeSeries"`
	Funnel        []AnalyticsFunnelStep      `json:"funnel"`
	TrafficSource []AnalyticsTrafficSource   `json:"trafficSource"`
}

type RecordAnalyticsEventInput struct {
	EventType string `json:"eventType"`
	Source    string `json:"source"`
}

func (in *RecordAnalyticsEventInput) Sanitize() {
	in.EventType = strings.TrimSpace(in.EventType)
	in.Source = NormalizeAnalyticsSource(in.Source)
}

func (in *RecordAnalyticsEventInput) Validate() error {
	in.Sanitize()
	if !ValidAnalyticsEventType(in.EventType) {
		return invalid("Jenis event analitik tidak valid.")
	}
	return nil
}

