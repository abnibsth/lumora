package service

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/alfian/lumora/backend/internal/domain"
)

type PartnerDB interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type PartnerService struct {
	db PartnerDB
}

func NewPartnerService(db PartnerDB) *PartnerService {
	return &PartnerService{db: db}
}

// -----------------------------------------------------------------------------
// PARTNER PROFILE (Public Identity & Offerings)
// -----------------------------------------------------------------------------

func (s *PartnerService) GetProfile(ctx context.Context, userID string) (domain.PartnerProfile, error) {
	var p domain.PartnerProfile
	var id, uID string
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, company_name, partner_type, logo, location, operational_coverage,
		       description, offered_collaborations, contact_email, contact_phone, contact_social,
		       share_contact, created_at, updated_at
		FROM partner_profiles
		WHERE user_id = $1`, userID).Scan(
		&id,
		&uID,
		&p.CompanyName,
		&p.PartnerType,
		&p.Logo,
		&p.Location,
		&p.OperationalCoverage,
		&p.Description,
		&p.OfferedCollaborations,
		&p.ContactEmail,
		&p.ContactPhone,
		&p.ContactSocial,
		&p.ShareContact,
		&createdAt,
		&updatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		blank := domain.PartnerProfile{
			UserID:                userID,
			PartnerType:           "Strategic Business Partner",
			OfferedCollaborations: []string{},
			Completeness:          0,
		}
		return blank, nil
	}

	if err != nil {
		return domain.PartnerProfile{}, fmt.Errorf("get partner profile: %w", err)
	}

	p.ID = id
	p.UserID = uID
	p.CreatedAt = createdAt
	p.UpdatedAt = updatedAt
	if p.OfferedCollaborations == nil {
		p.OfferedCollaborations = []string{}
	}
	p.Completeness = p.CalculateCompleteness()

	return p, nil
}

func (s *PartnerService) UpsertProfile(ctx context.Context, userID string, input domain.UpsertPartnerProfileInput) (domain.PartnerProfile, error) {
	if existing, err := s.GetProfile(ctx, userID); err == nil && existing.ID != "" {
		if input.CompanyName == "" {
			input.CompanyName = existing.CompanyName
		}
		if input.PartnerType == "" {
			input.PartnerType = existing.PartnerType
		}
		if input.Logo == "" {
			input.Logo = existing.Logo
		}
		if input.Location == "" {
			input.Location = existing.Location
		}
		if input.OperationalCoverage == "" {
			input.OperationalCoverage = existing.OperationalCoverage
		}
		if input.Description == "" {
			input.Description = existing.Description
		}
		if len(input.OfferedCollaborations) == 0 {
			input.OfferedCollaborations = existing.OfferedCollaborations
		}
		if input.ContactEmail == "" {
			input.ContactEmail = existing.ContactEmail
		}
		if input.ContactPhone == "" {
			input.ContactPhone = existing.ContactPhone
		}
		if input.ContactSocial == "" {
			input.ContactSocial = existing.ContactSocial
		}
	}

	if err := input.Validate(); err != nil {
		return domain.PartnerProfile{}, err
	}

	var p domain.PartnerProfile
	var id, uID string
	var createdAt, updatedAt time.Time

	// Only updates partner profile columns; NEVER touches partner_preferences.
	err := s.db.QueryRow(ctx, `
		INSERT INTO partner_profiles (
			user_id, company_name, partner_type, logo, location, operational_coverage,
			description, offered_collaborations, contact_email, contact_phone,
			contact_social, share_contact, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
		ON CONFLICT (user_id) DO UPDATE SET
			company_name           = EXCLUDED.company_name,
			partner_type           = EXCLUDED.partner_type,
			logo                   = EXCLUDED.logo,
			location               = EXCLUDED.location,
			operational_coverage   = EXCLUDED.operational_coverage,
			description            = EXCLUDED.description,
			offered_collaborations = EXCLUDED.offered_collaborations,
			contact_email          = EXCLUDED.contact_email,
			contact_phone          = EXCLUDED.contact_phone,
			contact_social         = EXCLUDED.contact_social,
			share_contact          = EXCLUDED.share_contact,
			updated_at             = now()
		RETURNING id, user_id, company_name, partner_type, logo, location, operational_coverage,
		          description, offered_collaborations, contact_email, contact_phone, contact_social,
		          share_contact, created_at, updated_at`,
		userID,
		input.CompanyName,
		input.PartnerType,
		input.Logo,
		input.Location,
		input.OperationalCoverage,
		input.Description,
		input.OfferedCollaborations,
		input.ContactEmail,
		input.ContactPhone,
		input.ContactSocial,
		input.ShareContact,
	).Scan(
		&id,
		&uID,
		&p.CompanyName,
		&p.PartnerType,
		&p.Logo,
		&p.Location,
		&p.OperationalCoverage,
		&p.Description,
		&p.OfferedCollaborations,
		&p.ContactEmail,
		&p.ContactPhone,
		&p.ContactSocial,
		&p.ShareContact,
		&createdAt,
		&updatedAt,
	)

	if err != nil {
		return domain.PartnerProfile{}, fmt.Errorf("upsert partner profile: %w", err)
	}

	p.ID = id
	p.UserID = uID
	p.CreatedAt = createdAt
	p.UpdatedAt = updatedAt
	if p.OfferedCollaborations == nil {
		p.OfferedCollaborations = []string{}
	}
	p.Completeness = p.CalculateCompleteness()

	return p, nil
}

// -----------------------------------------------------------------------------
// PARTNER PREFERENCES (Private Search & Matching Criteria)
// -----------------------------------------------------------------------------

func (s *PartnerService) GetPreferences(ctx context.Context, userID string) (domain.PartnerPreferences, error) {
	var pref domain.PartnerPreferences
	var id, uID, pID string
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, partner_profile_id, target_categories, search_region,
		       strict_region_match, seeking_collaborations, specific_needs,
		       qualification_criteria, created_at, updated_at
		FROM partner_preferences
		WHERE user_id = $1`, userID).Scan(
		&id,
		&uID,
		&pID,
		&pref.TargetCategories,
		&pref.SearchRegion,
		&pref.StrictRegionMatch,
		&pref.SeekingCollaborations,
		&pref.SpecificNeeds,
		&pref.QualificationCriteria,
		&createdAt,
		&updatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		// Ensure partner profile exists to link partner_profile_id
		profile, err := s.GetProfile(ctx, userID)
		if err != nil {
			return domain.PartnerPreferences{}, err
		}
		if profile.ID == "" {
			// Create base profile if not existing
			profile, err = s.UpsertProfile(ctx, userID, domain.UpsertPartnerProfileInput{})
			if err != nil {
				return domain.PartnerPreferences{}, err
			}
		}

		blank := domain.PartnerPreferences{
			UserID:                userID,
			PartnerProfileID:      profile.ID,
			TargetCategories:      []string{},
			SeekingCollaborations: []string{},
			HasPreferences:        false,
		}
		return blank, nil
	}

	if err != nil {
		return domain.PartnerPreferences{}, fmt.Errorf("get partner preferences: %w", err)
	}

	pref.ID = id
	pref.UserID = uID
	pref.PartnerProfileID = pID
	pref.CreatedAt = createdAt
	pref.UpdatedAt = updatedAt
	if pref.TargetCategories == nil {
		pref.TargetCategories = []string{}
	}
	if pref.SeekingCollaborations == nil {
		pref.SeekingCollaborations = []string{}
	}
	pref.HasPreferences = pref.CheckHasPreferences()

	return pref, nil
}

func (s *PartnerService) UpsertPreferences(ctx context.Context, userID string, input domain.UpsertPartnerPreferencesInput) (domain.PartnerPreferences, error) {
	// Ensure partner profile exists first to preserve composite foreign key
	profile, err := s.GetProfile(ctx, userID)
	if err != nil {
		return domain.PartnerPreferences{}, err
	}
	if profile.ID == "" {
		profile, err = s.UpsertProfile(ctx, userID, domain.UpsertPartnerProfileInput{})
		if err != nil {
			return domain.PartnerPreferences{}, err
		}
	}

	if err := input.Validate(); err != nil {
		return domain.PartnerPreferences{}, err
	}

	var pref domain.PartnerPreferences
	var id, uID, pID string
	var createdAt, updatedAt time.Time

	// Only updates partner_preferences columns; NEVER touches partner_profiles.
	err = s.db.QueryRow(ctx, `
		INSERT INTO partner_preferences (
			user_id, partner_profile_id, target_categories, search_region,
			strict_region_match, seeking_collaborations, specific_needs,
			qualification_criteria, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
		ON CONFLICT (user_id) DO UPDATE SET
			partner_profile_id     = EXCLUDED.partner_profile_id,
			target_categories      = EXCLUDED.target_categories,
			search_region          = EXCLUDED.search_region,
			strict_region_match    = EXCLUDED.strict_region_match,
			seeking_collaborations = EXCLUDED.seeking_collaborations,
			specific_needs         = EXCLUDED.specific_needs,
			qualification_criteria = EXCLUDED.qualification_criteria,
			updated_at             = now()
		RETURNING id, user_id, partner_profile_id, target_categories, search_region,
		          strict_region_match, seeking_collaborations, specific_needs,
		          qualification_criteria, created_at, updated_at`,
		userID,
		profile.ID,
		input.TargetCategories,
		input.SearchRegion,
		input.StrictRegionMatch,
		input.SeekingCollaborations,
		input.SpecificNeeds,
		input.QualificationCriteria,
	).Scan(
		&id,
		&uID,
		&pID,
		&pref.TargetCategories,
		&pref.SearchRegion,
		&pref.StrictRegionMatch,
		&pref.SeekingCollaborations,
		&pref.SpecificNeeds,
		&pref.QualificationCriteria,
		&createdAt,
		&updatedAt,
	)

	if err != nil {
		return domain.PartnerPreferences{}, fmt.Errorf("upsert partner preferences: %w", err)
	}

	pref.ID = id
	pref.UserID = uID
	pref.PartnerProfileID = pID
	pref.CreatedAt = createdAt
	pref.UpdatedAt = updatedAt
	if pref.TargetCategories == nil {
		pref.TargetCategories = []string{}
	}
	if pref.SeekingCollaborations == nil {
		pref.SeekingCollaborations = []string{}
	}
	pref.HasPreferences = pref.CheckHasPreferences()

	return pref, nil
}

// -----------------------------------------------------------------------------
// SMART PARTNER MATCHING ENGINE
// -----------------------------------------------------------------------------

type businessCandidateRow struct {
	business       domain.Business
	bmCCount       int
	milestoneCount int
}

func (s *PartnerService) GetMatches(ctx context.Context, userID string, page, limit int) (domain.BusinessMatchList, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 12
	}
	if limit > 50 {
		limit = 50
	}

	prefs, err := s.GetPreferences(ctx, userID)
	if err != nil {
		return domain.BusinessMatchList{}, err
	}

	// 1. Query candidate pool from PostgreSQL with Hard Filters
	// Hard Filter 1: status = 'published' (Always mandatory; draft/archived never leak)
	query := `
		SELECT b.id, b.slug, b.name, b.category, b.location, b.description, b.story,
		       b.cover_image, b.cover_position, b.logo, b.founded_year, b.revenue_label,
		       b.growth_label, b.revenue_series, b.seeking, b.seeking_objective,
		       b.owner_name, b.owner_role, b.owner_bio, b.status, b.verified,
		       (SELECT count(*) FROM bmc_entries WHERE business_id = b.id) AS bmc_count,
		       (SELECT count(*) FROM business_milestones WHERE business_id = b.id) AS milestone_count
		FROM businesses b
		WHERE b.status = 'published'
	`
	var args []any
	argIdx := 1

	// Hard Filter 2: Sektor Target (If partner specified categories)
	if len(prefs.TargetCategories) > 0 {
		query += fmt.Sprintf(" AND b.category = ANY($%d)", argIdx)
		args = append(args, prefs.TargetCategories)
		argIdx++
	}

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return domain.BusinessMatchList{}, fmt.Errorf("query matching candidates: %w", err)
	}
	defer rows.Close()

	var candidates []businessCandidateRow
	for rows.Next() {
		var c businessCandidateRow
		var b domain.Business
		var id string
		var coverImg, coverPos, logo, revLabel, growthLabel, seekingObj *string

		err := rows.Scan(
			&id, &b.Slug, &b.Name, &b.Category, &b.Location, &b.Description, &b.Story,
			&coverImg, &coverPos, &logo, &b.FoundedYear, &revLabel,
			&growthLabel, &b.RevenueSeries, &b.Seeking, &seekingObj,
			&b.Owner.Name, &b.Owner.Role, &b.Owner.Bio, &b.Status, &b.Verified,
			&c.bmCCount, &c.milestoneCount,
		)
		if err != nil {
			return domain.BusinessMatchList{}, fmt.Errorf("scan business candidate: %w", err)
		}

		b.ID = id
		if coverImg != nil {
			b.CoverImage = *coverImg
		}
		if coverPos != nil {
			b.CoverPosition = *coverPos
		}
		if logo != nil {
			b.Logo = *logo
		}
		if revLabel != nil {
			b.RevenueLabel = *revLabel
		}
		if growthLabel != nil {
			b.GrowthLabel = *growthLabel
		}
		if seekingObj != nil {
			b.SeekingObjective = *seekingObj
		}
		b.Seeking = domain.NormalizeTaxonomySlice(b.Seeking)

		c.business = b
		candidates = append(candidates, c)
	}
	if err := rows.Err(); err != nil {
		return domain.BusinessMatchList{}, err
	}

	// 2. Compute Deterministic Scoring and Reasons
	var matches []domain.BusinessMatch

	for _, cand := range candidates {
		b := cand.business
		var reasons []domain.MatchReason
		score := 0

		// --- Component A: Sektor / Kategori Match ---
		if len(prefs.TargetCategories) > 0 {
			reasons = append(reasons, domain.MatchReason{
				Type:   "SECTOR",
				Label:  "Sektor Target Sesuai",
				Detail: fmt.Sprintf("Kategori %s masuk dalam fokus sektor yang Anda cari.", b.Category),
			})
		}

		// --- Component B: Taxonomy Match (Maks 40 Poin) ---
		taxScore := 0
		if len(prefs.SeekingCollaborations) == 0 {
			// Partner has no specific collaboration constraint: neutral 20 points
			taxScore = 20
		} else {
			matchedTaxonomies := make([]string, 0)
			for _, umkmNeed := range b.Seeking {
				for _, partnerSeek := range prefs.SeekingCollaborations {
					if umkmNeed == partnerSeek {
						matchedTaxonomies = append(matchedTaxonomies, umkmNeed)
						break
					}
				}
			}

			if len(matchedTaxonomies) > 0 {
				taxScore = 40
				labels := make([]string, 0, len(matchedTaxonomies))
				for _, t := range matchedTaxonomies {
					if reg, ok := domain.MasterTaxonomyRegistry[t]; ok {
						labels = append(labels, reg.PartnerSeek)
					} else {
						labels = append(labels, t)
					}
				}
				reasons = append(reasons, domain.MatchReason{
					Type:   "TAXONOMY",
					Label:  "Bentuk Kemitraan Selaras",
					Detail: fmt.Sprintf("UMKM mencari %s, sesuai kriteria kolaborasi Anda.", strings.Join(labels, ", ")),
				})
			} else {
				taxScore = 0
			}
		}
		score += taxScore

		// --- Component C: Geographic Match (Maks 25 Poin) ---
		geoMatches, confidence := domain.EvaluateGeographicMatch(prefs.SearchRegion, b.Location)
		if prefs.StrictRegionMatch && !geoMatches {
			// Hard Filter: eliminated if strict region is active and location does not match
			continue
		}

		geoScore := 0
		if strings.TrimSpace(prefs.SearchRegion) == "" {
			geoScore = 18 // Neutral score if partner specifies no region
		} else if geoMatches {
			geoScore = int(25.0 * confidence)
			reasons = append(reasons, domain.MatchReason{
				Type:   "REGION",
				Label:  "Wilayah Relevan",
				Detail: fmt.Sprintf("%s terhubung dengan fokus wilayah pencarian %s.", b.Location, prefs.SearchRegion),
			})
		}
		score += geoScore

		// --- Component D: Business Data Completeness (Maks 20 Poin) ---
		// Does NOT penalize missing data; only rewards structured completeness
		dataScore := 0
		if cand.bmCCount >= 5 {
			dataScore += 10
		}
		if cand.milestoneCount >= 2 {
			dataScore += 5
		}
		if b.RevenueLabel != "" || b.GrowthLabel != "" {
			dataScore += 5
		}
		if dataScore >= 15 {
			reasons = append(reasons, domain.MatchReason{
				Type:   "DATA",
				Label:  "Data & BMC Terstruktur",
				Detail: "UMKM telah melengkapi profil model bisnis dan catatan perkembangan usaha.",
			})
		}
		score += dataScore

		// --- Component E: Verification Status (Maks 15 Poin) ---
		verifScore := 5 // Base score for all active businesses
		if b.Verified {
			verifScore = 15
			reasons = append(reasons, domain.MatchReason{
				Type:   "VERIFIED",
				Label:  "Terverifikasi",
				Detail: "Profil bisnis telah diverifikasi oleh LUMORA.",
			})
		}
		score += verifScore

		// Clamp score to 100 max
		if score > 100 {
			score = 100
		}

		matches = append(matches, domain.BusinessMatch{
			Business:   b,
			MatchScore: score,
			Reasons:    reasons,
		})
	}

	// 3. Sort Descending by MatchScore
	sort.Slice(matches, func(i, j int) bool {
		if matches[i].MatchScore == matches[j].MatchScore {
			return matches[i].Business.Name < matches[j].Business.Name
		}
		return matches[i].MatchScore > matches[j].MatchScore
	})

	total := int64(len(matches))
	start := (page - 1) * limit
	if start > len(matches) {
		start = len(matches)
	}
	end := start + limit
	if end > len(matches) {
		end = len(matches)
	}

	paginated := matches[start:end]

	return domain.BusinessMatchList{
		Items:          paginated,
		Total:          total,
		Page:           page,
		Limit:          limit,
		HasPreferences: prefs.HasPreferences,
	}, nil
}
