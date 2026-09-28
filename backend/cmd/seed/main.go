package main

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/config"
	"github.com/alfian/lumora/backend/internal/store"
)

// Seed inserts the demo catalogue once. Re-running skips slugs that already
// exist, so it is safe to run after schema changes.
func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db pool: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatalf("begin tx: %v", err)
	}
	defer tx.Rollback(ctx)

	qtx := store.New(pool).WithTx(tx)

	inserted, skipped := 0, 0
	for _, business := range seedBusinesses {
		exists, err := qtx.ExistsBusinessBySlug(ctx, store.ExistsBusinessBySlugParams{Slug: business.Slug})
		if err != nil {
			log.Fatalf("cek slug %s: %v", business.Slug, err)
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
			log.Fatalf("insert %s: %v", business.Slug, err)
		}

		for position, milestone := range business.Milestones {
			if err := qtx.InsertMilestone(ctx, store.InsertMilestoneParams{
				BusinessID:  row.ID,
				Year:        int32(milestone.Year),
				Title:       milestone.Title,
				Description: strPtr(milestone.Description),
				Position:    int32(position),
			}); err != nil {
				log.Fatalf("insert milestone %s: %v", business.Slug, err)
			}
		}

		for position, entry := range business.BMC {
			if err := qtx.InsertBmcEntry(ctx, store.InsertBmcEntryParams{
				BusinessID: row.ID,
				Label:      entry.Label,
				Value:      entry.Value,
				Position:   int32(position),
			}); err != nil {
				log.Fatalf("insert bmc %s: %v", business.Slug, err)
			}
		}
		inserted++
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatalf("commit: %v", err)
	}

	log.Printf("seed selesai: %d disisipkan, %d dilewati (sudah ada)", inserted, skipped)
}

// strPtr maps an empty string to SQL NULL so optional columns stay optional.
func strPtr(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
