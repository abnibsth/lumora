package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
)

func TestRequireAdmin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cases := []struct {
		name       string
		user       *domain.User
		wantStatus int
	}{
		{name: "without session", wantStatus: http.StatusUnauthorized},
		{name: "umkm", user: &domain.User{Role: domain.RoleUMKM}, wantStatus: http.StatusForbidden},
		{name: "mitra", user: &domain.User{Role: domain.RoleMitra}, wantStatus: http.StatusForbidden},
		{name: "admin", user: &domain.User{Role: domain.RoleAdmin}, wantStatus: http.StatusOK},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.GET("/admin", func(c *gin.Context) {
				if tc.user != nil {
					c.Set(string(userContextKey), *tc.user)
				}
				c.Next()
			}, RequireAdmin(), func(c *gin.Context) { c.Status(http.StatusOK) })
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/admin", nil))
			if recorder.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d; body=%s", recorder.Code, tc.wantStatus, recorder.Body.String())
			}
		})
	}
}
