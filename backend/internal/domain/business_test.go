package domain

import (
	"encoding/json"
	"strings"
	"testing"
)

// The frontend interface in frontend/types/business.ts is the wire contract.
// These tests fail if a JSON tag drifts away from it.
func TestBusinessJSONMatchesFrontendContract(t *testing.T) {
	cover := "/img/benner.png"
	business := Business{
		ID:            "6cceac2f-7a80-4f9e-98ba-391d61be10fc",
		Slug:          "kopi-ruang-senja",
		Name:          "Kopi Ruang Senja",
		Category:      "F&B",
		Location:      "Bandung",
		Description:   "deskripsi",
		Story:         "cerita",
		CoverImage:    &cover,
		FoundedYear:   2023,
		RevenueSeries: []float64{12.1, 13.4},
		Seeking:       []string{"Mitra Ekspansi"},
		Owner:         Owner{Name: "Raka Pradana", Role: "Pendiri", Bio: "bio"},
		Milestones:    []Milestone{{Year: 2023, Title: "Mulai", Description: "deskripsi"}},
		BMC:           []BmcEntry{{Label: "Proposisi Nilai", Value: "value"}},
		Verified:      false,
	}

	raw, err := json.Marshal(business)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	required := []string{
		"id", "slug", "name", "category", "location", "description", "story",
		"coverImage", "foundedYear", "revenueSeries", "seeking",
		"owner", "milestones", "bmc", "verified",
	}
	for _, key := range required {
		if _, ok := payload[key]; !ok {
			t.Errorf("missing required key %q in %s", key, raw)
		}
	}

	for key := range payload {
		if strings.Contains(key, "_") {
			t.Errorf("key %q is snake_case; the frontend contract is camelCase", key)
		}
	}

	owner, ok := payload["owner"].(map[string]any)
	if !ok {
		t.Fatalf("owner is not an object: %s", raw)
	}
	for _, key := range []string{"name", "role", "bio"} {
		if _, ok := owner[key]; !ok {
			t.Errorf("owner missing %q", key)
		}
	}

	if payload["foundedYear"].(float64) != 2023 {
		t.Errorf("foundedYear = %v, want 2023", payload["foundedYear"])
	}
}

func TestOptionalFieldsAreOmitted(t *testing.T) {
	raw, err := json.Marshal(Business{ID: "x", Slug: "x", Name: "x"})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	for _, key := range []string{"coverImage", "coverPosition", "logo", "revenueLabel", "growthLabel", "revenueSeries", "seeking", "seekingObjective"} {
		if _, ok := payload[key]; ok {
			t.Errorf("optional key %q must be omitted when empty, got %s", key, raw)
		}
	}
	if _, ok := payload["milestones"]; !ok {
		t.Error("milestones must always be present (frontend type has no ?)")
	}
	if _, ok := payload["bmc"]; !ok {
		t.Error("bmc must always be present (frontend type has no ?)")
	}
}
