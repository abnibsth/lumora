// Package ai holds draft-profile generators. Stub is the offline stand-in used
// until a provider is chosen; a real provider is just another type that
// satisfies service.Drafter, wired in cmd/api/main.go.
package ai

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"github.com/alfian/lumora/backend/internal/domain"
)

// Stub extracts what it can from the narrative with plain rules and leaves the
// rest blank for the user to fill. It never invents numbers, and it never makes
// a network call, so the endpoint and its tests work without a provider or an
// API key.
type Stub struct{}

func NewStub() *Stub { return &Stub{} }

// Draft implements the drafter the AI service depends on.
func (s *Stub) Draft(ctx context.Context, in domain.DraftProfileInput) (domain.DraftProfile, error) {
	if err := ctx.Err(); err != nil {
		return domain.DraftProfile{}, err
	}

	narrative := strings.TrimSpace(in.Narrative)
	description, story := splitNarrative(narrative)

	draft := domain.DraftProfile{
		Category:    guessCategory(narrative),
		Location:    guessLocation(narrative),
		FoundedYear: guessYear(narrative),
		Description: description,
		Story:       story,
		Seeking:     guessSeeking(narrative),
	}
	draft.Suggestions = suggestionsFor(draft)

	return draft, nil
}

// categoryKeywords is ordered and first match wins, so the result never depends
// on map iteration order. Mirrors domain.Categories.
var categoryKeywords = []struct {
	category string
	keywords []string
}{
	{"F&B", []string{
		"kopi", "kafe", "cafe", "kedai", "warung", "resto", "restoran", "rumah makan",
		"kuliner", "makanan", "minuman", "kue", "bakery", "roti", "katering", "catering",
		"dapur", "kantin", "sambal", "ayam", "nasi", "teh", "jus",
	}},
	{"Fashion", []string{
		"fashion", "busana", "baju", "pakaian", "hijab", "kain", "butik", "sepatu", "tas",
		"konveksi", "garmen", "tenun", "batik", "penjahit", "tailor",
	}},
	{"Kreatif", []string{
		"kreatif", "desain", "design", "kriya", "kerajinan", "serat", "seni", "musik", "video",
		"foto", "ilustrasi", "animasi", "percetakan", "sablon", "studio", "kemasan",
	}},
	{"Jasa", []string{
		"jasa", "servis", "service", "laundry", "konsultan", "konsultasi", "reparasi",
		"perbaikan", "kursus", "les", "pelatihan", "perawatan", "salon", "barbershop",
		"bengkel", "logistik", "ekspedisi", "bimbingan",
	}},
	{"Retail", []string{
		"retail", "toko", "grosir", "toserba", "minimarket", "waralaba", "distributor",
		"pemasok", "supplier", "dagang", "jualan", "isi ulang",
	}},
}

// seekingRules is ordered for the same reason as categoryKeywords. The values
// follow the "Mitra ..." wording the seed profiles already use.
var seekingRules = []struct {
	value    string
	keywords []string
}{
	{"Modal Ekspansi", []string{"modal", "dana", "investor", "investasi", "pendanaan", "pinjaman", "pembiayaan"}},
	{"Mitra Distribusi", []string{"mitra", "kemitraan", "partner", "distributor", "reseller", "titip jual"}},
	{"Mitra Teknologi", []string{"teknologi", "digital", "aplikasi", "website", "sistem", "pencatatan"}},
	{"Mitra Pemasaran", []string{"pemasaran", "marketing", "promosi", "ekspor", "pasar", "pembeli"}},
	{"Mitra Peralatan", []string{"peralatan", "alat", "mesin", "truk", "kendaraan", "oven"}},
	{"Mentor Pendamping", []string{"mentor", "pendampingan", "bimbingan", "pelatihan", "edukasi"}},
}

var (
	categoryPatterns = compileWordPatterns(categoryKeywords)
	seekingPatterns  = compileSeekingPatterns()

	// locationPattern captures "di Bandung" / "di Jakarta Selatan": an
	// uppercase word plus up to two more, so lowercase words end the match.
	// [Dd] covers both a mid-sentence "di" and a sentence-opening "Di".
	locationPattern = regexp.MustCompile(`\b[Dd]i\s+(\p{Lu}[\p{L}'’-]*(?:\s+\p{Lu}[\p{L}'’-]*){0,2})`)

	// yearPattern matches a plausible founding year and nothing longer.
	yearPattern = regexp.MustCompile(`\b(?:19|20)\d{2}\b`)

	// sentenceEnd finds where the opening sentence stops, requiring a space or
	// end-of-string after the punctuation so "Rp 10.000" does not split.
	sentenceEnd = regexp.MustCompile(`[.!?](?:\s|$)`)
)

func compileWordPatterns(groups []struct {
	category string
	keywords []string
}) []struct {
	category string
	pattern  *regexp.Regexp
} {
	compiled := make([]struct {
		category string
		pattern  *regexp.Regexp
	}, 0, len(groups))
	for _, group := range groups {
		compiled = append(compiled, struct {
			category string
			pattern  *regexp.Regexp
		}{category: group.category, pattern: wordBoundaryPattern(group.keywords)})
	}
	return compiled
}

func compileSeekingPatterns() []struct {
	value   string
	pattern *regexp.Regexp
} {
	compiled := make([]struct {
		value   string
		pattern *regexp.Regexp
	}, 0, len(seekingRules))
	for _, rule := range seekingRules {
		compiled = append(compiled, struct {
			value   string
			pattern *regexp.Regexp
		}{value: rule.value, pattern: wordBoundaryPattern(rule.keywords)})
	}
	return compiled
}

// wordBoundaryPattern matches any keyword as a whole word, so short keywords
// like "tas" do not fire on "atas" or "kertas".
func wordBoundaryPattern(keywords []string) *regexp.Regexp {
	quoted := make([]string, 0, len(keywords))
	for _, keyword := range keywords {
		quoted = append(quoted, regexp.QuoteMeta(keyword))
	}
	return regexp.MustCompile(`\b(?:` + strings.Join(quoted, "|") + `)\b`)
}

func guessCategory(narrative string) string {
	lower := strings.ToLower(narrative)
	for _, rule := range categoryPatterns {
		if rule.pattern.MatchString(lower) {
			return rule.category
		}
	}
	return ""
}

func guessSeeking(narrative string) []string {
	lower := strings.ToLower(narrative)
	found := make([]string, 0, len(seekingPatterns))
	for _, rule := range seekingPatterns {
		if rule.pattern.MatchString(lower) {
			found = append(found, rule.value)
		}
	}
	return found
}

func guessLocation(narrative string) string {
	match := locationPattern.FindStringSubmatch(narrative)
	if match == nil {
		return ""
	}
	return strings.TrimSpace(match[1])
}

func guessYear(narrative string) int {
	match := yearPattern.FindString(narrative)
	if match == "" {
		return 0
	}
	year, err := strconv.Atoi(match)
	if err != nil {
		return 0
	}
	return year
}

// splitNarrative makes the opening sentence the short description and keeps the
// remainder as the story. A single-sentence narrative leaves the story blank.
func splitNarrative(narrative string) (string, string) {
	loc := sentenceEnd.FindStringIndex(narrative)
	if loc == nil {
		return narrative, ""
	}
	return strings.TrimSpace(narrative[:loc[1]]), strings.TrimSpace(narrative[loc[1]:])
}

// suggestionsFor lists what the draft is still missing, in a fixed order. The
// last entry is not conditional: financial figures are never generated, so the
// user is always told to supply them.
func suggestionsFor(draft domain.DraftProfile) []string {
	suggestions := make([]string, 0, 10)

	if draft.Name == "" {
		suggestions = append(suggestions, "Isi nama usaha.")
	}
	if draft.Category == "" {
		suggestions = append(suggestions, "Pilih kategori usaha yang paling mendekati.")
	}
	if draft.Location == "" {
		suggestions = append(suggestions, "Lengkapi kota atau lokasi usaha.")
	}
	if draft.FoundedYear == 0 {
		suggestions = append(suggestions, "Lengkapi tahun berdiri.")
	}
	if draft.Story == "" {
		suggestions = append(suggestions, "Tambahkan cerita usaha supaya profil lebih meyakinkan.")
	}
	suggestions = append(suggestions, "Lengkapi profil pemilik (nama, peran, bio).")
	suggestions = append(suggestions, "Tambahkan tonggak penting usaha dari tahun ke tahun.")
	suggestions = append(suggestions, "Isi kanvas model bisnis (9 blok BMC).")
	suggestions = append(suggestions, "Jelaskan tujuan pendanaan atau kemitraan yang dicari.")
	suggestions = append(suggestions, "Isi angka pendapatan dan pertumbuhan secara manual — angka finansial tidak dibuat otomatis.")

	return suggestions
}
