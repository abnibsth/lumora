package handler

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

// pngBytes is a real PNG signature followed by padding: http.DetectContentType
// only looks at the first bytes, which is exactly what we want to test.
func pngBytes() []byte {
	body := []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}
	return append(body, bytes.Repeat([]byte{0}, 64)...)
}

func uploadRequest(cookie bool, field, filename string, payload []byte) *http.Request {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	if field != "" {
		part, _ := writer.CreateFormFile(field, filename)
		_, _ = part.Write(payload)
	}
	_ = writer.Close()

	request := httptest.NewRequest(http.MethodPost, "/api/v1/media", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	if cookie {
		request.AddCookie(&http.Cookie{Name: domain.SessionCookieName, Value: "token-abc"})
	}
	return request
}

func newMediaTestRouter(h *MediaHandler, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	router.POST("/api/v1/media", middleware.RequireSession(), h.Upload)
	return router
}

func TestUploadRequiresSession(t *testing.T) {
	router := newMediaTestRouter(NewMediaHandler(t.TempDir()), newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, uploadRequest(false, "file", "photo.png", pngBytes()))

	if recorder.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", recorder.Code)
	}
}

func TestUploadMissingFileField(t *testing.T) {
	router := newMediaTestRouter(NewMediaHandler(t.TempDir()), newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, uploadRequest(true, "", "", nil))

	if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "invalid_body") {
		t.Errorf("status = %d body = %s, want 400 invalid_body", recorder.Code, recorder.Body.String())
	}
}

func TestUploadAcceptsPNGAndReturnsPublicURL(t *testing.T) {
	dir := t.TempDir()
	router := newMediaTestRouter(NewMediaHandler(dir), newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, uploadRequest(true, "file", "foto.png", pngBytes()))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", recorder.Code, recorder.Body.String())
	}
	var resp struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if !strings.HasPrefix(resp.URL, "/uploads/") || !strings.HasSuffix(resp.URL, ".png") {
		t.Errorf("url = %q, want /uploads/<uuid>.png", resp.URL)
	}

	entries, err := os.ReadDir(dir)
	if err != nil || len(entries) != 1 {
		t.Fatalf("upload dir entries = %v (err %v), want exactly 1 file", entries, err)
	}
	if !strings.HasSuffix(entries[0].Name(), ".png") {
		t.Errorf("stored file = %q, want .png", entries[0].Name())
	}
	if _, err := os.Stat(filepath.Join(dir, entries[0].Name())); err != nil {
		t.Errorf("stored file missing: %v", err)
	}
}

func TestUploadRejectsNonImageBySniffedType(t *testing.T) {
	router := newMediaTestRouter(NewMediaHandler(t.TempDir()), newFakeService())

	// Client claims .png; the bytes say text/plain. The sniff must win.
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, uploadRequest(true, "file", "jahat.png", []byte("bukan gambar sama sekali")))

	if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "validation_failed") {
		t.Errorf("status = %d body = %s, want 400 validation_failed", recorder.Code, recorder.Body.String())
	}
}

func TestUploadRejectsOversizedFile(t *testing.T) {
	handler := NewMediaHandler(t.TempDir())
	handler.maxBytes = 16
	router := newMediaTestRouter(handler, newFakeService())

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, uploadRequest(true, "file", "besar.png", pngBytes()))

	if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "validation_failed") {
		t.Errorf("status = %d body = %s, want 400 validation_failed", recorder.Code, recorder.Body.String())
	}
}
