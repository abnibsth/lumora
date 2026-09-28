package domain

import "errors"

var (
	// ErrNotFound means no published business owns the requested slug.
	ErrNotFound = errors.New("business not found")
	// ErrInvalidCategory means the caller sent a category outside BUSINESS_CATEGORIES.
	ErrInvalidCategory = errors.New("invalid category")
	// ErrInvalidParameter means a query parameter is malformed or out of range.
	ErrInvalidParameter = errors.New("invalid parameter")
	// ErrForbidden means the caller is logged in but does not own the profile.
	ErrForbidden = errors.New("forbidden")
)

// Statuses mirrors the CHECK constraint on businesses.status.
const (
	StatusDraft     = "draft"
	StatusPublished = "published"
)

// Categories mirrors BUSINESS_CATEGORIES in frontend/types/business.ts. The
// two lists are a contract: changing one means changing the other.
var Categories = []string{"F&B", "Retail", "Jasa", "Kreatif", "Fashion"}

func ValidCategory(category string) bool {
	for _, c := range Categories {
		if c == category {
			return true
		}
	}
	return false
}

// Owner mirrors BusinessOwner. Embedded as columns on businesses so the JSON
// shape matches the frontend without a join.
type Owner struct {
	Name string `json:"name"`
	Role string `json:"role"`
	Bio  string `json:"bio"`
}

// Milestone mirrors BusinessMilestone.
type Milestone struct {
	Year        int    `json:"year"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

// BmcEntry mirrors BmcEntry.
type BmcEntry struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

// Business mirrors the frontend Business interface field for field. JSON tags
// are camelCase because the frontend type is the contract; optional frontend
// fields (coverImage?, revenueSeries?, ...) are pointers with omitempty.
type Business struct {
	ID               string      `json:"id"`
	Slug             string      `json:"slug"`
	Name             string      `json:"name"`
	Category         string      `json:"category"`
	Location         string      `json:"location"`
	Description      string      `json:"description"`
	Story            string      `json:"story"`
	CoverImage       *string     `json:"coverImage,omitempty"`
	CoverPosition    *string     `json:"coverPosition,omitempty"`
	Logo             *string     `json:"logo,omitempty"`
	FoundedYear      int         `json:"foundedYear"`
	RevenueLabel     *string     `json:"revenueLabel,omitempty"`
	GrowthLabel      *string     `json:"growthLabel,omitempty"`
	RevenueSeries    []float64   `json:"revenueSeries,omitempty"`
	Seeking          []string    `json:"seeking,omitempty"`
	SeekingObjective *string     `json:"seekingObjective,omitempty"`
	Owner            Owner       `json:"owner"`
	Milestones       []Milestone `json:"milestones"`
	BMC              []BmcEntry  `json:"bmc"`
	Verified         bool        `json:"verified"`
}

// BusinessList is the paginated envelope for GET /api/v1/businesses.
type BusinessList struct {
	Items []Business `json:"items"`
	Total int64      `json:"total"`
	Page  int        `json:"page"`
	Limit int        `json:"limit"`
}

// BusinessListParams is the validated form of the list query string.
// Empty filter fields mean "no filter".
type BusinessListParams struct {
	Query    string
	Category string
	Location string
	Page     int
	Limit    int
}
