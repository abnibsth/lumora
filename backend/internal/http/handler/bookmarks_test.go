package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// fakeBookmarkService implements BookmarkService with canned results.
type fakeBookmarkService struct {
	listResult domain.BusinessList
	err        error
	gotUserID  string
	gotSlug    string
}

func (f *fakeBookmarkService) List(_ context.Context, userID string) (domain.BusinessList, error) {
	f.gotUserID = userID
	return f.listResult, f.err
}

func (f *fakeBookmarkService) Add(_ context.Context, userID, slug string) error {
	f.gotUserID, f.gotSlug = userID, slug
	return f.err
}

func (f *fakeBookmarkService) Remove(_ context.Context, userID, slug string) error {
	f.gotUserID, f.gotSlug = userID, slug
	return f.err
}

func newBookmarkTestRouter(svc BookmarkService, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	h := NewBookmarkHandler(svc)

	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	v1 := router.Group("/api/v1")
	v1.GET("/bookmarks", middleware.RequireSession(), h.List)
	v1.POST("/bookmarks/:slug", middleware.RequireSession(), h.Add)
	v1.DELETE("/bookmarks/:slug", middleware.RequireSession(), h.Remove)
	return router
}

func TestBookmarkRoutesRequireSession(t *testing.T) {
	router := newBookmarkTestRouter(&fakeBookmarkService{}, newFakeService())

	cases := []struct {
		method string
		target string
	}{
		{http.MethodGet, "/api/v1/bookmarks"},
		{http.MethodPost, "/api/v1/bookmarks/kopi-ruang-senja"},
		{http.MethodDelete, "/api/v1/bookmarks/kopi-ruang-senja"},
	}
	for _, tc := range cases {
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, httptest.NewRequest(tc.method, tc.target, nil))
		if recorder.Code != http.StatusUnauthorized {
			t.Errorf("%s %s = %d, want 401", tc.method, tc.target, recorder.Code)
		}
	}
}

func TestBookmarkAddPassesUserAndSlug(t *testing.T) {
	svc := &fakeBookmarkService{}
	router := newBookmarkTestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/bookmarks/kopi-ruang-senja", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if svc.gotUserID != "4f446e73-4e11-46f7-9b6b-35a1585bdf3c" {
		t.Errorf("userID = %q, want the session user", svc.gotUserID)
	}
	if svc.gotSlug != "kopi-ruang-senja" {
		t.Errorf("slug = %q", svc.gotSlug)
	}
}

func TestBookmarkAddNotFound(t *testing.T) {
	svc := &fakeBookmarkService{err: domain.ErrNotFound}
	router := newBookmarkTestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/bookmarks/tidak-ada", ""))

	if recorder.Code != http.StatusNotFound || !strings.Contains(recorder.Body.String(), "not_found") {
		t.Errorf("status = %d body = %s, want 404 not_found", recorder.Code, recorder.Body.String())
	}
}

func TestBookmarkListReturnsEnvelope(t *testing.T) {
	svc := &fakeBookmarkService{
		listResult: domain.BusinessList{
			Items: []domain.Business{{Name: "Kopi Ruang Senja"}},
			Total: 1, Page: 1, Limit: 1,
		},
	}
	router := newBookmarkTestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/bookmarks", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), `"total":1`) {
		t.Errorf("body = %s, want total 1", recorder.Body.String())
	}
}

func TestBookmarkRemoveIsAlwaysOK(t *testing.T) {
	router := newBookmarkTestRouter(&fakeBookmarkService{}, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodDelete, "/api/v1/bookmarks/sudah-hilang", ""))

	if recorder.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 (idempotent)", recorder.Code)
	}
}
