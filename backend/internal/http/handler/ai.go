package handler

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// AIDraftService is the slice of the AI service this handler needs, declared
// here so the handler can be tested without a provider behind it.
type AIDraftService interface {
	Draft(ctx context.Context, in domain.DraftProfileInput) (domain.DraftProfile, error)
}

// maxDraftRequestBytes caps the body before it is decoded. The narrative is
// capped again in the domain layer; this stops an oversized body from being
// read into memory in the first place.
const maxDraftRequestBytes = 64 << 10

type AIHandler struct {
	svc AIDraftService
}

func NewAIHandler(svc AIDraftService) *AIHandler {
	return &AIHandler{svc: svc}
}

// Draft handles POST /api/v1/ai/draft-profile. The route is behind
// middleware.RequireSession, so the user is always present here.
func (h *AIHandler) Draft(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxDraftRequestBytes)

	var input domain.DraftProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	draft, err := h.svc.Draft(c.Request.Context(), input)
	if err != nil {
		if !writeDomainError(c, err) {
			log.Printf("ai draft: user=%s err=%v", user.ID, err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}

	c.JSON(http.StatusOK, draft)
}
