package domain

import (
	"errors"
	"reflect"
	"strings"
	"testing"
	"unicode/utf8"
)

func TestDraftProfileInputValidate(t *testing.T) {
	cases := []struct {
		name      string
		narrative string
		wantErr   bool
	}{
		{name: "empty", narrative: "", wantErr: true},
		{name: "whitespace only", narrative: "   \n  ", wantErr: true},
		{name: "too short", narrative: "warung kopi", wantErr: true},
		{name: "just at the minimum", narrative: strings.Repeat("a", MinNarrativeLength)},
		{name: "too long", narrative: strings.Repeat("a", MaxNarrativeLength+1), wantErr: true},
		{name: "just at the maximum", narrative: strings.Repeat("a", MaxNarrativeLength)},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			input := DraftProfileInput{Narrative: tc.narrative}
			err := input.Validate()

			if tc.wantErr {
				var validationErr *ValidationError
				if !errors.As(err, &validationErr) {
					t.Fatalf("err = %v (%T), want *ValidationError", err, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("Validate() = %v, want nil", err)
			}
		})
	}
}

func TestDraftProfileInputValidateTrimsNarrative(t *testing.T) {
	input := DraftProfileInput{Narrative: "  usaha kopi di Bandung yang berdiri sejak 2015  "}

	if err := input.Validate(); err != nil {
		t.Fatalf("Validate() = %v, want nil", err)
	}
	if input.Narrative != "usaha kopi di Bandung yang berdiri sejak 2015" {
		t.Errorf("Narrative = %q, want it trimmed", input.Narrative)
	}
}

func TestSanitizeBlanksCategoryOutsideEnum(t *testing.T) {
	draft := DraftProfile{Category: "Pertambangan"}

	draft.Sanitize()

	if draft.Category != "" {
		t.Errorf("Category = %q, want empty", draft.Category)
	}
}

func TestSanitizeKeepsValidCategory(t *testing.T) {
	draft := DraftProfile{Category: "F&B"}

	draft.Sanitize()

	if draft.Category != "F&B" {
		t.Errorf("Category = %q, want F&B", draft.Category)
	}
}

func TestSanitizeBlanksFoundedYearOutsideRange(t *testing.T) {
	for _, year := range []int{1800, 2200, -5} {
		draft := DraftProfile{FoundedYear: year}

		draft.Sanitize()

		if draft.FoundedYear != 0 {
			t.Errorf("FoundedYear %d sanitized to %d, want 0", year, draft.FoundedYear)
		}
	}
}

func TestSanitizeTruncatesLongTextOnRuneBoundary(t *testing.T) {
	// Three-byte runes, so a byte-wise cut would land mid-character.
	draft := DraftProfile{Name: strings.Repeat("界", 60)}

	draft.Sanitize()

	if len(draft.Name) > MaxNameLength {
		t.Fatalf("len(Name) = %d, want <= %d", len(draft.Name), MaxNameLength)
	}
	if !utf8.ValidString(draft.Name) {
		t.Errorf("Name is not valid UTF-8 after truncation")
	}
}

func TestSanitizeDropsMilestonesWithoutTitleOrYear(t *testing.T) {
	draft := DraftProfile{
		Milestones: []Milestone{
			{Year: 2020, Title: "Buka cabang pertama"},
			{Year: 2020, Title: "   "},
			{Year: 1700, Title: "Tahun di luar rentang"},
			{Year: 2021, Title: "Menambah menu baru"},
		},
	}

	draft.Sanitize()

	if len(draft.Milestones) != 2 {
		t.Fatalf("len(Milestones) = %d, want 2 (%+v)", len(draft.Milestones), draft.Milestones)
	}
	if draft.Milestones[0].Title != "Buka cabang pertama" || draft.Milestones[1].Title != "Menambah menu baru" {
		t.Errorf("Milestones = %+v, want the two valid entries in order", draft.Milestones)
	}
}

func TestSanitizeCapsMilestones(t *testing.T) {
	draft := DraftProfile{}
	for i := 0; i < MaxMilestones+5; i++ {
		draft.Milestones = append(draft.Milestones, Milestone{Year: 2020, Title: "Tonggak"})
	}

	draft.Sanitize()

	if len(draft.Milestones) != MaxMilestones {
		t.Errorf("len(Milestones) = %d, want %d", len(draft.Milestones), MaxMilestones)
	}
}

func TestSanitizeDropsIncompleteBmcEntries(t *testing.T) {
	draft := DraftProfile{
		BMC: []BmcEntry{
			{Label: "Value Proposition", Value: "Kopi single origin"},
			{Label: "  ", Value: "Tanpa label"},
			{Label: "Tanpa nilai", Value: "   "},
		},
	}

	draft.Sanitize()

	if len(draft.BMC) != 1 {
		t.Fatalf("len(BMC) = %d, want 1 (%+v)", len(draft.BMC), draft.BMC)
	}
	if draft.BMC[0].Label != "Value Proposition" {
		t.Errorf("BMC = %+v, want only the complete entry", draft.BMC)
	}
}

func TestSanitizeCapsSeekingAndDropsBlanks(t *testing.T) {
	draft := DraftProfile{Seeking: []string{"modal", "  ", "mitra"}}
	for i := 0; i < MaxSeekingItems+5; i++ {
		draft.Seeking = append(draft.Seeking, "investor")
	}

	draft.Sanitize()

	if len(draft.Seeking) != MaxSeekingItems {
		t.Errorf("len(Seeking) = %d, want %d", len(draft.Seeking), MaxSeekingItems)
	}
	for _, item := range draft.Seeking {
		if strings.TrimSpace(item) == "" {
			t.Errorf("Seeking contains a blank entry: %q", item)
		}
	}
}

func TestSanitizeCapsSuggestions(t *testing.T) {
	draft := DraftProfile{}
	for i := 0; i < MaxSuggestions+3; i++ {
		draft.Suggestions = append(draft.Suggestions, "Lengkapi data")
	}

	draft.Sanitize()

	if len(draft.Suggestions) != MaxSuggestions {
		t.Errorf("len(Suggestions) = %d, want %d", len(draft.Suggestions), MaxSuggestions)
	}
}

func TestSanitizeTurnsNilSlicesIntoEmptyOnes(t *testing.T) {
	var draft DraftProfile

	draft.Sanitize()

	if draft.Milestones == nil {
		t.Error("Milestones is nil, want an empty slice so JSON renders []")
	}
	if draft.BMC == nil {
		t.Error("BMC is nil, want an empty slice so JSON renders []")
	}
	if draft.Seeking == nil {
		t.Error("Seeking is nil, want an empty slice so JSON renders []")
	}
	if draft.Suggestions == nil {
		t.Error("Suggestions is nil, want an empty slice so JSON renders []")
	}
}

func TestSanitizeIsIdempotent(t *testing.T) {
	draft := DraftProfile{
		Name:        strings.Repeat("界", 60),
		Category:    "Pertambangan",
		Location:    "  Bandung  ",
		FoundedYear: 1500,
		Owner:       Owner{Name: "Budi", Role: "Pendiri", Bio: "Bio singkat"},
		Milestones: []Milestone{
			{Year: 2020, Title: "Mulai"},
			{Year: 1700, Title: "Tidak valid"},
		},
		BMC:         []BmcEntry{{Label: "Value", Value: "Kopi"}},
		Seeking:     []string{"modal", ""},
		Suggestions: []string{"Lengkapi tahun berdiri", "  "},
	}

	draft.Sanitize()
	once := draft

	draft.Sanitize()

	if !reflect.DeepEqual(once, draft) {
		t.Errorf("second Sanitize changed the draft:\nfirst  = %+v\nsecond = %+v", once, draft)
	}
}
