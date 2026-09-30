package main

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/config"
	"github.com/alfian/lumora/backend/internal/logging"
	"github.com/alfian/lumora/backend/internal/store"
)

// Seed inserts the demo catalogue once. Re-running skips slugs that already
// exist, so it is safe to run after schema changes.
func main() {
	cfg, err := config.Load()
	if err != nil {
		logging.Fatal("config load failed", "err", err)
	}
	logging.Setup(cfg.AppEnv, cfg.LogLevel)
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logging.Fatal("db pool failed", "err", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		logging.Fatal("db ping failed", "err", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		logging.Fatal("begin tx failed", "err", err)
	}
	defer tx.Rollback(ctx)

	qtx := store.New(pool).WithTx(tx)

	inserted, skipped := 0, 0
	for _, business := range seedBusinesses {
		exists, err := qtx.ExistsBusinessBySlug(ctx, store.ExistsBusinessBySlugParams{Slug: business.Slug})
		if err != nil {
			logging.Fatal("check slug failed", "slug", business.Slug, "err", err)
		}
		if exists {
			skipped++
			continue
		}

		row, err := qtx.InsertBusiness(ctx, store.InsertBusinessParams{
			Slug:             business.Slug,
			Name:             business.Name,
			Category:         business.Category,
			Location:         business.Location,
			Description:      business.Description,
			Story:            business.Story,
			CoverImage:       strPtr(business.CoverImage),
			CoverPosition:    strPtr(business.CoverPosition),
			FoundedYear:      int32(business.FoundedYear),
			RevenueLabel:     strPtr(business.RevenueLabel),
			GrowthLabel:      strPtr(business.GrowthLabel),
			RevenueSeries:    business.RevenueSeries,
			Seeking:          business.Seeking,
			SeekingObjective: strPtr(business.SeekingObjective),
			OwnerName:        business.Owner.Name,
			OwnerRole:        business.Owner.Role,
			OwnerBio:         business.Owner.Bio,
			Status:           "published",
			Verified:         false,
		})
		if err != nil {
			logging.Fatal("insert business failed", "slug", business.Slug, "err", err)
		}

		for position, milestone := range business.Milestones {
			if err := qtx.InsertMilestone(ctx, store.InsertMilestoneParams{
				BusinessID:  row.ID,
				Year:        int32(milestone.Year),
				Title:       milestone.Title,
				Description: strPtr(milestone.Description),
				Position:    int32(position),
			}); err != nil {
				logging.Fatal("insert milestone failed", "slug", business.Slug, "err", err)
			}
		}

		for position, entry := range business.BMC {
			if err := qtx.InsertBmcEntry(ctx, store.InsertBmcEntryParams{
				BusinessID: row.ID,
				Label:      entry.Label,
				Value:      entry.Value,
				Position:   int32(position),
			}); err != nil {
				logging.Fatal("insert bmc failed", "slug", business.Slug, "err", err)
			}
		}
		inserted++
	}

	if err := tx.Commit(ctx); err != nil {
		logging.Fatal("commit failed", "err", err)
	}

	slog.Info("seed selesai", "inserted", inserted, "skipped", skipped)
}

// strPtr maps an empty string to SQL NULL so optional columns stay optional.
func strPtr(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
