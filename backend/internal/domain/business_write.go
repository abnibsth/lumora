package domain

import (
	"fmt"
	"strings"
)

// Caps for profile payloads: generous enough for every value the frontend
// form can produce, tight enough to keep a single row sane.
const (
	MaxNameLength        = 100
	MaxLocationLength    = 200
	MaxDescriptionLength = 5000
	MaxStoryLength       = 5000
	MaxLabelLength       = 100
	MaxObjectiveLength   = 500
	MaxURLLength         = 2048
	MaxOwnerBioLength    = 1000
	MaxMilestoneTitle    = 150
	MaxMilestoneDesc     = 500
	MaxBmcValueLength    = 1000
	MinFoundedYear       = 1900
	MaxFoundedYear       = 2100
	MaxMilestones        = 50
	MaxBmcEntries        = 30
	MaxRevenuePoints     = 100
	MaxSeekingItems      = 10
)

// CreateBusinessInput is the POST /businesses body. Optional fields left out
// of the JSON are stored as NULL or '{}'.
type CreateBusinessInput struct {
	Name             string      `json:"name"`
	Category         string      `json:"category"`
	Location         string      `json:"location"`
	Description      string      `json:"description"`
	Story            string      `json:"story"`
	CoverImage       *string     `json:"coverImage"`
	CoverPosition    *string     `json:"coverPosition"`
	Logo             *string     `json:"logo"`
	FoundedYear      int         `json:"foundedYear"`
	RevenueLabel     *string     `json:"revenueLabel"`
	GrowthLabel      *string     `json:"growthLabel"`
	RevenueSeries    []float64   `json:"revenueSeries"`
	Seeking          []string    `json:"seeking"`
	SeekingObjective *string     `json:"seekingObjective"`
	Owner            Owner       `json:"owner"`
	Milestones       []Milestone `json:"milestones"`
	BMC              []BmcEntry  `json:"bmc"`
}

// UpdateBusinessInput is the PATCH /businesses/:id body. Every field is
// optional and nil means "leave it alone". An optional text field sent as ""
// clears it; required text fields sent as "" fail validation. There is no
// distinction between an absent field and an explicit null.
type UpdateBusinessInput struct {
	Name             *string      `json:"name"`
	Category         *string      `json:"category"`
	Location         *string      `json:"location"`
	Description      *string      `json:"description"`
	Story            *string      `json:"story"`
	CoverImage       *string      `json:"coverImage"`
	CoverPosition    *string      `json:"coverPosition"`
	Logo             *string      `json:"logo"`
	FoundedYear      *int         `json:"foundedYear"`
	RevenueLabel     *string      `json:"revenueLabel"`
	GrowthLabel      *string      `json:"growthLabel"`
	RevenueSeries    *[]float64   `json:"revenueSeries"`
	Seeking          *[]string    `json:"seeking"`
	SeekingObjective *string      `json:"seekingObjective"`
	Owner            *Owner       `json:"owner"`
	Milestones       *[]Milestone `json:"milestones"`
	BMC              *[]BmcEntry  `json:"bmc"`
}

// Validate normalizes and checks the create payload in place.
func (p *CreateBusinessInput) Validate() error {
	trim(&p.Name, &p.Location, &p.Description, &p.Story)
	trimOwner(&p.Owner)
	trimOptional(&p.CoverImage, &p.CoverPosition, &p.Logo, &p.RevenueLabel, &p.GrowthLabel, &p.SeekingObjective)
	trimMilestones(p.Milestones)
	trimBmc(p.BMC)
	trimSeeking(p.Seeking)

	if err := validateProfileText(p.Name, p.Category, p.Location, p.Description, p.Story, p.Owner); err != nil {
		return err
	}
	if err := validateFoundedYear(p.FoundedYear); err != nil {
		return err
	}
	if err := validateMilestones(p.Milestones); err != nil {
		return err
	}
	if err := validateBmc(p.BMC); err != nil {
		return err
	}
	if err := validateRevenueSeries(p.RevenueSeries); err != nil {
		return err
	}
	return validateSeeking(p.Seeking)
}

// Validate normalizes and checks whichever fields the patch actually sent.
func (p *UpdateBusinessInput) Validate() error {
	if p.Name != nil {
		trim(p.Name)
		if err := requiredText("Nama bisnis", *p.Name, MaxNameLength); err != nil {
			return err
		}
	}
	if p.Category != nil {
		trim(p.Category)
		if !ValidCategory(*p.Category) {
			return ErrInvalidCategory
		}
	}
	if p.Location != nil {
		trim(p.Location)
		if err := requiredText("Lokasi", *p.Location, MaxLocationLength); err != nil {
			return err
		}
	}
	if p.Description != nil {
		trim(p.Description)
		if err := requiredText("Deskripsi", *p.Description, MaxDescriptionLength); err != nil {
			return err
		}
	}
	if p.Story != nil {
		trim(p.Story)
		if err := requiredText("Cerita", *p.Story, MaxStoryLength); err != nil {
			return err
		}
	}
	if p.CoverImage != nil {
		trimOptional(&p.CoverImage)
		if err := maxText("URL cover", deref(p.CoverImage), MaxURLLength); err != nil {
			return err
		}
	}
	if p.CoverPosition != nil {
		trimOptional(&p.CoverPosition)
	}
	if p.Logo != nil {
		trimOptional(&p.Logo)
		if err := maxText("URL logo", deref(p.Logo), MaxURLLength); err != nil {
			return err
		}
	}
	if p.RevenueLabel != nil {
		trimOptional(&p.RevenueLabel)
		if err := maxText("Label pendapatan", deref(p.RevenueLabel), MaxLabelLength); err != nil {
			return err
		}
	}
	if p.GrowthLabel != nil {
		trimOptional(&p.GrowthLabel)
		if err := maxText("Label pertumbuhan", deref(p.GrowthLabel), MaxLabelLength); err != nil {
			return err
		}
	}
	if p.SeekingObjective != nil {
		trimOptional(&p.SeekingObjective)
		if err := maxText("Tujuan pencarian pendanaan", deref(p.SeekingObjective), MaxObjectiveLength); err != nil {
			return err
		}
	}
	if p.FoundedYear != nil {
		if err := validateFoundedYear(*p.FoundedYear); err != nil {
			return err
		}
	}
	if p.Owner != nil {
		trimOwner(p.Owner)
		if err := validateOwner(*p.Owner); err != nil {
			return err
		}
	}
	if p.Milestones != nil {
		trimMilestones(*p.Milestones)
		if err := validateMilestones(*p.Milestones); err != nil {
			return err
		}
	}
	if p.BMC != nil {
		trimBmc(*p.BMC)
		if err := validateBmc(*p.BMC); err != nil {
			return err
		}
	}
	if p.RevenueSeries != nil {
		if err := validateRevenueSeries(*p.RevenueSeries); err != nil {
			return err
		}
	}
	if p.Seeking != nil {
		trimSeeking(*p.Seeking)
		if err := validateSeeking(*p.Seeking); err != nil {
			return err
		}
	}
	return nil
}

// ValidatePublishable checks a stored profile is complete enough to go live.
// Drafts are saved with whatever the form had so far; publishing is where the
// required fields are enforced for the whole row at once.
func ValidatePublishable(b Business) error {
	if err := validateProfileText(b.Name, b.Category, b.Location, b.Description, b.Story, b.Owner); err != nil {
		return err
	}
	return validateFoundedYear(int(b.FoundedYear))
}

// OwnedBusiness is a profile plus the fields only meaningful to whoever can
// edit it, returned by the write endpoints. Public endpoints never send this.
type OwnedBusiness struct {
	Business
	Status string `json:"status"`
}

func validateProfileText(name, category, location, description, story string, owner Owner) error {
	if err := requiredText("Nama bisnis", name, MaxNameLength); err != nil {
		return err
	}
	if !ValidCategory(category) {
		return ErrInvalidCategory
	}
	if err := requiredText("Lokasi", location, MaxLocationLength); err != nil {
		return err
	}
	if err := requiredText("Deskripsi", description, MaxDescriptionLength); err != nil {
		return err
	}
	if err := requiredText("Cerita", story, MaxStoryLength); err != nil {
		return err
	}
	return validateOwner(owner)
}

func validateOwner(owner Owner) error {
	if err := requiredText("Nama pemilik", owner.Name, MaxNameLength); err != nil {
		return err
	}
	if err := requiredText("Peran pemilik", owner.Role, MaxLabelLength); err != nil {
		return err
	}
	return requiredText("Bio pemilik", owner.Bio, MaxOwnerBioLength)
}

func validateFoundedYear(year int) error {
	if year == 0 {
		return invalid("Tahun berdiri wajib diisi.")
	}
	if year < MinFoundedYear || year > MaxFoundedYear {
		return invalid(fmt.Sprintf("Tahun berdiri harus antara %d dan %d.", MinFoundedYear, MaxFoundedYear))
	}
	return nil
}

func validateMilestones(items []Milestone) error {
	if len(items) > MaxMilestones {
		return invalid(fmt.Sprintf("Milestones maksimal %d item.", MaxMilestones))
	}
	for i, item := range items {
		if item.Year < MinFoundedYear || item.Year > MaxFoundedYear {
			return invalid(fmt.Sprintf("Tahun milestone ke-%d harus antara %d dan %d.", i+1, MinFoundedYear, MaxFoundedYear))
		}
		if err := requiredText("Judul milestone", item.Title, MaxMilestoneTitle); err != nil {
			return err
		}
		if err := maxText("Deskripsi milestone", item.Description, MaxMilestoneDesc); err != nil {
			return err
		}
	}
	return nil
}

func validateBmc(items []BmcEntry) error {
	if len(items) > MaxBmcEntries {
		return invalid(fmt.Sprintf("BMC maksimal %d blok.", MaxBmcEntries))
	}
	for _, item := range items {
		if err := requiredText("Label BMC", item.Label, MaxLabelLength); err != nil {
			return err
		}
		if err := requiredText("Nilai BMC", item.Value, MaxBmcValueLength); err != nil {
			return err
		}
	}
	return nil
}

func validateRevenueSeries(series []float64) error {
	if len(series) > MaxRevenuePoints {
		return invalid(fmt.Sprintf("Grafik pendapatan maksimal %d titik.", MaxRevenuePoints))
	}
	for i, point := range series {
		if point < 0 {
			return invalid(fmt.Sprintf("Titik grafik ke-%d tidak boleh negatif.", i+1))
		}
	}
	return nil
}

func validateSeeking(items []string) error {
	if len(items) > MaxSeekingItems {
		return invalid(fmt.Sprintf("Opsi pendanaan maksimal %d item.", MaxSeekingItems))
	}
	for _, item := range items {
		if err := requiredText("Opsi pendanaan", item, MaxLabelLength); err != nil {
			return err
		}
	}
	return nil
}

func requiredText(label, value string, max int) error {
	if value == "" {
		return invalid(label + " wajib diisi.")
	}
	return maxText(label, value, max)
}

func maxText(label, value string, max int) error {
	if len(value) > max {
		return invalid(fmt.Sprintf("%s maksimal %d karakter.", label, max))
	}
	return nil
}

func trim(fields ...*string) {
	for _, field := range fields {
		*field = strings.TrimSpace(*field)
	}
}

func deref(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

// trimOptional trims a pointer field and drops the empty result so the
// service stores NULL instead of "".
func trimOptional(fields ...**string) {
	for _, field := range fields {
		if *field == nil {
			continue
		}
		value := strings.TrimSpace(**field)
		if value == "" {
			*field = nil
		} else {
			*field = &value
		}
	}
}

func trimOwner(owner *Owner) {
	trim(&owner.Name, &owner.Role, &owner.Bio)
}

func trimMilestones(items []Milestone) {
	for i := range items {
		items[i].Title = strings.TrimSpace(items[i].Title)
		items[i].Description = strings.TrimSpace(items[i].Description)
	}
}

func trimBmc(items []BmcEntry) {
	for i := range items {
		items[i].Label = strings.TrimSpace(items[i].Label)
		items[i].Value = strings.TrimSpace(items[i].Value)
	}
}

func trimSeeking(items []string) {
	for i := range items {
		items[i] = strings.TrimSpace(items[i])
	}
}
