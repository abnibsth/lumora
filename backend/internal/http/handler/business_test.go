package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// fakeBusinessService implements BusinessService with canned results and
// records what the handler passed down.
type fakeBusinessService struct {
	createResult   domain.OwnedBusiness
	updateResult   domain.OwnedBusiness
	publishResult  domain.OwnedBusiness
	listMineResult domain.OwnedBusinessList
	err            error

	gotUserID string
	gotID     string
}

func (f *fakeBusinessService) List(context.Context, domain.BusinessListParams) (domain.BusinessList, error) {
	return domain.BusinessList{}, nil
}

func (f *fakeBusinessService) BySlug(context.Context, string) (domain.Business, error) {
	return domain.Business{}, nil
}

func (f *fakeBusinessService) Create(_ context.Context, userID string, _ domain.CreateBusinessInput) (domain.OwnedBusiness, error) {
	f.gotUserID = userID
	return f.createResult, f.err
}

func (f *fakeBusinessService) Update(_ context.Context, userID, id string, _ domain.UpdateBusinessInput) (domain.OwnedBusiness, error) {
	f.gotUserID = userID
	f.gotID = id
	return f.updateResult, f.err
}

func (f *fakeBusinessService) Publish(_ context.Context, userID, id string) (domain.OwnedBusiness, error) {
	f.gotUserID = userID
	f.gotID = id
	return f.publishResult, f.err
}

func (f *fakeBusinessService) Archive(_ context.Context, userID, id string) error {
	f.gotUserID = userID
	f.gotID = id
	return f.err
}

func (f *fakeBusinessService) ListMine(_ context.Context, userID string, _, _ int) (domain.OwnedBusinessList, error) {
	f.gotUserID = userID
	return f.listMineResult, f.err
}

// newBusinessTestRouter mirrors the route wiring in cmd/api/main.go.
func newBusinessTestRouter(svc BusinessService, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	h := NewBusinessHandler(svc)

	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	v1 := router.Group("/api/v1")
	v1.GET("/businesses/mine", middleware.RequireSession(), h.ListMine)
	v1.GET("/businesses/:slug", h.Detail)
	v1.POST("/businesses", middleware.RequireSession(), h.Create)
	v1.PATCH("/businesses/:id", middleware.RequireSession(), h.Update)
	v1.POST("/businesses/:id/publish", middleware.RequireSession(), h.Publish)
	v1.DELETE("/businesses/:id", middleware.RequireSession(), h.Archive)
	return router
}

// sessionRequest builds an authenticated request using the fakeAuthService
// session from auth_test.go.
func sessionRequest(method, target, body string) *http.Request {
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	request.AddCookie(&http.Cookie{Name: domain.SessionCookieName, Value: "token-abc"})
	return request
}

func TestCreateRequiresSession(t *testing.T) {
	router := newBusinessTestRouter(&fakeBusinessService{}, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/businesses", strings.NewReader("{}")))

	if recorder.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", recorder.Code)
	}
}

func TestCreateInvalidBody(t *testing.T) {
	router := newBusinessTestRouter(&fakeBusinessService{}, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/businesses", "bukan-json"))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "invalid_body") {
		t.Errorf("body = %s, want invalid_body", recorder.Body.String())
	}
}

func TestCreateSuccessPassesUserIDAndReturnsStatus(t *testing.T) {
	svc := &fakeBusinessService{
		createResult: domain.OwnedBusiness{
			Business: domain.Business{Name: "Kopi Ruang Senja"},
			Status:   domain.StatusDraft,
		},
	}
	router := newBusinessTestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/businesses", `{"name":"Kopi Ruang Senja"}`))

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if svc.gotUserID != "4f446e73-4e11-46f7-9b6b-35a1585bdf3c" {
		t.Errorf("userID = %q, want the session user", svc.gotUserID)
	}
	if !strings.Contains(recorder.Body.String(), `"status":"draft"`) {
		t.Errorf("body = %s, want status draft", recorder.Body.String())
	}
}

func TestWriteDomainErrorMapping(t *testing.T) {
	cases := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{"forbidden", domain.ErrForbidden, http.StatusForbidden, "forbidden"},
		{"not found", domain.ErrNotFound, http.StatusNotFound, "not_found"},
		{"invalid category", domain.ErrInvalidCategory, http.StatusBadRequest, "invalid_category"},
		{"invalid parameter", domain.ErrInvalidParameter, http.StatusBadRequest, "invalid_parameter"},
		{"validation message passthrough", &domain.ValidationError{Message: "Deskripsi wajib diisi."}, http.StatusBadRequest, "validation_failed"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			svc := &fakeBusinessService{err: tc.err}
			router := newBusinessTestRouter(svc, newFakeService())

			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, sessionRequest(http.MethodPatch, "/api/v1/businesses/6cceac2f-7a80-4f9e-98ba-391d61be10fc", `{"name":"Baru"}`))

			if recorder.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d (body: %s)", recorder.Code, tc.wantStatus, recorder.Body.String())
			}
			if !strings.Contains(recorder.Body.String(), tc.wantCode) {
				t.Errorf("body = %s, want code %s", recorder.Body.String(), tc.wantCode)
			}
			if tc.wantCode == "validation_failed" && !strings.Contains(recorder.Body.String(), "Deskripsi wajib diisi.") {
				t.Errorf("body = %s, want the validation message", recorder.Body.String())
			}
		})
	}
}

func TestPublishSuccess(t *testing.T) {
	svc := &fakeBusinessService{
		publishResult: domain.OwnedBusiness{
			Business: domain.Business{Name: "Kopi Ruang Senja"},
			Status:   domain.StatusPublished,
		},
	}
	router := newBusinessTestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/businesses/6cceac2f-7a80-4f9e-98ba-391d61be10fc/publish", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), `"status":"published"`) {
		t.Errorf("body = %s, want status published", recorder.Body.String())
	}
}

func TestListMineRequiresSession(t *testing.T) {
	router := newBusinessTestRouter(&fakeBusinessService{}, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/businesses/mine", nil))

	if recorder.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", recorder.Code)
	}
}

func TestListMineReturnsOwnProfilesWithStatus(t *testing.T) {
	svc := &fakeBusinessService{
		listMineResult: domain.OwnedBusinessList{
			Items: []domain.OwnedBusiness{
				{Business: domain.Business{Name: "Draft Saya", Slug: "draft-saya"}, Status: domain.StatusDraft},
			},
			Total: 1, Page: 1, Limit: 12,
		},
	}
	router := newBusinessTestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/businesses/mine", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if svc.gotUserID != "4f446e73-4e11-46f7-9b6b-35a1585bdf3c" {
		t.Errorf("userID = %q, want the session user", svc.gotUserID)
	}
	if !strings.Contains(recorder.Body.String(), `"status":"draft"`) {
		t.Errorf("body = %s, want status draft", recorder.Body.String())
	}
}

func TestArchiveRequiresSession(t *testing.T) {
	router := newBusinessTestRouter(&fakeBusinessService{}, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodDelete, "/api/v1/businesses/6cceac2f-7a80-4f9e-98ba-391d61be10fc", nil))

	if recorder.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", recorder.Code)
	}
}

func TestArchiveSuccessIs200(t *testing.T) {
	svc := &fakeBusinessService{}
	router := newBusinessTestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodDelete, "/api/v1/businesses/6cceac2f-7a80-4f9e-98ba-391d61be10fc", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), `"status":"ok"`) {
		t.Errorf("body = %s, want status ok", recorder.Body.String())
	}
	if svc.gotUserID != "4f446e73-4e11-46f7-9b6b-35a1585bdf3c" {
		t.Errorf("userID = %q, want the session user", svc.gotUserID)
	}
	if svc.gotID != "6cceac2f-7a80-4f9e-98ba-391d61be10fc" {
		t.Errorf("id = %q, want the path parameter", svc.gotID)
	}
}

func TestArchiveErrorMapping(t *testing.T) {
	cases := []struct {
		name     string
		err      error
		wantCode int
		wantBody string
	}{
		{"not found", domain.ErrNotFound, http.StatusNotFound, "not_found"},
		{"not the owner", domain.ErrForbidden, http.StatusForbidden, "forbidden"},
		{"bad uuid", domain.ErrInvalidParameter, http.StatusBadRequest, "invalid_parameter"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			router := newBusinessTestRouter(&fakeBusinessService{err: tc.err}, newFakeService())

			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, sessionRequest(http.MethodDelete, "/api/v1/businesses/6cceac2f-7a80-4f9e-98ba-391d61be10fc", ""))

			if recorder.Code != tc.wantCode {
				t.Fatalf("status = %d, want %d (body: %s)", recorder.Code, tc.wantCode, recorder.Body.String())
			}
			if !strings.Contains(recorder.Body.String(), tc.wantBody) {
				t.Errorf("body = %s, want code %s", recorder.Body.String(), tc.wantBody)
			}
		})
	}
}

func TestArchiveUnexpectedErrorIs500(t *testing.T) {
	router := newBusinessTestRouter(&fakeBusinessService{err: errors.New("db down")}, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodDelete, "/api/v1/businesses/6cceac2f-7a80-4f9e-98ba-391d61be10fc", ""))

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "internal_error") {
		t.Errorf("body = %s, want internal_error", recorder.Body.String())
	}
}
