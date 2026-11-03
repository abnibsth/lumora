package handler

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type PartnerProfileService interface {
	GetProfile(ctx context.Context, userID string) (domain.PartnerProfile, error)
	UpsertProfile(ctx context.Context, userID string, input domain.UpsertPartnerProfileInput) (domain.PartnerProfile, error)
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
