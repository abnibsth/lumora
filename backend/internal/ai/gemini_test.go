package ai

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/alfian/lumora/backend/internal/domain"
)

// newTestGemini points a provider at a stub server. Tests live in package ai
// so they can swap the unexported baseURL.
func newTestGemini(t *testing.T, handler http.HandlerFunc) *Gemini {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	g := NewGemini("test-key", DefaultGeminiModel)
	g.baseURL = server.URL
	return g
}

// candidateJSON wraps a draft JSON literal the way the API nests it.
func candidateJSON(text string) string {
	payload := map[string]any{
		"candidates": []map[string]any{
			{"content": map[string]any{"parts": []map[string]string{{"text": text}}}},
		},
	}
	encoded, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}
	return string(encoded)
}

func writeJSON(t *testing.T, w http.ResponseWriter, status int, body string) {
	t.Helper()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = io.WriteString(w, body)
}

func TestGeminiDraftParsesResponse(t *testing.T) {
	draft := `{
		"name": "Kopi Senja",
		"category": "F&B",
		"location": "Bandung",
		"description": "Kedai kopi kecil.",
		"story": "Dimulai dari garasi pada 2019.",
		"foundedYear": 2019,
		"owner": {"name": "Rani", "role": "Pendiri", "bio": "Barista."},
		"milestones": [{"year": 2019, "title": "Buka", "description": "Outlet pertama."}],
		"bmc": [{"label": "Key Partners", "value": "Petani kopi lokal"}],
		"seeking": ["Modal Ekspansi"],
		"seekingObjective": "Menambah dua outlet.",
		"suggestions": ["Lengkapi BMC."]
	}`

	g := newTestGemini(t, func(w http.ResponseWriter, r *http.Request) {
		writeJSON(t, w, http.StatusOK, candidateJSON(draft))
	})

	got, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung sejak 2019."})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if got.Name != "Kopi Senja" {
		t.Errorf("Name = %q, want %q", got.Name, "Kopi Senja")
	}
	if got.Category != "F&B" {
		t.Errorf("Category = %q, want %q", got.Category, "F&B")
	}
	if got.FoundedYear != 2019 {
		t.Errorf("FoundedYear = %d, want 2019", got.FoundedYear)
	}
	if got.Owner.Role != "Pendiri" {
		t.Errorf("Owner.Role = %q, want %q", got.Owner.Role, "Pendiri")
	}
	if len(got.Milestones) != 1 || got.Milestones[0].Year != 2019 {
		t.Errorf("Milestones = %+v, want one 2019 entry", got.Milestones)
	}
	if len(got.BMC) != 1 || got.BMC[0].Label != "Key Partners" {
		t.Errorf("BMC = %+v, want one Key Partners entry", got.BMC)
	}
	if len(got.Seeking) != 1 || got.Seeking[0] != "Modal Ekspansi" {
		t.Errorf("Seeking = %+v, want [Modal Ekspansi]", got.Seeking)
	}
	if got.SeekingObjective != "Menambah dua outlet." {
		t.Errorf("SeekingObjective = %q", got.SeekingObjective)
	}
}

func TestGeminiDraftSendsKeyModelAndStructuredConfig(t *testing.T) {
	var (
		gotPath   string
		gotQuery  string
		gotKey    string
		gotAccept string
		gotBody   map[string]any
	)

	g := newTestGemini(t, func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotQuery = r.URL.RawQuery
		gotKey = r.Header.Get("x-goog-api-key")
		gotAccept = r.Header.Get("Content-Type")
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &gotBody)
		writeJSON(t, w, http.StatusOK, candidateJSON(`{}`))
	})

	const narrative = "Kedai kopi di Bandung sejak 2019."
	if _, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: narrative}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !strings.Contains(gotPath, DefaultGeminiModel) || !strings.HasSuffix(gotPath, ":generateContent") {
		t.Errorf("path = %q, want model + :generateContent", gotPath)
	}
	if gotQuery != "" {
		t.Errorf("query = %q, want empty (the key must not ride in the URL)", gotQuery)
	}
	if gotKey != "test-key" {
		t.Errorf("x-goog-api-key = %q, want test-key", gotKey)
	}
	if gotAccept != "application/json" {
		t.Errorf("Content-Type = %q", gotAccept)
	}

	// The narrative must reach the model, fenced as data.
	contents, _ := gotBody["contents"].([]any)
	if len(contents) != 1 {
		t.Fatalf("contents = %+v, want one entry", gotBody["contents"])
	}
	parts, _ := contents[0].(map[string]any)["parts"].([]any)
	if len(parts) != 1 {
		t.Fatalf("parts = %+v, want one entry", parts)
	}
	prompt, _ := parts[0].(map[string]any)["text"].(string)
	if !strings.Contains(prompt, narrative) {
		t.Errorf("prompt = %q, want it to contain the narrative", prompt)
	}
	if !strings.Contains(prompt, "bukan instruksi") {
		t.Errorf("prompt = %q, want the data-not-instructions fence", prompt)
	}

	// The system instruction is what carries the anti-injection rules.
	system, _ := gotBody["systemInstruction"].(map[string]any)
	if system == nil {
		t.Fatal("systemInstruction missing")
	}

	config, _ := gotBody["generationConfig"].(map[string]any)
	if config == nil {
		t.Fatal("generationConfig missing")
	}
	if config["responseMimeType"] != "application/json" {
		t.Errorf("responseMimeType = %v, want application/json", config["responseMimeType"])
	}
	thinking, _ := config["thinkingConfig"].(map[string]any)
	if thinking == nil || thinking["thinkingBudget"] != float64(0) {
		t.Errorf("thinkingConfig = %v, want thinkingBudget 0", config["thinkingConfig"])
	}
}

func TestGeminiResponseSchemaHasNoFinancialFields(t *testing.T) {
	// The structural guardrail: the schema must not give the model anywhere to
	// put an invented revenue or growth figure.
	encoded, err := json.Marshal(geminiResponseSchema)
	if err != nil {
		t.Fatalf("marshal schema: %v", err)
	}

	var schema struct {
		Properties map[string]json.RawMessage `json:"properties"`
	}
	if err := json.Unmarshal(encoded, &schema); err != nil {
		t.Fatalf("unmarshal schema: %v", err)
	}

	forbidden := []string{"revenue", "growth", "revenueLabel", "growthLabel", "revenueSeries", "omzet", "pendapatan"}
	for key := range schema.Properties {
		for _, bad := range forbidden {
			if strings.EqualFold(key, bad) {
				t.Errorf("schema exposes financial field %q", key)
			}
		}
	}

	// And the category enum must be exactly the domain list, so the two cannot
	// drift apart.
	var category struct {
		Enum []string `json:"enum"`
	}
	if err := json.Unmarshal(schema.Properties["category"], &category); err != nil {
		t.Fatalf("unmarshal category: %v", err)
	}
	if len(category.Enum) != len(domain.Categories) {
		t.Fatalf("category enum = %v, want %v", category.Enum, domain.Categories)
	}
	for i, want := range domain.Categories {
		if category.Enum[i] != want {
			t.Errorf("category enum[%d] = %q, want %q", i, category.Enum[i], want)
		}
	}
}

func TestGeminiDraftIgnoresUnknownFields(t *testing.T) {
	// A model that ignores the schema and returns financial fields must not get
	// them past the domain type.
	injected := `{
		"name": "Kopi Senja",
		"revenueLabel": "Rp 10 miliar",
		"growthLabel": "120% YoY",
		"revenueSeries": [1, 2, 3]
	}`

	g := newTestGemini(t, func(w http.ResponseWriter, r *http.Request) {
		writeJSON(t, w, http.StatusOK, candidateJSON(injected))
	})

	got, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung."})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	encoded, err := json.Marshal(got)
	if err != nil {
		t.Fatalf("marshal draft: %v", err)
	}
	for _, bad := range []string{"revenueLabel", "growthLabel", "revenueSeries"} {
		if strings.Contains(string(encoded), bad) {
			t.Errorf("draft leaked %q: %s", bad, encoded)
		}
	}
	if got.Name != "Kopi Senja" {
		t.Errorf("Name = %q, want the recognised field kept", got.Name)
	}
}

func TestGeminiDraftStatusErrorHidesBody(t *testing.T) {
	const secret = "api-key-echo-9f3a"

	g := newTestGemini(t, func(w http.ResponseWriter, r *http.Request) {
		writeJSON(t, w, http.StatusInternalServerError, `{"error":{"message":"`+secret+` and the whole prompt"}}`)
	})

	_, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung."})
	if err == nil {
		t.Fatal("expected an error for a non-200 status")
	}
	if strings.Contains(err.Error(), secret) {
		t.Errorf("error leaked the response body: %v", err)
	}
	if !strings.Contains(err.Error(), "500") {
		t.Errorf("error = %v, want it to carry the status", err)
	}
}

func TestGeminiDraftTransportErrorHidesKey(t *testing.T) {
	g := NewGemini("super-secret-key", "gemini-2.5-flash")
	// Nothing is listening here.
	g.baseURL = "http://127.0.0.1:1"

	_, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung."})
	if err == nil {
		t.Fatal("expected a transport error")
	}
	if strings.Contains(err.Error(), "super-secret-key") {
		t.Errorf("error leaked the API key: %v", err)
	}
}

func TestGeminiDraftRejectsBadResponses(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"not json", `<html>oops</html>`},
		{"no candidates", `{}`},
		{"empty candidates", `{"candidates":[]}`},
		{"no parts", `{"candidates":[{"content":{"parts":[]}}]}`},
		{"blank text", `{"candidates":[{"content":{"parts":[{"text":"   "}]}}]}`},
		{"draft not json", candidateJSON("ini bukan json")},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body := tc.body
			g := newTestGemini(t, func(w http.ResponseWriter, r *http.Request) {
				writeJSON(t, w, http.StatusOK, body)
			})

			if _, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung."}); err == nil {
				t.Fatal("expected an error")
			}
		})
	}
}

func TestGeminiDraftReportsBlockedPrompt(t *testing.T) {
	g := newTestGemini(t, func(w http.ResponseWriter, r *http.Request) {
		writeJSON(t, w, http.StatusOK, `{"promptFeedback":{"blockReason":"SAFETY"}}`)
	})

	_, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung."})
	if err == nil {
		t.Fatal("expected an error for a blocked prompt")
	}
	if !strings.Contains(err.Error(), "SAFETY") {
		t.Errorf("error = %v, want the block reason", err)
	}
}

func TestGeminiDraftPreservesContextCancellation(t *testing.T) {
	// The service detects a timeout with errors.Is, so the provider must wrap
	// the context error rather than replace it.
	g := newTestGemini(t, func(w http.ResponseWriter, r *http.Request) {
		<-r.Context().Done()
	})

	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	_, err := g.Draft(ctx, domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung."})
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("err = %v, want context.Canceled", err)
	}
}

func TestNewGeminiDefaultsModel(t *testing.T) {
	if got := NewGemini("k", "").model; got != DefaultGeminiModel {
		t.Errorf("model = %q, want %q", got, DefaultGeminiModel)
	}
	if got := NewGemini("k", "  ").model; got != DefaultGeminiModel {
		t.Errorf("blank model = %q, want %q", got, DefaultGeminiModel)
	}
	if got := NewGemini("k", "gemini-test-model").model; got != "gemini-test-model" {
		t.Errorf("model = %q, want the configured one", got)
	}
}

func TestProviderStatus(t *testing.T) {
	cases := []struct {
		name string
		body string
		want string
	}{
		{"retired model", `{"error":{"code":404,"status":"NOT_FOUND","message":"models/x is no longer available"}}`, "NOT_FOUND"},
		{"demand spike", `{"error":{"code":503,"status":"UNAVAILABLE"}}`, "UNAVAILABLE"},
		{"not json", `<html>gateway</html>`, ""},
		{"empty", ``, ""},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := providerStatus([]byte(tc.body)); got != tc.want {
				t.Errorf("providerStatus = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestGeminiDraftUsesConfiguredModelInPath(t *testing.T) {
	var gotPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		writeJSON(t, w, http.StatusOK, candidateJSON(`{}`))
	}))
	defer server.Close()

	g := NewGemini("k", "gemini-test-model")
	g.baseURL = server.URL

	if _, err := g.Draft(t.Context(), domain.DraftProfileInput{Narrative: "Kedai kopi di Bandung."}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(gotPath, "gemini-test-model") {
		t.Errorf("path = %q, want the configured model", gotPath)
	}
}

// TestGeminiSatisfiesDrafter is a compile-time check that the provider can be
// wired into the service.
func TestGeminiSatisfiesDrafter(t *testing.T) {
	var _ interface {
		Draft(context.Context, domain.DraftProfileInput) (domain.DraftProfile, error)
	} = NewGemini("k", "")
}
