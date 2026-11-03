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
	profile domain.PartnerProfile
	err     error

	gotUserID string
	gotInput  domain.UpsertPartnerProfileInput
}

func (f *fakePartnerService) GetProfile(_ context.Context, userID string) (domain.PartnerProfile, error) {
	f.gotUserID = userID
	return f.profile, f.err
}

func (f *fakePartnerService) UpsertProfile(_ context.Context, userID string, input domain.UpsertPartnerProfileInput) (domain.PartnerProfile, error) {
	f.gotUserID = userID
	f.gotInput = input
	return f.profile, f.err
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
	if svc.gotInput.CompanyName != "PT Distribusi Nusantara" {
		t.Errorf("got CompanyName %q, want PT Distribusi Nusantara", svc.gotInput.CompanyName)
	}
}

func TestPartnerUpsertProfile_InvalidBody(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	router := newPartnerTestRouter(&fakePartnerService{}, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPut, "/api/v1/partner/profile", "{not-json"))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
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
