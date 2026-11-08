package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type fakeAnalyticsService struct {
	analytics domain.BusinessAnalytics
	err       error

	gotBizID       string
	gotUserID      string
	gotRange       string
	gotEventInput  domain.RecordAnalyticsEventInput
	gotVisitorHash string
}

func (f *fakeAnalyticsService) GetAnalytics(_ context.Context, callerUserID, businessIDOrSlug, rangeParam string) (domain.BusinessAnalytics, error) {
	f.gotUserID = callerUserID
	f.gotBizID = businessIDOrSlug
	f.gotRange = rangeParam
	return f.analytics, f.err
}

func (f *fakeAnalyticsService) RecordEvent(_ context.Context, businessIDOrSlug string, in domain.RecordAnalyticsEventInput, visitorHash string, callerUserID string) error {
	f.gotBizID = businessIDOrSlug
	f.gotEventInput = in
	f.gotVisitorHash = visitorHash
	f.gotUserID = callerUserID
	return f.err
}

func newAnalyticsTestRouter(svc AnalyticsSvc, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	v1 := router.Group("/api/v1")
	h := NewAnalyticsHandler(svc)

	v1.GET("/businesses/:id/analytics", middleware.RequireSession(), middleware.RequireUMKM(), h.GetAnalytics)
	v1.POST("/businesses/:id/events", h.RecordEvent)
	return router
}

func TestAnalytics_RequiresSession(t *testing.T) {
	router := newAnalyticsTestRouter(&fakeAnalyticsService{}, newFakeService())
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/businesses/biz-1/analytics", nil))

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
}

func TestAnalytics_MitraForbidden(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	router := newAnalyticsTestRouter(&fakeAnalyticsService{}, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/businesses/biz-1/analytics", ""))

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", recorder.Code)
	}
}

func TestAnalytics_OwnerAccessSuccess(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleUMKM)
	svc := &fakeAnalyticsService{
		analytics: domain.BusinessAnalytics{
			BusinessID:   "biz-1",
			BusinessName: "Kopi Ruang Senja",
			Range:        "30d",
			Summary: domain.AnalyticsSummary{
				ProfileViews:       120,
				UniqueVisitors:     85,
				CatalogImpressions: 450,
				BookmarksCount:     15,
				CollabRequests:     4,
				ContactClicks:      8,
			},
			TimeSeries: []domain.AnalyticsTimeSeriesPoint{
				{Date: "2026-11-01", Views: 10, UniqueVisitors: 8},
			},
			Funnel: []domain.AnalyticsFunnelStep{
				{Stage: "Tayangan Katalog", Count: 450, Conversion: 100},
				{Stage: "Kunjungan Profil", Count: 120, Conversion: 26.7},
				{Stage: "Disimpan Mitra", Count: 15, Conversion: 12.5},
				{Stage: "Permintaan Kolaborasi", Count: 4, Conversion: 26.7},
			},
			TrafficSource: []domain.AnalyticsTrafficSource{
				{Source: "explore", Label: "Jelajahi UMKM", Count: 80, Percentage: 66.7},
			},
		},
	}
	router := newAnalyticsTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/businesses/biz-1/analytics?range=30d", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	if svc.gotRange != "30d" {
		t.Errorf("got range %q, want 30d", svc.gotRange)
	}
	if svc.gotBizID != "biz-1" {
		t.Errorf("got bizID %q, want biz-1", svc.gotBizID)
	}
}

func TestAnalytics_RecordEventPublic(t *testing.T) {
	svc := &fakeAnalyticsService{}
	router := newAnalyticsTestRouter(svc, newFakeService())
	recorder := httptest.NewRecorder()

	body := `{"eventType":"view","source":"explore"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/businesses/kopi-ruang-senja/events", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	if svc.gotEventInput.EventType != domain.AnalyticsEventView {
		t.Errorf("got eventType %q, want view", svc.gotEventInput.EventType)
	}
	if svc.gotEventInput.Source != domain.AnalyticsSourceExplore {
		t.Errorf("got source %q, want explore", svc.gotEventInput.Source)
	}
	if svc.gotVisitorHash == "" {
		t.Error("expected non-empty visitor hash")
	}
}
