package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/store"
)

// BookmarkStore is the slice of the sqlc store this service depends on.
type BookmarkStore interface {
	ListBookmarks(ctx context.Context, arg store.ListBookmarksParams) ([]store.Business, error)
	InsertBookmark(ctx context.Context, arg store.InsertBookmarkParams) error
	DeleteBookmark(ctx context.Context, arg store.DeleteBookmarkParams) error
}

// BookmarkService owns the per-account bookmark list. The repository
// dependency is only used for published-lookups and hydration, so tests can
// pair this with a fake store.
type BookmarkService struct {
	bookmarks BookmarkStore
	repo      BusinessRepository
}

func NewBookmarkService(bookmarks BookmarkStore, repo BusinessRepository) *BookmarkService {
	return &BookmarkService{bookmarks: bookmarks, repo: repo}
}

// List returns every bookmark of the account in one page (bookmark counts
// stay small, so there is no pagination to design around).
func (s *BookmarkService) List(ctx context.Context, userID string) (domain.BusinessList, error) {
	userUUID, err := ownerUUID(userID)
	if err != nil {
		return domain.BusinessList{}, err
	}

	rows, err := s.bookmarks.ListBookmarks(ctx, store.ListBookmarksParams{UserID: userUUID})
	if err != nil {
		return domain.BusinessList{}, fmt.Errorf("list bookmarks: %w", err)
	}

	items := make([]domain.Business, 0, len(rows))
	for _, row := range rows {
		items = append(items, toBusiness(row))
	}
	if err := hydrate(ctx, s.repo, items); err != nil {
		return domain.BusinessList{}, err
	}

	count := len(items)
	return domain.BusinessList{Items: items, Total: int64(count), Page: 1, Limit: count}, nil
}

// Add bookmarks a published profile. Repeating it is a no-op, and a draft or
// unknown slug is indistinguishable (404) so strangers cannot probe for
// unpublished profiles.
func (s *BookmarkService) Add(ctx context.Context, userID, slug string) error {
	userUUID, err := s.credentials(userID, slug)
	if err != nil {
		return err
	}

	business, err := s.repo.GetPublishedBusinessBySlug(ctx, store.GetPublishedBusinessBySlugParams{Slug: slug})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("load business for bookmark: %w", err)
	}

	if err := s.bookmarks.InsertBookmark(ctx, store.InsertBookmarkParams{
		UserID:     userUUID,
		BusinessID: business.ID,
	}); err != nil {
		return fmt.Errorf("insert bookmark: %w", err)
	}
	return nil
}

// Remove unbookmarks by slug and stays idempotent: the profile may have been
// unpublished or deleted since, and the caller still deserves a success.
func (s *BookmarkService) Remove(ctx context.Context, userID, slug string) error {
	userUUID, err := s.credentials(userID, slug)
	if err != nil {
		return err
	}

	if err := s.bookmarks.DeleteBookmark(ctx, store.DeleteBookmarkParams{
		UserID: userUUID,
		Slug:   slug,
	}); err != nil {
		return fmt.Errorf("delete bookmark: %w", err)
	}
	return nil
}

func (s *BookmarkService) credentials(userID, slug string) (pgtype.UUID, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return pgtype.UUID{}, domain.ErrInvalidParameter
	}
	return ownerUUID(userID)
}
