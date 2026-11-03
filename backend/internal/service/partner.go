package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/alfian/lumora/backend/internal/domain"
)

type PartnerDB interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type PartnerService struct {
	db PartnerDB
}

func NewPartnerService(db PartnerDB) *PartnerService {
	return &PartnerService{db: db}
}

func (s *PartnerService) GetProfile(ctx context.Context, userID string) (domain.PartnerProfile, error) {
	var p domain.PartnerProfile
	var id string
	var uID string
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, company_name, partner_type, location, operational_coverage,
		       interested_categories, partnership_types, collaboration_types, description,
		       partnership_needs, search_region, business_criteria, contact_email,
		       contact_phone, contact_social, share_contact,
		       created_at, updated_at
		FROM partner_profiles
		WHERE user_id = $1`, userID).Scan(
		&id,
		&uID,
		&p.CompanyName,
		&p.PartnerType,
		&p.Location,
		&p.OperationalCoverage,
		&p.InterestedCategories,
		&p.PartnershipTypes,
		&p.CollaborationTypes,
		&p.Description,
		&p.PartnershipNeeds,
		&p.SearchRegion,
		&p.BusinessCriteria,
		&p.ContactEmail,
		&p.ContactPhone,
		&p.ContactSocial,
		&p.ShareContact,
		&createdAt,
		&updatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		// Return clean initial profile if not yet configured
		blank := domain.PartnerProfile{
			UserID:               userID,
			PartnerType:          "Strategic Business Partner",
			InterestedCategories: []string{},
			PartnershipTypes:     []string{},
			CollaborationTypes:   []string{},
			Completeness:         0,
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
	p.Completeness = p.CalculateCompleteness()

	if p.InterestedCategories == nil {
		p.InterestedCategories = []string{}
	}
	if p.PartnershipTypes == nil {
		p.PartnershipTypes = []string{}
	}
	if p.CollaborationTypes == nil {
		p.CollaborationTypes = []string{}
	}

	return p, nil
}

func (s *PartnerService) UpsertProfile(ctx context.Context, userID string, input domain.UpsertPartnerProfileInput) (domain.PartnerProfile, error) {
	// Preserve existing values for fields omitted in partial updates
	if existing, err := s.GetProfile(ctx, userID); err == nil && existing.ID != "" {
		if input.CompanyName == "" {
			input.CompanyName = existing.CompanyName
		}
		if input.PartnerType == "" {
			input.PartnerType = existing.PartnerType
		}
		if input.Location == "" {
			input.Location = existing.Location
		}
		if input.OperationalCoverage == "" {
			input.OperationalCoverage = existing.OperationalCoverage
		}
		if len(input.InterestedCategories) == 0 {
			input.InterestedCategories = existing.InterestedCategories
		}
		if len(input.PartnershipTypes) == 0 {
			input.PartnershipTypes = existing.PartnershipTypes
		}
		if len(input.CollaborationTypes) == 0 {
			input.CollaborationTypes = existing.CollaborationTypes
		}
		if input.Description == "" {
			input.Description = existing.Description
		}
		if input.PartnershipNeeds == "" {
			input.PartnershipNeeds = existing.PartnershipNeeds
		}
		if input.SearchRegion == "" {
			input.SearchRegion = existing.SearchRegion
		}
		if input.BusinessCriteria == "" {
			input.BusinessCriteria = existing.BusinessCriteria
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

	err := s.db.QueryRow(ctx, `
		INSERT INTO partner_profiles (
			user_id, company_name, partner_type, location, operational_coverage,
			interested_categories, partnership_types, collaboration_types, description,
			partnership_needs, search_region, business_criteria, contact_email,
			contact_phone, contact_social, share_contact,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, now())
		ON CONFLICT (user_id) DO UPDATE SET
			company_name = EXCLUDED.company_name,
			partner_type = EXCLUDED.partner_type,
			location = EXCLUDED.location,
			operational_coverage = EXCLUDED.operational_coverage,
			interested_categories = EXCLUDED.interested_categories,
			partnership_types = EXCLUDED.partnership_types,
			collaboration_types = EXCLUDED.collaboration_types,
			description = EXCLUDED.description,
			partnership_needs = EXCLUDED.partnership_needs,
			search_region = EXCLUDED.search_region,
			business_criteria = EXCLUDED.business_criteria,
			contact_email = EXCLUDED.contact_email,
			contact_phone = EXCLUDED.contact_phone,
			contact_social = EXCLUDED.contact_social,
			share_contact = EXCLUDED.share_contact,
			updated_at = now()
		RETURNING id, user_id, company_name, partner_type, location, operational_coverage,
		          interested_categories, partnership_types, collaboration_types, description,
		          partnership_needs, search_region, business_criteria, contact_email,
		          contact_phone, contact_social, share_contact,
		          created_at, updated_at`,
		userID,
		input.CompanyName,
		input.PartnerType,
		input.Location,
		input.OperationalCoverage,
		input.InterestedCategories,
		input.PartnershipTypes,
		input.CollaborationTypes,
		input.Description,
		input.PartnershipNeeds,
		input.SearchRegion,
		input.BusinessCriteria,
		input.ContactEmail,
		input.ContactPhone,
		input.ContactSocial,
		input.ShareContact,
	).Scan(
		&id,
		&uID,
		&p.CompanyName,
		&p.PartnerType,
		&p.Location,
		&p.OperationalCoverage,
		&p.InterestedCategories,
		&p.PartnershipTypes,
		&p.CollaborationTypes,
		&p.Description,
		&p.PartnershipNeeds,
		&p.SearchRegion,
		&p.BusinessCriteria,
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
	p.Completeness = p.CalculateCompleteness()

	if p.InterestedCategories == nil {
		p.InterestedCategories = []string{}
	}
	if p.PartnershipTypes == nil {
		p.PartnershipTypes = []string{}
	}
	if p.CollaborationTypes == nil {
		p.CollaborationTypes = []string{}
	}

	return p, nil
}
