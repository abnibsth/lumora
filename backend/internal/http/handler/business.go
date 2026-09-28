package handler

import (
	"context"
	"errors"
	"fmt"
	"log"
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
}

type BusinessHandler struct {
	svc BusinessService
}

func NewBusinessHandler(svc BusinessService) *BusinessHandler {
	return &BusinessHandler{svc: svc}
}

// List handles GET /api/v1/businesses?q=&category=&location=&page=&limit=
func (h *BusinessHandler) List(c *gin.Context) {
	page, err := intParam(c, "page", service.DefaultPage)
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid_parameter", err.Error())
		return
	}
	if page < 1 {
		writeError(c, http.StatusBadRequest, "invalid_parameter", "page minimal 1")
		return
	}

	limit, err := intParam(c, "limit", service.DefaultLimit)
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid_parameter", err.Error())
		return
	}
	if limit < 1 || limit > service.MaxLimit {
		writeError(c, http.StatusBadRequest, "invalid_parameter",
			fmt.Sprintf("limit harus antara 1 dan %d", service.MaxLimit))
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
		log.Printf("list businesses: %v", err)
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
		log.Printf("business detail %q: %v", c.Param("slug"), err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
	default:
		c.JSON(http.StatusOK, business)
	}
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
			log.Printf("create business: %v", err)
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
			log.Printf("update business %q: %v", c.Param("id"), err)
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
			log.Printf("publish business %q: %v", c.Param("id"), err)
			writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		}
		return
	}
	c.JSON(http.StatusOK, business)
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
