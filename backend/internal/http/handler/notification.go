package handler

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type NotifService interface {
	List(ctx context.Context, userID, filterType string, unreadOnly bool, page, limit int) (domain.NotificationList, error)
	GetUnreadCount(ctx context.Context, userID string) (int64, error)
	MarkRead(ctx context.Context, userID, notifID string) error
	MarkAllRead(ctx context.Context, userID string) error
}

type NotificationHandler struct {
	svc NotifService
}

func NewNotificationHandler(svc NotifService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) List(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	page, limit, ok := paginationParams(c)
	if !ok {
		return
	}

	filterType := c.Query("type")
	unreadOnly := c.Query("unread") == "true" || c.Query("status") == "unread"

	list, err := h.svc.List(c.Request.Context(), user.ID, filterType, unreadOnly, page, limit)
	if err != nil {
		slog.Error("list notifications failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *NotificationHandler) UnreadCount(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	count, err := h.svc.GetUnreadCount(c.Request.Context(), user.ID)
	if err != nil {
		slog.Error("get unread notification count failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"unreadCount": count})
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	notifID := c.Param("id")
	if err := h.svc.MarkRead(c.Request.Context(), user.ID, notifID); err != nil {
		slog.Error("mark notification read failed", "notif_id", notifID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	if err := h.svc.MarkAllRead(c.Request.Context(), user.ID); err != nil {
		slog.Error("mark all notifications read failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
