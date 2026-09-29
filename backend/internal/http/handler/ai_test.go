package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// errUnexpected stands for a failure the API should never explain to a client.
var errUnexpected = errors.New("upstream connection lost")

// fakeAIDraftService implements AIDraftService with canned output. It runs the
// real input validation so the handler's mapping of a ValidationError is
// exercised rather than assumed.
type fakeAIDraftService struct {
	result domain.DraftProfile
	err    error

	gotInput domain.DraftProfileInput
}

func (f *fakeAIDraftService) Draft(_ context.Context, in domain.DraftProfileInput) (domain.DraftProfile, error) {
	f.gotInput = in
	if f.err != nil {
		return domain.DraftProfile{}, f.err
	}
	if err := in.Validate(); err != nil {
		return domain.DraftProfile{}, err
	}
	return f.result, nil
}

// newAITestRouter mirrors the route wiring in cmd/api/main.go.
func newAITestRouter(svc AIDraftService, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	h := NewAIHandler(svc)

	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	v1 := router.Group("/api/v1")
	v1.POST("/ai/draft-profile", middleware.RequireSession(), h.Draft)
	return router
}

const draftBody = `{"narrative":"Kedai kopi kami di Bandung berdiri sejak 2015 dan mencari mitra distributor baru."}`

func TestAIDraftRequiresSession(t *testing.T) {
	router := newAITestRouter(&fakeAIDraftService{}, newFakeService())

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/ai/draft-profile", strings.NewReader(draftBody))
	request.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "unauthenticated") {
		t.Errorf("body = %s, want code unauthenticated", recorder.Body.String())
	}
}

func TestAIDraftRejectsMalformedJSON(t *testing.T) {
	router := newAITestRouter(&fakeAIDraftService{}, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/ai/draft-profile", `{"narrative":`))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "invalid_body") {
		t.Errorf("body = %s, want code invalid_body", recorder.Body.String())
	}
}

func TestAIDraftRejectsInvalidNarrative(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"missing field", `{}`},
		{"empty", `{"narrative":""}`},
		{"whitespace only", `{"narrative":"     "}`},
		{"too short", `{"narrative":"kopi"}`},
		{"too long", `{"narrative":"` + strings.Repeat("a", domain.MaxNarrativeLength+1) + `"}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			router := newAITestRouter(&fakeAIDraftService{}, newFakeService())

			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/ai/draft-profile", tc.body))

			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400 (body: %s)", recorder.Code, recorder.Body.String())
			}
			if !strings.Contains(recorder.Body.String(), "validation_failed") {
				t.Errorf("body = %s, want code validation_failed", recorder.Body.String())
			}
		})
	}
}

func TestAIDraftRejectsOversizedBody(t *testing.T) {
	router := newAITestRouter(&fakeAIDraftService{}, newFakeService())

	body := `{"narrative":"` + strings.Repeat("a", maxDraftRequestBytes) + `"}`
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/ai/draft-profile", body))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "invalid_body") {
		t.Errorf("body = %s, want code invalid_body", recorder.Body.String())
	}
}

func TestAIDraftReturnsTheGeneratedDraft(t *testing.T) {
	svc := &fakeAIDraftService{result: domain.DraftProfile{
		Name:        "Kopi Ruang Senja",
		Category:    "F&B",
		Location:    "Bandung",
		Description: "Kedai kopi komunitas.",
		FoundedYear: 2015,
		Milestones:  []domain.Milestone{},
		BMC:         []domain.BmcEntry{},
		Seeking:     []string{"Mitra Distribusi"},
		Suggestions: []string{"Isi angka pendapatan secara manual."},
	}}
	router := newAITestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/ai/draft-profile", draftBody))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if svc.gotInput.Narrative != "Kedai kopi kami di Bandung berdiri sejak 2015 dan mencari mitra distributor baru." {
		t.Errorf("service got %q, want the narrative from the body", svc.gotInput.Narrative)
	}

	var got domain.DraftProfile
	if err := json.Unmarshal(recorder.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode response: %v (body: %s)", err, recorder.Body.String())
	}
	if got.Name != "Kopi Ruang Senja" || got.Category != "F&B" || got.Location != "Bandung" {
		t.Errorf("draft = %+v, want the service result passed through", got)
	}
}

// TestAIDraftResponseCarriesNoFinancialFields is the contract guardrail: the
// model must never invent revenue figures, so the response type has no place
// to put them.
func TestAIDraftResponseCarriesNoFinancialFields(t *testing.T) {
	svc := &fakeAIDraftService{result: domain.DraftProfile{Name: "Kopi Ruang Senja", Category: "F&B"}}
	router := newAITestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/ai/draft-profile", draftBody))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	for _, key := range []string{"revenueLabel", "growthLabel", "revenueSeries"} {
		if strings.Contains(recorder.Body.String(), key) {
			t.Errorf("response contains %q: %s", key, recorder.Body.String())
		}
	}
}

func TestAIDraftMapsUnavailableTo503(t *testing.T) {
	svc := &fakeAIDraftService{err: domain.ErrAIUnavailable}
	router := newAITestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/ai/draft-profile", draftBody))

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "ai_unavailable") {
		t.Errorf("body = %s, want code ai_unavailable", recorder.Body.String())
	}
}

func TestAIDraftHidesUnexpectedServiceErrors(t *testing.T) {
	svc := &fakeAIDraftService{err: errUnexpected}
	router := newAITestRouter(svc, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/ai/draft-profile", draftBody))

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500 (body: %s)", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), "internal_error") {
		t.Errorf("body = %s, want code internal_error", recorder.Body.String())
	}
	if strings.Contains(recorder.Body.String(), errUnexpected.Error()) {
		t.Errorf("body leaks the internal error: %s", recorder.Body.String())
	}
}
