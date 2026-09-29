package handler

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// BookmarkService is the slice of the bookmark service the HTTP layer needs.
type BookmarkService interface {
	List(ctx context.Context, userID string) (domain.BusinessList, error)
	Add(ctx context.Context, userID, slug string) error
	Remove(ctx context.Context, userID, slug string) error
}

type BookmarkHandler struct {
	svc BookmarkService
}

func NewBookmarkHandler(svc BookmarkService) *BookmarkHandler {
	return &BookmarkHandler{svc: svc}
}

// sessionUserID reads the account put there by middleware.AttachSession. The
// routes sit behind middleware.RequireSession, so failure here is defensive.
func sessionUserID(c *gin.Context) (string, bool) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return "", false
	}
	return user.ID, true
}

// List handles GET /api/v1/bookmarks.
func (h *BookmarkHandler) List(c *gin.Context) {
	userID, ok := sessionUserID(c)
	if !ok {
		return
	}

	result, err := h.svc.List(c.Request.Context(), userID)
	if err != nil {
		if !writeDomainError(c, err) {
			log.Printf("list bookmarks: %v", err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusOK, result)
}

// Add handles POST /api/v1/bookmarks/:slug. Idempotent: already-bookmarked
// and freshly-bookmarked both answer 200.
func (h *BookmarkHandler) Add(c *gin.Context) {
	userID, ok := sessionUserID(c)
	if !ok {
		return
	}

	if err := h.svc.Add(c.Request.Context(), userID, c.Param("slug")); err != nil {
		if !writeDomainError(c, err) {
			log.Printf("add bookmark %q: %v", c.Param("slug"), err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// Remove handles DELETE /api/v1/bookmarks/:slug. Always 200 when the session
// is valid, even if the bookmark was already gone.
func (h *BookmarkHandler) Remove(c *gin.Context) {
	userID, ok := sessionUserID(c)
	if !ok {
		return
	}

	if err := h.svc.Remove(c.Request.Context(), userID, c.Param("slug")); err != nil {
		if !writeDomainError(c, err) {
			log.Printf("remove bookmark %q: %v", c.Param("slug"), err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
