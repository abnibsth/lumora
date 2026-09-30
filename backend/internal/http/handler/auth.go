package handler

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// AuthService is the slice of the auth service the HTTP layer needs.
type AuthService interface {
	Register(ctx context.Context, params domain.RegisterParams) (domain.User, domain.Session, error)
	Login(ctx context.Context, params domain.LoginParams) (domain.User, domain.Session, error)
	Logout(ctx context.Context, token string) error
	UserByToken(ctx context.Context, token string) (domain.User, error)
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, userID string) error
}

type AuthHandler struct {
	svc AuthService
	// secureCookie mirrors APP_ENV: cookies are Secure in production only,
	// otherwise they would never be sent over plain http://localhost.
	secureCookie bool
}

func NewAuthHandler(svc AuthService, secureCookie bool) *AuthHandler {
	return &AuthHandler{svc: svc, secureCookie: secureCookie}
}

// Register handles POST /api/v1/auth/register.
func (h *AuthHandler) Register(c *gin.Context) {
	var params domain.RegisterParams
	if err := c.ShouldBindJSON(&params); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	user, session, err := h.svc.Register(c.Request.Context(), params)
	switch {
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case errors.Is(err, domain.ErrEmailTaken):
		writeError(c, http.StatusConflict, "email_taken", "Email sudah terdaftar.")
	case err != nil:
		slog.Error("register failed", "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		h.setSessionCookie(c, session)
		c.JSON(http.StatusCreated, user)
	}
}

// Login handles POST /api/v1/auth/login.
func (h *AuthHandler) Login(c *gin.Context) {
	var params domain.LoginParams
	if err := c.ShouldBindJSON(&params); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	user, session, err := h.svc.Login(c.Request.Context(), params)
	switch {
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case errors.Is(err, domain.ErrInvalidCredentials):
		writeError(c, http.StatusUnauthorized, "invalid_credentials", "Email atau kata sandi salah.")
	case err != nil:
		slog.Error("login failed", "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		h.setSessionCookie(c, session)
		c.JSON(http.StatusOK, user)
	}
}

// Logout handles POST /api/v1/auth/logout. The cookie is always cleared, even
// if the server-side delete fails, so the browser stops presenting the token.
func (h *AuthHandler) Logout(c *gin.Context) {
	token, _ := c.Cookie(domain.SessionCookieName)
	err := h.svc.Logout(c.Request.Context(), token)
	h.clearSessionCookie(c)

	if err != nil {
		slog.Error("logout failed", "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// Me handles GET /api/v1/auth/me. Route is behind middleware.RequireSession,
// so the user is always present here.
func (h *AuthHandler) Me(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}
	c.JSON(http.StatusOK, user)
}

// VerifyEmail handles POST /api/v1/auth/verify-email. The emailed link points
// at the frontend page, which POSTs the token here — mail scanners prefetch GET
// URLs, so verification must not happen on a GET.
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var body struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	err := h.svc.VerifyEmail(c.Request.Context(), body.Token)
	switch {
	case errors.Is(err, domain.ErrInvalidToken):
		writeError(c, http.StatusBadRequest, "invalid_token", "Tautan verifikasi tidak valid atau kedaluwarsa.")
	case err != nil:
		slog.Error("verify email failed", "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

// ResendVerification handles POST /api/v1/auth/resend-verification. Route is
// behind middleware.RequireSession, so the user is always present here.
func (h *AuthHandler) ResendVerification(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	err := h.svc.ResendVerification(c.Request.Context(), user.ID)
	switch {
	case errors.Is(err, domain.ErrEmailAlreadyVerified):
		writeError(c, http.StatusConflict, "email_already_verified", "Email sudah terverifikasi.")
	case err != nil:
		slog.Error("resend verification failed", "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func (h *AuthHandler) setSessionCookie(c *gin.Context, session domain.Session) {
	// Written by hand instead of gin.SetCookie because gin omits SameSite.
	// httpOnly: JavaScript can't read the token. SameSite=Lax: sent on normal
	// navigation, withheld from cross-site POSTs (CSRF mitigation).
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     domain.SessionCookieName,
		Value:    session.Token,
		MaxAge:   int(time.Until(session.ExpiresAt).Seconds()),
		Expires:  session.ExpiresAt,
		Path:     "/",
		Secure:   h.secureCookie,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearSessionCookie(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     domain.SessionCookieName,
		Value:    "",
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
		Path:     "/",
		Secure:   h.secureCookie,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func isValidationError(err error) bool {
	var validationErr *domain.ValidationError
	return errors.As(err, &validationErr)
}

func validationMessage(err error) string {
	var validationErr *domain.ValidationError
	if errors.As(err, &validationErr) {
		return validationErr.Message
	}
	return "Data tidak valid."
}
