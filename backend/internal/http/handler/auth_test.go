package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// fakeAuthService implements the AuthService interface with canned results.
type fakeAuthService struct {
	user    domain.User
	session domain.Session

	registerErr error
	userErr     error
}

func (f *fakeAuthService) Register(context.Context, domain.RegisterParams) (domain.User, domain.Session, error) {
	if f.registerErr != nil {
		return domain.User{}, domain.Session{}, f.registerErr
	}
	return f.user, f.session, nil
}

func (f *fakeAuthService) Login(context.Context, domain.LoginParams) (domain.User, domain.Session, error) {
	if f.userErr != nil {
		return domain.User{}, domain.Session{}, f.userErr
	}
	return f.user, f.session, nil
}

func (f *fakeAuthService) Logout(context.Context, string) error { return f.userErr }

func (f *fakeAuthService) UserByToken(_ context.Context, token string) (domain.User, error) {
	if token != f.session.Token {
		return domain.User{}, domain.ErrUnauthenticated
	}
	return f.user, nil
}

func newFakeService() *fakeAuthService {
	return &fakeAuthService{
		user: domain.User{
			ID:    "4f446e73-4e11-46f7-9b6b-35a1585bdf3c",
			Name:  "Budi Santoso",
			Email: "budi@example.com",
			Role:  domain.RoleUMKM,
		},
		session: domain.Session{
			Token:     "token-abc",
			ExpiresAt: time.Now().Add(time.Hour),
		},
	}
}

func newTestRouter(svc *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	h := NewAuthHandler(svc, false)

	router := gin.New()
	router.Use(middleware.AttachSession(svc))
	v1 := router.Group("/api/v1")
	v1.POST("/auth/register", h.Register)
	v1.POST("/auth/login", h.Login)
	v1.POST("/auth/logout", h.Logout)
	v1.GET("/auth/me", middleware.RequireSession(), h.Me)
	return router
}

func TestMeWithoutSessionIs401(t *testing.T) {
	router := newTestRouter(newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil))

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
	var body struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Error.Code != "unauthenticated" {
		t.Errorf("error.code = %q, want unauthenticated", body.Error.Code)
	}
}

func TestMeWithSessionReturnsUser(t *testing.T) {
	router := newTestRouter(newFakeService())

	request := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	request.AddCookie(&http.Cookie{Name: domain.SessionCookieName, Value: "token-abc"})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "budi@example.com") {
		t.Errorf("body = %s, want the user email", recorder.Body.String())
	}
}

func TestRegisterEmailTakenIs409(t *testing.T) {
	svc := newFakeService()
	svc.registerErr = domain.ErrEmailTaken
	router := newTestRouter(svc)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader("{}")))

	if recorder.Code != http.StatusConflict {
		t.Fatalf("status = %d, want 409 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "email_taken") {
		t.Errorf("body = %s, want code email_taken", recorder.Body.String())
	}
}

func TestRegisterValidationErrorUsesItsMessage(t *testing.T) {
	svc := newFakeService()
	svc.registerErr = &domain.ValidationError{Message: "Format email tidak valid."}
	router := newTestRouter(svc)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader("{}")))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "Format email tidak valid.") {
		t.Errorf("body = %s, want the validation message", recorder.Body.String())
	}
}

func TestRegisterSetsHttpOnlySameSiteCookie(t *testing.T) {
	router := newTestRouter(newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader("{}")))

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body: %s)", recorder.Code, recorder.Body.String())
	}

	cookies := recorder.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("cookies = %d, want 1", len(cookies))
	}
	cookie := cookies[0]
	if cookie.Name != domain.SessionCookieName {
		t.Errorf("cookie name = %q, want %q", cookie.Name, domain.SessionCookieName)
	}
	if !cookie.HttpOnly {
		t.Error("cookie is not HttpOnly")
	}
	if cookie.SameSite != http.SameSiteLaxMode {
		t.Errorf("SameSite = %v, want Lax", cookie.SameSite)
	}
	if cookie.Path != "/" {
		t.Errorf("Path = %q, want /", cookie.Path)
	}
	if cookie.Secure {
		t.Error("Secure must be false in development")
	}
}

func TestLogoutClearsCookie(t *testing.T) {
	router := newTestRouter(newFakeService())

	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	request.AddCookie(&http.Cookie{Name: domain.SessionCookieName, Value: "token-abc"})
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	cookies := recorder.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("cookies = %d, want 1", len(cookies))
	}
	if cookies[0].MaxAge >= 0 {
		t.Errorf("MaxAge = %d, want negative (cookie cleared)", cookies[0].MaxAge)
	}
}
