package handler

import (
	"context"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type PartnerProfileService interface {
	GetProfile(ctx context.Context, userID string) (domain.PartnerProfile, error)
	UpsertProfile(ctx context.Context, userID string, input domain.UpsertPartnerProfileInput) (domain.PartnerProfile, error)
	GetPreferences(ctx context.Context, userID string) (domain.PartnerPreferences, error)
	UpsertPreferences(ctx context.Context, userID string, input domain.UpsertPartnerPreferencesInput) (domain.PartnerPreferences, error)
	GetMatches(ctx context.Context, userID string, page, limit int) (domain.BusinessMatchList, error)
}

type PartnerHandler struct {
	svc PartnerProfileService
}

func NewPartnerHandler(svc PartnerProfileService) *PartnerHandler {
	return &PartnerHandler{svc: svc}
}

// GetProfile handles GET /api/v1/partner/profile.
func (h *PartnerHandler) GetProfile(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	profile, err := h.svc.GetProfile(c.Request.Context(), user.ID)
	if err != nil {
		slog.Error("get partner profile failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile": profile})
}

// UpsertProfile handles PUT /api/v1/partner/profile.
func (h *PartnerHandler) UpsertProfile(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	var input domain.UpsertPartnerProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	profile, err := h.svc.UpsertProfile(c.Request.Context(), user.ID, input)
	switch {
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("upsert partner profile failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"profile": profile})
	}
}

// GetPreferences handles GET /api/v1/partner/preferences.
func (h *PartnerHandler) GetPreferences(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	prefs, err := h.svc.GetPreferences(c.Request.Context(), user.ID)
	if err != nil {
		slog.Error("get partner preferences failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"preferences": prefs})
}

// UpsertPreferences handles PUT /api/v1/partner/preferences.
func (h *PartnerHandler) UpsertPreferences(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	var input domain.UpsertPartnerPreferencesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	prefs, err := h.svc.UpsertPreferences(c.Request.Context(), user.ID, input)
	switch {
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("upsert partner preferences failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"preferences": prefs})
	}
}

// GetMatches handles GET /api/v1/partner/matches?page=1&limit=12.
func (h *PartnerHandler) GetMatches(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	page := 1
	if pStr := c.Query("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 12
	if lStr := c.Query("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	matches, err := h.svc.GetMatches(c.Request.Context(), user.ID, page, limit)
	if err != nil {
		slog.Error("get partner matches failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, matches)
}
