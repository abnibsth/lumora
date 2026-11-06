package domain

import (
	"strings"
	"time"
)

// AllowedPartnerTypes mirrors the 7 recognized partner roles on LUMORA.
var AllowedPartnerTypes = []string{
	"Distributor",
	"Supplier",
	"Retailer / Reseller",
	"Investor potensial",
	"Mentor / Konsultan",
	"Institusi / Organisasi",
	"Strategic Business Partner",
}

func ValidPartnerType(pt string) bool {
	for _, t := range AllowedPartnerTypes {
		if t == pt {
			return true
		}
	}
	return false
}

// PartnerProfile represents a partner organization's public identity, capabilities,
// and contact consent. It does NOT contain search preferences.
type PartnerProfile struct {
	ID                    string    `json:"id"`
	UserID                string    `json:"userId"`
	CompanyName           string    `json:"companyName"`
	PartnerType           string    `json:"partnerType"`
	Logo                  string    `json:"logo"`
	Location              string    `json:"location"`
	OperationalCoverage   string    `json:"operationalCoverage"`
	Description           string    `json:"description"`
	OfferedCollaborations []string  `json:"offeredCollaborations"`
	ContactEmail          string    `json:"contactEmail"`
	ContactPhone          string    `json:"contactPhone"`
	ContactSocial         string    `json:"contactSocial"`
	ShareContact          bool      `json:"shareContact"`
	Completeness          int       `json:"completeness"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// PublicView applies contact privacy rules based on shareContact.
func (p *PartnerProfile) PublicView() PartnerProfile {
	copy := *p
	if !p.ShareContact {
		copy.ContactEmail = ""
		copy.ContactPhone = ""
	}
	return copy
}

// CalculateCompleteness evaluates how thoroughly the partner profile is filled.
func (p *PartnerProfile) CalculateCompleteness() int {
	checks := []bool{
		strings.TrimSpace(p.CompanyName) != "",
		strings.TrimSpace(p.PartnerType) != "",
		strings.TrimSpace(p.Location) != "",
		strings.TrimSpace(p.OperationalCoverage) != "",
		len(p.OfferedCollaborations) > 0,
		strings.TrimSpace(p.Description) != "",
		strings.TrimSpace(p.ContactEmail) != "" || strings.TrimSpace(p.ContactPhone) != "",
		strings.TrimSpace(p.ContactSocial) != "",
	}

	filled := 0
	for _, check := range checks {
		if check {
			filled++
		}
	}

	return int((float64(filled) / float64(len(checks))) * 100)
}

// PartnerPreferences represents a partner's private search criteria and matching parameters.
type PartnerPreferences struct {
	ID                    string    `json:"id"`
	UserID                string    `json:"userId"`
	PartnerProfileID      string    `json:"partnerProfileId"`
	TargetCategories      []string  `json:"targetCategories"`
	SearchRegion          string    `json:"searchRegion"`
	StrictRegionMatch     bool      `json:"strictRegionMatch"`
	SeekingCollaborations []string  `json:"seekingCollaborations"`
	SpecificNeeds         string    `json:"specificNeeds"`
	QualificationCriteria string    `json:"qualificationCriteria"`
	HasPreferences        bool      `json:"hasPreferences"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// CheckHasPreferences determines if meaningful preference criteria have been configured.
func (pref *PartnerPreferences) CheckHasPreferences() bool {
	return len(pref.TargetCategories) > 0 ||
		len(pref.SeekingCollaborations) > 0 ||
		strings.TrimSpace(pref.SearchRegion) != "" ||
		strings.TrimSpace(pref.SpecificNeeds) != "" ||
		strings.TrimSpace(pref.QualificationCriteria) != ""
}

// UpsertPartnerProfileInput carries editable identity & offering fields.
type UpsertPartnerProfileInput struct {
	CompanyName           string   `json:"companyName"`
	PartnerType           string   `json:"partnerType"`
	Logo                  string   `json:"logo"`
	Location              string   `json:"location"`
	OperationalCoverage   string   `json:"operationalCoverage"`
	Description           string   `json:"description"`
	OfferedCollaborations []string `json:"offeredCollaborations"`
	ContactEmail          string   `json:"contactEmail"`
	ContactPhone          string   `json:"contactPhone"`
	ContactSocial         string   `json:"contactSocial"`
	ShareContact          bool     `json:"shareContact"`
}

func (in *UpsertPartnerProfileInput) Sanitize() {
	in.CompanyName = strings.TrimSpace(in.CompanyName)
	in.PartnerType = strings.TrimSpace(in.PartnerType)
	if in.PartnerType == "" || !ValidPartnerType(in.PartnerType) {
		in.PartnerType = "Strategic Business Partner"
	}
	in.Logo = strings.TrimSpace(in.Logo)
	in.Location = strings.TrimSpace(in.Location)
	in.OperationalCoverage = strings.TrimSpace(in.OperationalCoverage)
	in.Description = strings.TrimSpace(in.Description)
	in.ContactEmail = strings.TrimSpace(in.ContactEmail)
	in.ContactPhone = strings.TrimSpace(in.ContactPhone)
	in.ContactSocial = strings.TrimSpace(in.ContactSocial)
	in.OfferedCollaborations = NormalizeTaxonomySlice(in.OfferedCollaborations)
}

func (in *UpsertPartnerProfileInput) Validate() error {
	in.Sanitize()
	if len(in.CompanyName) > 150 {
		return invalid("Nama organisasi/perusahaan maksimal 150 karakter.")
	}
	if len(in.Location) > 100 {
		return invalid("Lokasi maksimal 100 karakter.")
	}
	if len(in.OperationalCoverage) > 100 {
		return invalid("Jangkauan operasional maksimal 100 karakter.")
	}
	if len(in.Description) > 3000 {
		return invalid("Deskripsi profil maksimal 3000 karakter.")
	}
	if len(in.ContactEmail) > 120 {
		return invalid("Email kontak maksimal 120 karakter.")
	}
	if len(in.ContactPhone) > 30 {
		return invalid("Nomor kontak maksimal 30 karakter.")
	}
	if len(in.ContactSocial) > 200 {
		return invalid("Media sosial atau tautan kontak maksimal 200 karakter.")
	}
	return nil
}

// UpsertPartnerPreferencesInput carries private matching criteria fields.
type UpsertPartnerPreferencesInput struct {
	TargetCategories      []string `json:"targetCategories"`
	SearchRegion          string   `json:"searchRegion"`
	StrictRegionMatch     bool     `json:"strictRegionMatch"`
	SeekingCollaborations []string `json:"seekingCollaborations"`
	SpecificNeeds         string   `json:"specificNeeds"`
	QualificationCriteria string   `json:"qualificationCriteria"`
}

func (in *UpsertPartnerPreferencesInput) Sanitize() {
	in.SearchRegion = strings.TrimSpace(in.SearchRegion)
	in.SpecificNeeds = strings.TrimSpace(in.SpecificNeeds)
	in.QualificationCriteria = strings.TrimSpace(in.QualificationCriteria)

	filteredCats := make([]string, 0, len(in.TargetCategories))
	for _, cat := range in.TargetCategories {
		c := strings.TrimSpace(cat)
		if ValidCategory(c) {
			filteredCats = append(filteredCats, c)
		}
	}
	in.TargetCategories = filteredCats
	in.SeekingCollaborations = NormalizeTaxonomySlice(in.SeekingCollaborations)
}

func (in *UpsertPartnerPreferencesInput) Validate() error {
	in.Sanitize()
	if len(in.SearchRegion) > 100 {
		return invalid("Wilayah pencarian maksimal 100 karakter.")
	}
	if len(in.SpecificNeeds) > 2000 {
		return invalid("Kebutuhan kemitraan spesifik maksimal 2000 karakter.")
	}
	if len(in.QualificationCriteria) > 2000 {
		return invalid("Kriteria kualifikasi bisnis maksimal 2000 karakter.")
	}
	return nil
}

// MatchReason explains a component of why a business matched the partner's criteria.
type MatchReason struct {
	Type   string `json:"type"` // "SECTOR", "TAXONOMY", "REGION", "DATA", "VERIFIED"
	Label  string `json:"label"`
	Detail string `json:"detail"`
}

// BusinessMatch is a business paired with its calculated match score and explainability reasons.
type BusinessMatch struct {
	Business   Business      `json:"business"`
	MatchScore int           `json:"matchScore"` // 0 - 100
	Reasons    []MatchReason `json:"reasons"`
}

// BusinessMatchList is a paginated list of business matches.
type BusinessMatchList struct {
	Items          []BusinessMatch `json:"items"`
	Total          int64           `json:"total"`
	Page           int             `json:"page"`
	Limit          int             `json:"limit"`
	HasPreferences bool            `json:"hasPreferences"`
}
