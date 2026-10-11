package handler

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
)

type AdminOverviewService interface {
	Overview(ctx context.Context) (domain.AdminOverview, error)
}

type AdminHandler struct {
	svc AdminOverviewService
}

func NewAdminHandler(svc AdminOverviewService) *AdminHandler {
	return &AdminHandler{svc: svc}
}

func (h *AdminHandler) Overview(c *gin.Context) {
	overview, err := h.svc.Overview(c.Request.Context())
	if err != nil {
		slog.Error("admin overview failed", "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}
	c.JSON(http.StatusOK, overview)
}
