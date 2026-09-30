package handler

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
	"github.com/alfian/lumora/backend/internal/service"
)

// BusinessService is the slice of the service the HTTP layer needs, declared
// here so handlers can be tested without touching the database.
type BusinessService interface {
	List(ctx context.Context, p domain.BusinessListParams) (domain.BusinessList, error)
	BySlug(ctx context.Context, slug string) (domain.Business, error)
	Create(ctx context.Context, userID string, input domain.CreateBusinessInput) (domain.OwnedBusiness, error)
	Update(ctx context.Context, userID, id string, input domain.UpdateBusinessInput) (domain.OwnedBusiness, error)
	Publish(ctx context.Context, userID, id string) (domain.OwnedBusiness, error)
	ListMine(ctx context.Context, userID string, page, limit int) (domain.OwnedBusinessList, error)
}

type BusinessHandler struct {
	svc BusinessService
}

func NewBusinessHandler(svc BusinessService) *BusinessHandler {
	return &BusinessHandler{svc: svc}
}

// List handles GET /api/v1/businesses?q=&category=&location=&page=&limit=
func (h *BusinessHandler) List(c *gin.Context) {
	page, limit, ok := paginationParams(c)
	if !ok {
		return
	}

	result, err := h.svc.List(c.Request.Context(), domain.BusinessListParams{
		Query:    strings.TrimSpace(c.Query("q")),
		Category: strings.TrimSpace(c.Query("category")),
		Location: strings.TrimSpace(c.Query("location")),
		Page:     page,
		Limit:    limit,
	})
	switch {
	case errors.Is(err, domain.ErrInvalidCategory):
		writeError(c, http.StatusBadRequest, "invalid_category",
			fmt.Sprintf("category harus salah satu dari: %s", strings.Join(domain.Categories, ", ")))
	case errors.Is(err, domain.ErrInvalidParameter):
		writeError(c, http.StatusBadRequest, "invalid_parameter", err.Error())
	case err != nil:
		slog.Error("list businesses failed", "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, result)
	}
}

// Detail handles GET /api/v1/businesses/:slug
func (h *BusinessHandler) Detail(c *gin.Context) {
	business, err := h.svc.BySlug(c.Request.Context(), strings.TrimSpace(c.Param("slug")))
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Profil bisnis tidak ditemukan.")
	case errors.Is(err, domain.ErrInvalidParameter):
		writeError(c, http.StatusBadRequest, "invalid_parameter", err.Error())
	case err != nil:
		slog.Error("business detail failed", "slug", c.Param("slug"), "err", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, business)
	}
}

// ListMine handles GET /api/v1/businesses/mine. Route is behind
// middleware.RequireSession, so the user is always present here.
func (h *BusinessHandler) ListMine(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	page, limit, ok := paginationParams(c)
	if !ok {
		return
	}

	result, err := h.svc.ListMine(c.Request.Context(), user.ID, page, limit)
	if err != nil {
		if !writeDomainError(c, err) {
			slog.Error("list own businesses failed", "err", err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusOK, result)
}

// ErrorBody is the single error envelope for the whole API.
func writeError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{
		"error": gin.H{"code": code, "message": message},
	})
}

// writeDomainError maps the sentinel errors shared by the write endpoints and
// reports whether it handled the error. Anything it declines is an
// unexpected failure the caller should log before answering 500.
func writeDomainError(c *gin.Context, err error) bool {
	var validationErr *domain.ValidationError
	switch {
	case errors.As(err, &validationErr):
		writeError(c, http.StatusBadRequest, "validation_failed", validationErr.Message)
	case errors.Is(err, domain.ErrInvalidCategory):
		writeError(c, http.StatusBadRequest, "invalid_category",
			fmt.Sprintf("category harus salah satu dari: %s", strings.Join(domain.Categories, ", ")))
	case errors.Is(err, domain.ErrInvalidParameter):
		writeError(c, http.StatusBadRequest, "invalid_parameter", "Parameter tidak valid.")
	case errors.Is(err, domain.ErrNotFound):
		writeError(c, http.StatusNotFound, "not_found", "Profil bisnis tidak ditemukan.")
	case errors.Is(err, domain.ErrForbidden):
		writeError(c, http.StatusForbidden, "forbidden", "Anda tidak punya akses untuk mengubah profil ini.")
	case errors.Is(err, domain.ErrAIUnavailable):
		writeError(c, http.StatusServiceUnavailable, "ai_unavailable",
			"Layanan AI sedang tidak tersedia. Coba lagi sebentar lagi.")
	default:
		return false
	}
	return true
}

// Create handles POST /api/v1/businesses. Route is behind
// middleware.RequireSession, so the user is always present here.
func (h *BusinessHandler) Create(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	var input domain.CreateBusinessInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	business, err := h.svc.Create(c.Request.Context(), user.ID, input)
	if err != nil {
		if !writeDomainError(c, err) {
			slog.Error("create business failed", "err", err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusCreated, business)
}

// Update handles PATCH /api/v1/businesses/:id.
func (h *BusinessHandler) Update(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	var input domain.UpdateBusinessInput
	if err := c.ShouldBindJSON(&input); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body", "Format permintaan tidak valid.")
		return
	}

	business, err := h.svc.Update(c.Request.Context(), user.ID, c.Param("id"), input)
	if err != nil {
		if !writeDomainError(c, err) {
			slog.Error("update business failed", "business_id", c.Param("id"), "err", err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusOK, business)
}

// Publish handles POST /api/v1/businesses/:id/publish.
func (h *BusinessHandler) Publish(c *gin.Context) {
	user, ok := middleware.CurrentUser(c)
	if !ok {
		writeError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
		return
	}

	business, err := h.svc.Publish(c.Request.Context(), user.ID, c.Param("id"))
	if err != nil {
		if !writeDomainError(c, err) {
			slog.Error("publish business failed", "business_id", c.Param("id"), "err", err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusOK, business)
}

// paginationParams reads and validates the optional page/limit query pair,
// writing the 400 envelope itself and reporting false when it already did.
func paginationParams(c *gin.Context) (page, limit int, ok bool) {
	page, err := intParam(c, "page", service.DefaultPage)
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid_parameter", err.Error())
		return 0, 0, false
	}
	if page < 1 {
		writeError(c, http.StatusBadRequest, "invalid_parameter", "page minimal 1")
		return 0, 0, false
	}

	limit, err = intParam(c, "limit", service.DefaultLimit)
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid_parameter", err.Error())
		return 0, 0, false
	}
	if limit < 1 || limit > service.MaxLimit {
		writeError(c, http.StatusBadRequest, "invalid_parameter",
			fmt.Sprintf("limit harus antara 1 dan %d", service.MaxLimit))
		return 0, 0, false
	}
	return page, limit, true
}

// intParam reads an optional integer query parameter, falling back when the
// parameter is absent and failing when it is present but not a number.
func intParam(c *gin.Context, name string, fallback int) (int, error) {
	raw := strings.TrimSpace(c.Query(name))
	if raw == "" {
		return fallback, nil
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fmt.Errorf("%s harus berupa angka", name)
	}
	return value, nil
}
