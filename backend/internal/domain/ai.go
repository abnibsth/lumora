package domain

import (
	"errors"
	"strings"
	"unicode/utf8"
)

// ErrAIUnavailable means the draft generator could not produce a usable
// result: a provider outage, a timeout, or a response we could not trust.
// It is deliberately coarse so the HTTP layer maps one retryable code.
var ErrAIUnavailable = errors.New("ai unavailable")

const (
	// MinNarrativeLength rejects input too short to categorize or summarize.
	MinNarrativeLength = 20
	// MaxNarrativeLength caps the narrative before it reaches a provider, so a
	// single request cannot run up an unbounded token bill.
	MaxNarrativeLength = 5000
	// MaxSuggestions caps the advice list returned next to the draft.
	MaxSuggestions = 20
)

// DraftProfileInput is the POST /api/v1/ai/draft-profile body. The narrative is
// untrusted free text: whatever comes back is sanitized before it is served.
type DraftProfileInput struct {
	Narrative string `json:"narrative"`
}

// Validate normalizes and checks the narrative.
func (p *DraftProfileInput) Validate() error {
	p.Narrative = strings.TrimSpace(p.Narrative)

	if p.Narrative == "" {
		return invalid("Narasi wajib diisi.")
	}
	if len(p.Narrative) < MinNarrativeLength {
		return invalid("Narasi minimal 20 karakter.")
	}
	if len(p.Narrative) > MaxNarrativeLength {
		return invalid("Narasi maksimal 5000 karakter.")
	}
	return nil
}

// DraftProfile is a generated draft that the frontend prefills the create form
// with. It carries no financial fields on purpose: the contract forbids the
// model from inventing revenue figures, and leaving the fields out of the type
// makes that structural instead of a rule someone has to remember.
//
// Slice fields are never nil once Sanitize has run, so the frontend can map
// over them without a null check.
type DraftProfile struct {
	Name             string      `json:"name"`
	Category         string      `json:"category"`
	Location         string      `json:"location"`
	Description      string      `json:"description"`
	Story            string      `json:"story"`
	FoundedYear      int         `json:"foundedYear"`
	Owner            Owner       `json:"owner"`
	Milestones       []Milestone `json:"milestones"`
	BMC              []BmcEntry  `json:"bmc"`
	Seeking          []string    `json:"seeking"`
	SeekingObjective string      `json:"seekingObjective"`
	Suggestions      []string    `json:"suggestions"`
}

// Sanitize clamps a generated draft to the limits the write endpoints enforce,
// so a bad generation can never hand the frontend a payload the form is unable
// to submit. It is best-effort: out-of-range values are dropped or blanked,
// never reported. Applying it twice changes nothing.
func (d *DraftProfile) Sanitize() {
	d.Name = clamp(d.Name, MaxNameLength)
	d.Location = clamp(d.Location, MaxLocationLength)
	d.Description = clamp(d.Description, MaxDescriptionLength)
	d.Story = clamp(d.Story, MaxStoryLength)
	d.SeekingObjective = clamp(d.SeekingObjective, MaxObjectiveLength)
	d.Owner.Name = clamp(d.Owner.Name, MaxNameLength)
	d.Owner.Role = clamp(d.Owner.Role, MaxLabelLength)
	d.Owner.Bio = clamp(d.Owner.Bio, MaxOwnerBioLength)

	// A category outside the enum is worse than no category: the frontend can
	// prompt for a missing one but cannot guess what an invented one meant.
	if !ValidCategory(d.Category) {
		d.Category = ""
	}
	// 0 is the "unknown, ask the user" value the form already understands.
	if d.FoundedYear < MinFoundedYear || d.FoundedYear > MaxFoundedYear {
		d.FoundedYear = 0
	}

	d.Milestones = sanitizeMilestones(d.Milestones)
	d.BMC = sanitizeBmc(d.BMC)
	d.Seeking = sanitizeSeeking(d.Seeking)
	d.Suggestions = sanitizeSuggestions(d.Suggestions)
}

func sanitizeMilestones(items []Milestone) []Milestone {
	clean := make([]Milestone, 0, len(items))
	for _, item := range items {
		title := clamp(item.Title, MaxMilestoneTitle)
		if title == "" {
			continue
		}
		if item.Year < MinFoundedYear || item.Year > MaxFoundedYear {
			continue
		}
		clean = append(clean, Milestone{
			Year:        item.Year,
			Title:       title,
			Description: clamp(item.Description, MaxMilestoneDesc),
		})
		if len(clean) == MaxMilestones {
			break
		}
	}
	return clean
}

func sanitizeBmc(items []BmcEntry) []BmcEntry {
	clean := make([]BmcEntry, 0, len(items))
	for _, item := range items {
		label := clamp(item.Label, MaxLabelLength)
		value := clamp(item.Value, MaxBmcValueLength)
		if label == "" || value == "" {
			continue
		}
		clean = append(clean, BmcEntry{Label: label, Value: value})
		if len(clean) == MaxBmcEntries {
			break
		}
	}
	return clean
}

func sanitizeSeeking(items []string) []string {
	clean := make([]string, 0, len(items))
	for _, item := range items {
		value := clamp(item, MaxLabelLength)
		if value == "" {
			continue
		}
		clean = append(clean, value)
		if len(clean) == MaxSeekingItems {
			break
		}
	}
	return clean
}

func sanitizeSuggestions(items []string) []string {
	clean := make([]string, 0, len(items))
	for _, item := range items {
		value := clamp(item, MaxMilestoneDesc)
		if value == "" {
			continue
		}
		clean = append(clean, value)
		if len(clean) == MaxSuggestions {
			break
		}
	}
	return clean
}

// clamp trims and cuts a value down to max bytes without splitting a rune, so
// truncated text is still valid UTF-8.
func clamp(value string, max int) string {
	value = strings.TrimSpace(value)
	if len(value) <= max {
		return value
	}
	cut := value[:max]
	for len(cut) > 0 && !utf8.ValidString(cut) {
		cut = cut[:len(cut)-1]
	}
	return strings.TrimSpace(cut)
}
