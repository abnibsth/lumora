package handler

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type CollabService interface {
	CreateRequest(ctx context.Context, sender domain.User, in domain.CreateCollaborationRequestInput) (domain.CollaborationRequest, error)
	ListIncoming(ctx context.Context, userID, status, search string, page, limit int) (domain.CollaborationRequestList, error)
	ListOutgoing(ctx context.Context, userID, status, search string, page, limit int) (domain.CollaborationRequestList, error)
	GetStats(ctx context.Context, userID string) (domain.CollaborationStats, error)
	GetRequestByID(ctx context.Context, userID, requestID string) (domain.CollaborationRequest, error)
	AcceptRequest(ctx context.Context, userID, requestID string) (domain.CollaborationRequest, error)
	RejectRequest(ctx context.Context, userID, requestID, reason string) (domain.CollaborationRequest, error)
	WithdrawRequest(ctx context.Context, userID, requestID string) (domain.CollaborationRequest, error)

	ListConversations(ctx context.Context, userID string) ([]domain.Conversation, error)
	GetMessages(ctx context.Context, userID, conversationID string, page, limit int) (domain.MessageList, error)
	SendMessage(ctx context.Context, sender domain.User, conversationID string, in domain.SendMessageInput) (domain.Message, error)
}

type CollaborationHandler struct {
	svc CollabService
}

func NewCollaborationHandler(svc CollabService) *CollaborationHandler {
	return &CollaborationHandler{svc: svc}
}

// -----------------------------------------------------------------------------
// COLLABORATION REQUESTS HANDLERS
// -----------------------------------------------------------------------------

func (h *CollaborationHandler) Create(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	var input domain.CreateCollaborationRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	req, err := h.svc.CreateRequest(c.Request.Context(), user, input)
	switch {
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("create collaboration request failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusCreated, gin.H{"request": req})
	}
}

func (h *CollaborationHandler) ListIncoming(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	page, limit, ok := paginationParams(c)
	if !ok {
		return
	}

	status := c.Query("status")
	search := c.Query("q")

	list, err := h.svc.ListIncoming(c.Request.Context(), user.ID, status, search, page, limit)
	if err != nil {
		slog.Error("list incoming collaborations failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *CollaborationHandler) ListOutgoing(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	page, limit, ok := paginationParams(c)
	if !ok {
		return
	}

	status := c.Query("status")
	search := c.Query("q")

	list, err := h.svc.ListOutgoing(c.Request.Context(), user.ID, status, search, page, limit)
	if err != nil {
		slog.Error("list outgoing collaborations failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *CollaborationHandler) GetStats(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	stats, err := h.svc.GetStats(c.Request.Context(), user.ID)
	if err != nil {
		slog.Error("get collaboration stats failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

func (h *CollaborationHandler) GetDetail(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	reqID := c.Param("id")
	req, err := h.svc.GetRequestByID(c.Request.Context(), user.ID, reqID)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Permintaan kolaborasi tidak ditemukan.")
	case err != nil:
		slog.Error("get collaboration detail failed", "req_id", reqID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"request": req})
	}
}

func (h *CollaborationHandler) Accept(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	reqID := c.Param("id")
	req, err := h.svc.AcceptRequest(c.Request.Context(), user.ID, reqID)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Permintaan kolaborasi tidak ditemukan.")
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("accept collaboration failed", "req_id", reqID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"request": req})
	}
}

func (h *CollaborationHandler) Reject(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	reqID := c.Param("id")
	var body domain.RespondCollaborationInput
	_ = c.ShouldBindJSON(&body)

	req, err := h.svc.RejectRequest(c.Request.Context(), user.ID, reqID, body.Reason)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Permintaan kolaborasi tidak ditemukan.")
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("reject collaboration failed", "req_id", reqID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"request": req})
	}
}

func (h *CollaborationHandler) Withdraw(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	reqID := c.Param("id")
	req, err := h.svc.WithdrawRequest(c.Request.Context(), user.ID, reqID)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Permintaan kolaborasi tidak ditemukan.")
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("withdraw collaboration failed", "req_id", reqID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, gin.H{"request": req})
	}
}

// -----------------------------------------------------------------------------
// INBOX & MESSAGING HANDLERS
// -----------------------------------------------------------------------------

func (h *CollaborationHandler) ListConversations(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	convs, err := h.svc.ListConversations(c.Request.Context(), user.ID)
	if err != nil {
		slog.Error("list conversations failed", "user_id", user.ID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversations": convs})
}

func (h *CollaborationHandler) GetMessages(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	convID := c.Param("id")
	page := 1
	if pStr := c.Query("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p > 0 {
			page = p
		}
	}
	limit := 50
	if lStr := c.Query("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	msgs, err := h.svc.GetMessages(c.Request.Context(), user.ID, convID, page, limit)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Percakapan tidak ditemukan.")
	case err != nil:
		slog.Error("get messages failed", "conv_id", convID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, msgs)
	}
}

func (h *CollaborationHandler) SendMessage(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	convID := c.Param("id")
	var input domain.SendMessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format pesan tidak valid.")
		return
	}

	msg, err := h.svc.SendMessage(c.Request.Context(), user, convID, input)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Percakapan tidak ditemukan.")
	case isValidationError(err):
		writeError(c, http.StatusBadRequest, "validation_failed", validationMessage(err))
	case err != nil:
		slog.Error("send message failed", "conv_id", convID, "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusCreated, gin.H{"message": msg})
	}
}

