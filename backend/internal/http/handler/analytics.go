package handler

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
	"github.com/alfian/lumora/backend/internal/service"
)

type AnalyticsSvc interface {
	GetAnalytics(ctx context.Context, callerUserID, businessIDOrSlug, rangeParam string) (domain.BusinessAnalytics, error)
	RecordEvent(ctx context.Context, businessIDOrSlug string, in domain.RecordAnalyticsEventInput, visitorHash string, callerUserID string) error
}

type AnalyticsHandler struct {
	svc AnalyticsSvc
}

func NewAnalyticsHandler(svc AnalyticsSvc) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

// GetAnalytics handles GET /api/v1/businesses/:id/analytics?range=30d
func (h *AnalyticsHandler) GetAnalytics(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	businessID := strings.TrimSpace(c.Param("id"))
	if businessID == "" {
		writeError(c, http.StatusBadRequest, "invalid_parameter", "ID bisnis diperlukan.")
		return
	}

	rangeParam := strings.TrimSpace(c.Query("range"))
	analytics, err := h.svc.GetAnalytics(c.Request.Context(), user.ID, businessID, rangeParam)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Profil bisnis tidak ditemukan.")
	case errors.Is(err, domain.ErrForbidden):
		writeError(c, http.StatusForbidden, "forbidden", "Anda tidak memiliki akses ke analitik bisnis ini.")
	case err != nil:
		slog.Error("get business analytics failed", "biz_id", businessID, "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server saat memuat analitik.")
	default:
		c.JSON(http.StatusOK, analytics)
	}
}

// RecordEvent handles POST /api/v1/businesses/:id/events (public / session-aware)
func (h *AnalyticsHandler) RecordEvent(c *gin.Context) {
	businessID := strings.TrimSpace(c.Param("id"))
	if businessID == "" {
		writeError(c, http.StatusBadRequest, "invalid_parameter", "ID bisnis diperlukan.")
		return
	}

	var input domain.RecordAnalyticsEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	var callerUserID string
	if user, ok := middleware.CurrentUser(c); ok {
		callerUserID = user.ID
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	date := time.Now().UTC().Format("2006-01-02")
	visitorHash := service.PseudonymizeVisitor(ip, ua, date)

	err := h.svc.RecordEvent(c.Request.Context(), businessID, input, visitorHash, callerUserID)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Profil bisnis tidak ditemukan.")
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("record analytics event failed", "biz_id", businessID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Gagal mencatat event analitik.")
	default:
		c.JSON(http.StatusOK, gin.H{"status": "recorded"})
	}
}

