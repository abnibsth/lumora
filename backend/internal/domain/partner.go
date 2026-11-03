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

// PartnerProfile represents a partner organization's identity, preferences,
// and contact consent.
type PartnerProfile struct {
	ID                   string    `json:"id"`
	UserID               string    `json:"userId"`
	CompanyName          string    `json:"companyName"`
	PartnerType          string    `json:"partnerType"`
	Location             string    `json:"location"`
	OperationalCoverage  string    `json:"operationalCoverage"`
	InterestedCategories []string  `json:"interestedCategories"`
	PartnershipTypes     []string  `json:"partnershipTypes"`
	CollaborationTypes   []string  `json:"collaborationTypes"`
	Description          string    `json:"description"`
	PartnershipNeeds     string    `json:"partnershipNeeds"`
	SearchRegion         string    `json:"searchRegion"`
	BusinessCriteria     string    `json:"businessCriteria"`
	ContactEmail         string    `json:"contactEmail"`
	ContactPhone         string    `json:"contactPhone"`
	ContactSocial        string    `json:"contactSocial"`
	ShareContact         bool      `json:"shareContact"`
	Completeness         int       `json:"completeness"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

// CalculateCompleteness evaluates how thoroughly the partner profile is filled.
func (p *PartnerProfile) CalculateCompleteness() int {
	checks := []bool{
		strings.TrimSpace(p.CompanyName) != "",
		strings.TrimSpace(p.PartnerType) != "",
		strings.TrimSpace(p.Location) != "",
		strings.TrimSpace(p.OperationalCoverage) != "",
		len(p.InterestedCategories) > 0,
		len(p.CollaborationTypes) > 0 || len(p.PartnershipTypes) > 0,
		strings.TrimSpace(p.Description) != "",
		strings.TrimSpace(p.PartnershipNeeds) != "" || strings.TrimSpace(p.BusinessCriteria) != "",
		strings.TrimSpace(p.ContactEmail) != "" || strings.TrimSpace(p.ContactPhone) != "",
	}

	filled := 0
	for _, check := range checks {
		if check {
			filled++
		}
	}

	return int((float64(filled) / float64(len(checks))) * 100)
}

// UpsertPartnerProfileInput carries editable profile & preference fields.
type UpsertPartnerProfileInput struct {
	CompanyName          string   `json:"companyName"`
	PartnerType          string   `json:"partnerType"`
	Location             string   `json:"location"`
	OperationalCoverage  string   `json:"operationalCoverage"`
	InterestedCategories []string `json:"interestedCategories"`
	PartnershipTypes     []string `json:"partnershipTypes"`
	CollaborationTypes   []string `json:"collaborationTypes"`
	Description          string   `json:"description"`
	PartnershipNeeds     string   `json:"partnershipNeeds"`
	SearchRegion         string   `json:"searchRegion"`
	BusinessCriteria     string   `json:"businessCriteria"`
	ContactEmail         string   `json:"contactEmail"`
	ContactPhone         string   `json:"contactPhone"`
	ContactSocial        string   `json:"contactSocial"`
	ShareContact         bool     `json:"shareContact"`
}

func (in *UpsertPartnerProfileInput) Sanitize() {
	in.CompanyName = strings.TrimSpace(in.CompanyName)
	in.PartnerType = strings.TrimSpace(in.PartnerType)
	if in.PartnerType == "" || !ValidPartnerType(in.PartnerType) {
		in.PartnerType = "Strategic Business Partner"
	}
	in.Location = strings.TrimSpace(in.Location)
	in.OperationalCoverage = strings.TrimSpace(in.OperationalCoverage)
	in.Description = strings.TrimSpace(in.Description)
	in.PartnershipNeeds = strings.TrimSpace(in.PartnershipNeeds)
	in.SearchRegion = strings.TrimSpace(in.SearchRegion)
	in.BusinessCriteria = strings.TrimSpace(in.BusinessCriteria)
	in.ContactEmail = strings.TrimSpace(in.ContactEmail)
	in.ContactPhone = strings.TrimSpace(in.ContactPhone)
	in.ContactSocial = strings.TrimSpace(in.ContactSocial)

	// Filter categories to valid ones only
	filteredCats := make([]string, 0, len(in.InterestedCategories))
	for _, cat := range in.InterestedCategories {
		c := strings.TrimSpace(cat)
		if ValidCategory(c) {
			filteredCats = append(filteredCats, c)
		}
	}
	in.InterestedCategories = filteredCats

	// Clean partnership types
	filteredPartnershipTypes := make([]string, 0, len(in.PartnershipTypes))
	for _, pt := range in.PartnershipTypes {
		t := strings.TrimSpace(pt)
		if t != "" {
			filteredPartnershipTypes = append(filteredPartnershipTypes, t)
		}
	}
	in.PartnershipTypes = filteredPartnershipTypes

	// Clean collaboration types
	filteredTypes := make([]string, 0, len(in.CollaborationTypes))
	for _, ct := range in.CollaborationTypes {
		t := strings.TrimSpace(ct)
		if t != "" {
			filteredTypes = append(filteredTypes, t)
		}
	}
	in.CollaborationTypes = filteredTypes
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
	if len(in.PartnershipNeeds) > 2000 {
		return invalid("Kebutuhan kemitraan maksimal 2000 karakter.")
	}
	if len(in.BusinessCriteria) > 2000 {
		return invalid("Kriteria bisnis maksimal 2000 karakter.")
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
