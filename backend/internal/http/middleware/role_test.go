package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
)

func TestRequirePartner(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cases := []struct {
		name       string
		user       *domain.User
		wantStatus int
	}{
		{name: "without session", wantStatus: http.StatusUnauthorized},
		{name: "umkm", user: &domain.User{Role: domain.RoleUMKM}, wantStatus: http.StatusForbidden},
		{name: "mitra", user: &domain.User{Role: domain.RoleMitra}, wantStatus: http.StatusOK},
		{name: "admin", user: &domain.User{Role: domain.RoleAdmin}, wantStatus: http.StatusForbidden},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.GET("/partner", func(c *gin.Context) {
				if tc.user != nil {
					c.Set(string(userContextKey), *tc.user)
				}
				c.Next()
			}, RequirePartner(), func(c *gin.Context) { c.Status(http.StatusOK) })
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/partner", nil))
			if recorder.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d; body=%s", recorder.Code, tc.wantStatus, recorder.Body.String())
			}
		})
	}
}

func TestRequireUMKM(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cases := []struct {
		name       string
		user       *domain.User
		wantStatus int
	}{
		{name: "without session", wantStatus: http.StatusUnauthorized},
		{name: "umkm", user: &domain.User{Role: domain.RoleUMKM}, wantStatus: http.StatusOK},
		{name: "mitra", user: &domain.User{Role: domain.RoleMitra}, wantStatus: http.StatusForbidden},
		{name: "admin", user: &domain.User{Role: domain.RoleAdmin}, wantStatus: http.StatusForbidden},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.GET("/umkm", func(c *gin.Context) {
				if tc.user != nil {
					c.Set(string(userContextKey), *tc.user)
				}
				c.Next()
			}, RequireUMKM(), func(c *gin.Context) { c.Status(http.StatusOK) })
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/umkm", nil))
			if recorder.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d; body=%s", recorder.Code, tc.wantStatus, recorder.Body.String())
			}
		})
	}
}

