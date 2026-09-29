package ai

import (
	"context"
	"encoding/json"
	"reflect"
	"strings"
	"testing"

	"github.com/alfian/lumora/backend/internal/domain"
)

func draftFrom(t *testing.T, narrative string) domain.DraftProfile {
	t.Helper()

	draft, err := NewStub().Draft(context.Background(), domain.DraftProfileInput{Narrative: narrative})
	if err != nil {
		t.Fatalf("Draft() = %v, want nil", err)
	}
	return draft
}

func TestDraftGuessesCategory(t *testing.T) {
	cases := []struct {
		name      string
		narrative string
		want      string
	}{
		{"kopi is F&B", "Kedai kopi kami menjual biji lokal dan minuman susu.", "F&B"},
		{"bakery is F&B", "Usaha roti dan kue rumahan dengan pesanan katering.", "F&B"},
		{"boutique is Fashion", "Butik kami menjual hijab dan kain tenun lokal.", "Fashion"},
		{"craft is Kreatif", "Studio kerajinan serat alam untuk benda pakai.", "Kreatif"},
		{"service is Jasa", "Jasa servis motor dan perawatan kendaraan warga.", "Jasa"},
		{"shop is Retail", "Toko grosir kebutuhan rumah tangga untuk lingkungan.", "Retail"},
		{"no keyword", "Kami mengembangkan usaha keluarga yang sudah lama berjalan.", ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			draft := draftFrom(t, tc.narrative)
			if draft.Category != tc.want {
				t.Errorf("Category = %q, want %q", draft.Category, tc.want)
			}
		})
	}
}

func TestDraftCategoryAlwaysMatchesTheEnum(t *testing.T) {
	narratives := []string{
		"Kedai kopi di Bandung yang berdiri sejak 2015.",
		"Butik hijab dan kain tenun untuk pasar lokal.",
		"Toko grosir sembako untuk warung sekitar.",
		"Jasa konsultasi keuangan untuk usaha kecil.",
		"Tidak ada kata kunci yang cocok di sini sama sekali.",
	}

	for _, narrative := range narratives {
		draft := draftFrom(t, narrative)
		if draft.Category == "" {
			continue
		}
		if !domain.ValidCategory(draft.Category) {
			t.Errorf("Category = %q is outside domain.Categories", draft.Category)
		}
	}
}

func TestDraftMatchesKeywordsOnWordBoundaries(t *testing.T) {
	// "atas" and "kertas" both contain "tas"; a substring match would wrongly
	// categorize this as Fashion.
	draft := draftFrom(t, "Kami menjual kertas dan kemasan di atas meja kayu.")

	if draft.Category == "Fashion" {
		t.Errorf("Category = %q, want no Fashion match from the substring \"tas\"", draft.Category)
	}
}

func TestDraftGuessesLocation(t *testing.T) {
	cases := []struct {
		name      string
		narrative string
		want      string
	}{
		{"single word", "Kedai kopi kami di Bandung melayani pelanggan setiap hari.", "Bandung"},
		{"two words", "Usaha kami di Jakarta Selatan sudah berdiri lama sekali.", "Jakarta Selatan"},
		{"sentence opening", "Di Surabaya kami membuka cabang kedua tahun lalu.", "Surabaya"},
		{"no location", "Usaha ini melayani pelanggan tanpa cabang tetap.", ""},
		{"lowercase place is ignored", "Kami berjualan di bandung setiap akhir pekan.", ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			draft := draftFrom(t, tc.narrative)
			if draft.Location != tc.want {
				t.Errorf("Location = %q, want %q", draft.Location, tc.want)
			}
		})
	}
}

func TestDraftGuessesFoundedYear(t *testing.T) {
	cases := []struct {
		name      string
		narrative string
		want      int
	}{
		{"year present", "Kedai kopi di Bandung yang berdiri sejak 2015.", 2015},
		{"nineteen hundreds", "Usaha keluarga ini dimulai pada 1987 di Solo.", 1987},
		{"no year", "Usaha ini masih sangat baru dan belum genap setahun.", 0},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			draft := draftFrom(t, tc.narrative)
			if draft.FoundedYear != tc.want {
				t.Errorf("FoundedYear = %d, want %d", draft.FoundedYear, tc.want)
			}
		})
	}
}

func TestDraftSplitsNarrativeIntoSentenceAndStory(t *testing.T) {
	draft := draftFrom(t, "Kedai kopi kami menjual biji lokal. Cerita lengkapnya dimulai dari garasi rumah.")

	if draft.Description != "Kedai kopi kami menjual biji lokal." {
		t.Errorf("Description = %q, want the opening sentence", draft.Description)
	}
	if draft.Story != "Cerita lengkapnya dimulai dari garasi rumah." {
		t.Errorf("Story = %q, want the remainder", draft.Story)
	}
}

func TestDraftLeavesStoryEmptyForSingleSentence(t *testing.T) {
	draft := draftFrom(t, "Kedai kopi kami menjual biji lokal tanpa henti")

	if draft.Description != "Kedai kopi kami menjual biji lokal tanpa henti" {
		t.Errorf("Description = %q, want the whole narrative", draft.Description)
	}
	if draft.Story != "" {
		t.Errorf("Story = %q, want empty", draft.Story)
	}
}

func TestDraftDoesNotSplitInsideNumbers(t *testing.T) {
	draft := draftFrom(t, "Penjualan kami Rp 10.000 per porsi setiap hari")

	if !strings.Contains(draft.Description, "Rp 10.000 per porsi") {
		t.Errorf("Description = %q, want the decimal point left intact", draft.Description)
	}
}

func TestDraftGuessesSeeking(t *testing.T) {
	cases := []struct {
		name      string
		narrative string
		want      []string
	}{
		{"funding", "Kami mencari modal tambahan untuk membuka cabang baru.", []string{"Modal Ekspansi"}},
		{"partnership", "Kami ingin menjalin kemitraan dengan distributor baru.", []string{"Mitra Distribusi"}},
		{"multiple matches keep rule order", "Kami butuh investor dan distributor untuk memperluas pasar.", []string{"Modal Ekspansi", "Mitra Distribusi", "Mitra Pemasaran"}},
		{"none", "Usaha ini berjalan santai setiap hari.", []string{}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			draft := draftFrom(t, tc.narrative)
			if !reflect.DeepEqual(draft.Seeking, tc.want) {
				t.Errorf("Seeking = %v, want %v", draft.Seeking, tc.want)
			}
		})
	}
}

func TestDraftNeverInventsFinancialFields(t *testing.T) {
	draft := draftFrom(t, "Kedai kopi di Bandung dengan pendapatan Rp 20 juta per bulan dan pertumbuhan 15 persen.")

	encoded, err := json.Marshal(draft)
	if err != nil {
		t.Fatalf("Marshal() = %v, want nil", err)
	}

	for _, key := range []string{"revenueLabel", "growthLabel", "revenueSeries"} {
		if strings.Contains(string(encoded), key) {
			t.Errorf("draft JSON contains %q: %s", key, encoded)
		}
	}
}

func TestDraftIsDeterministic(t *testing.T) {
	narrative := "Kedai kopi kami di Bandung berdiri sejak 2015 dan mencari mitra distributor baru."

	first := draftFrom(t, narrative)
	second := draftFrom(t, narrative)

	if !reflect.DeepEqual(first, second) {
		t.Errorf("two runs differ:\nfirst  = %+v\nsecond = %+v", first, second)
	}
}

func TestDraftSuggestsTheMissingPieces(t *testing.T) {
	draft := draftFrom(t, "Kedai kopi kami di Bandung berdiri sejak 2015 dan menjual biji lokal.")

	if len(draft.Suggestions) == 0 {
		t.Fatal("Suggestions is empty, want guidance for the blank fields")
	}
	joined := strings.Join(draft.Suggestions, " | ")
	if !strings.Contains(joined, "pendapatan") {
		t.Errorf("Suggestions = %q, want the financial-figures reminder", joined)
	}
}

func TestDraftHandlesShortNarrativeWithoutPanicking(t *testing.T) {
	for _, narrative := range []string{"", "kopi", "  ", ".", "di "} {
		draft := draftFrom(t, narrative)

		if len(draft.Suggestions) == 0 {
			t.Errorf("narrative %q gave no suggestions", narrative)
		}
	}
}

func TestDraftRespectsCancelledContext(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := NewStub().Draft(ctx, domain.DraftProfileInput{Narrative: "Kedai kopi kami di Bandung sejak 2015."})
	if err == nil {
		t.Fatal("Draft() = nil error, want the context error")
	}
}
