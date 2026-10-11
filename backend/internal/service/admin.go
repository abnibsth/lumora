package service

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"

	"github.com/alfian/lumora/backend/internal/domain"
)

type AdminDB interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

type AdminService struct {
	db AdminDB
}

func NewAdminService(db AdminDB) *AdminService {
	return &AdminService{db: db}
}

func (s *AdminService) Overview(ctx context.Context) (domain.AdminOverview, error) {
	result := domain.AdminOverview{
		RegistrationGrowth: []domain.AdminGrowthPoint{},
		RecentBusinesses:   []domain.AdminRecentBusiness{},
	}
	if err := s.db.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE role <> 'admin'),
			COUNT(*) FILTER (WHERE role = 'umkm'),
			COUNT(*) FILTER (WHERE role = 'mitra'),
			(SELECT COUNT(*) FROM businesses WHERE status <> 'archived'),
			(SELECT COUNT(*) FROM businesses WHERE status = 'published'),
			(SELECT COUNT(*) FROM businesses WHERE status = 'published' AND verified = false)
		FROM users`).Scan(
		&result.Metrics.TotalUsers,
		&result.Metrics.TotalUMKMUsers,
		&result.Metrics.TotalMitraUsers,
		&result.Metrics.TotalBusinesses,
		&result.Metrics.PublishedBusinesses,
		&result.Metrics.UnverifiedPublishedBusinesses,
	); err != nil {
		return domain.AdminOverview{}, fmt.Errorf("admin metrics: %w", err)
	}

	growthRows, err := s.db.Query(ctx, `
		SELECT date_trunc('month', created_at), COUNT(*)
		FROM businesses
		WHERE created_at >= date_trunc('month', now()) - interval '5 months'
		GROUP BY 1 ORDER BY 1`)
	if err != nil {
		return domain.AdminOverview{}, fmt.Errorf("admin growth: %w", err)
	}
	defer growthRows.Close()
	for growthRows.Next() {
		var point domain.AdminGrowthPoint
		if err := growthRows.Scan(&point.Month, &point.Count); err != nil {
			return domain.AdminOverview{}, fmt.Errorf("scan admin growth: %w", err)
		}
		result.RegistrationGrowth = append(result.RegistrationGrowth, point)
	}
	if err := growthRows.Err(); err != nil {
		return domain.AdminOverview{}, fmt.Errorf("iterate admin growth: %w", err)
	}

	recentRows, err := s.db.Query(ctx, `
		SELECT id::text, name, category, location, created_at, status, verified
		FROM businesses ORDER BY created_at DESC, id DESC LIMIT 10`)
	if err != nil {
		return domain.AdminOverview{}, fmt.Errorf("admin recent businesses: %w", err)
	}
	defer recentRows.Close()
	for recentRows.Next() {
		var business domain.AdminRecentBusiness
		if err := recentRows.Scan(&business.ID, &business.Name, &business.Category, &business.Location, &business.CreatedAt, &business.Status, &business.Verified); err != nil {
			return domain.AdminOverview{}, fmt.Errorf("scan admin recent business: %w", err)
		}
		result.RecentBusinesses = append(result.RecentBusinesses, business)
	}
	if err := recentRows.Err(); err != nil {
		return domain.AdminOverview{}, fmt.Errorf("iterate admin recent businesses: %w", err)
	}
	return result, nil
}
