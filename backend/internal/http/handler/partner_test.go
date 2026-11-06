package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type fakePartnerService struct {
	profile     domain.PartnerProfile
	preferences domain.PartnerPreferences
	matches     domain.BusinessMatchList
	err         error

	gotUserID       string
	gotProfileInput domain.UpsertPartnerProfileInput
	gotPrefsInput   domain.UpsertPartnerPreferencesInput
	gotPage         int
	gotLimit        int
}

func (f *fakePartnerService) GetProfile(_ context.Context, userID string) (domain.PartnerProfile, error) {
	f.gotUserID = userID
	return f.profile, f.err
}

func (f *fakePartnerService) UpsertProfile(_ context.Context, userID string, input domain.UpsertPartnerProfileInput) (domain.PartnerProfile, error) {
	f.gotUserID = userID
	f.gotProfileInput = input
	return f.profile, f.err
}

func (f *fakePartnerService) GetPreferences(_ context.Context, userID string) (domain.PartnerPreferences, error) {
	f.gotUserID = userID
	return f.preferences, f.err
}

func (f *fakePartnerService) UpsertPreferences(_ context.Context, userID string, input domain.UpsertPartnerPreferencesInput) (domain.PartnerPreferences, error) {
	f.gotUserID = userID
	f.gotPrefsInput = input
	return f.preferences, f.err
}

func (f *fakePartnerService) GetMatches(_ context.Context, userID string, page, limit int) (domain.BusinessMatchList, error) {
	f.gotUserID = userID
	f.gotPage = page
	f.gotLimit = limit
	return f.matches, f.err
}

func newPartnerTestRouter(svc PartnerProfileService, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	v1 := router.Group("/api/v1")
	partner := v1.Group("/partner", middleware.RequireSession(), middleware.RequirePartner())
	h := NewPartnerHandler(svc)
	partner.GET("/profile", h.GetProfile)
	partner.PUT("/profile", h.UpsertProfile)
	partner.GET("/preferences", h.GetPreferences)
	partner.PUT("/preferences", h.UpsertPreferences)
	partner.GET("/matches", h.GetMatches)
	return router
}

func partnerSessionAuth(role string) *fakeAuthService {
	auth := newFakeService()
	auth.user.ID = "usr-partner-1"
	auth.user.Role = role
	return auth
}

func TestPartnerGetProfile_RequiresSession(t *testing.T) {
	router := newPartnerTestRouter(&fakePartnerService{}, newFakeService())
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/partner/profile", nil))

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
}

func TestPartnerGetProfile_ForbiddenForUMKM(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleUMKM)
	router := newPartnerTestRouter(&fakePartnerService{}, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/partner/profile", ""))

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", recorder.Code)
	}
}

func TestPartnerGetProfile_SuccessForPartner(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakePartnerService{
		profile: domain.PartnerProfile{
			ID:          "prof-1",
			UserID:      "usr-partner-1",
			CompanyName: "PT Distribusi Nusantara",
		},
	}
	router := newPartnerTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/partner/profile", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	if svc.gotUserID != "usr-partner-1" {
		t.Errorf("got userID %q, want usr-partner-1", svc.gotUserID)
	}
}

func TestPartnerUpsertProfile_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakePartnerService{
		profile: domain.PartnerProfile{
			ID:          "prof-1",
			UserID:      "usr-partner-1",
			CompanyName: "PT Distribusi Nusantara",
		},
	}
	router := newPartnerTestRouter(svc, auth)
	body := `{"companyName":"PT Distribusi Nusantara","partnerType":"Distributor"}`
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPut, "/api/v1/partner/profile", body))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	if svc.gotProfileInput.CompanyName != "PT Distribusi Nusantara" {
		t.Errorf("got CompanyName %q, want PT Distribusi Nusantara", svc.gotProfileInput.CompanyName)
	}
}

func TestPartnerGetPreferences_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakePartnerService{
		preferences: domain.PartnerPreferences{
			ID:               "pref-1",
			UserID:           "usr-partner-1",
			TargetCategories: []string{"F&B"},
			SearchRegion:     "Jawa Barat",
		},
	}
	router := newPartnerTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/partner/preferences", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	if svc.gotUserID != "usr-partner-1" {
		t.Errorf("got userID %q, want usr-partner-1", svc.gotUserID)
	}
}

func TestPartnerUpsertPreferences_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakePartnerService{
		preferences: domain.PartnerPreferences{
			ID:                    "pref-1",
			UserID:                "usr-partner-1",
			TargetCategories:      []string{"F&B", "Retail"},
			SeekingCollaborations: []string{"PRODUCT_DISTRIBUTION"},
		},
	}
	router := newPartnerTestRouter(svc, auth)
	body := `{"targetCategories":["F&B","Retail"],"seekingCollaborations":["PRODUCT_DISTRIBUTION"]}`
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPut, "/api/v1/partner/preferences", body))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	if len(svc.gotPrefsInput.TargetCategories) != 2 {
		t.Errorf("got %d TargetCategories, want 2", len(svc.gotPrefsInput.TargetCategories))
	}
}

func TestPartnerGetMatches_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakePartnerService{
		matches: domain.BusinessMatchList{
			Items: []domain.BusinessMatch{
				{
					Business: domain.Business{
						Slug: "arunika-bakery",
						Name: "Arunika Bakery",
					},
					MatchScore: 92,
					Reasons: []domain.MatchReason{
						{Type: "SECTOR", Label: "Sektor Sesuai", Detail: "Kategori F&B cocok"},
					},
				},
			},
			Total:          1,
			Page:           1,
			Limit:          12,
			HasPreferences: true,
		},
	}
	router := newPartnerTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/partner/matches?page=1&limit=12", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	if svc.gotPage != 1 || svc.gotLimit != 12 {
		t.Errorf("got page=%d limit=%d, want page=1 limit=12", svc.gotPage, svc.gotLimit)
	}
}

func TestPartnerUpsertProfile_ServerError(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakePartnerService{err: errors.New("db error")}
	router := newPartnerTestRouter(svc, auth)
	body := `{"companyName":"Fail Co"}`
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPut, "/api/v1/partner/profile", body))

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", recorder.Code)
	}
}
