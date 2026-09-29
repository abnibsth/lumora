package handler

import (
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	// DefaultMaxUploadBytes caps an upload at 5 MB: enough for cover photos
	// without letting the endpoint become a disk-filler.
	DefaultMaxUploadBytes = 5 << 20
)

// allowedImageTypes maps the content type http.DetectContentType sniffs from
// the actual bytes to the extension the file gets. The client-supplied
// filename is never used, so a crafted name cannot traverse directories.
var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

type MediaHandler struct {
	uploadDir string
	maxBytes  int64
}

func NewMediaHandler(uploadDir string) *MediaHandler {
	return &MediaHandler{uploadDir: uploadDir, maxBytes: DefaultMaxUploadBytes}
}

// Upload handles POST /api/v1/media (multipart, field "file") and answers
// with the public path the profile fields expect, e.g. /uploads/<uuid>.png.
func (h *MediaHandler) Upload(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		writeError(c, http.StatusBadRequest, "invalid_body",
			"File wajib dikirim pada field \"file\" (multipart/form-data).")
		return
	}
	if fileHeader.Size == 0 {
		writeError(c, http.StatusBadRequest, "validation_failed", "File tidak boleh kosong.")
		return
	}
	if fileHeader.Size > h.maxBytes {
		writeError(c, http.StatusBadRequest, "validation_failed",
			fmt.Sprintf("Ukuran file maksimal %d MB.", h.maxBytes>>20))
		return
	}

	extension, ok := sniffExtension(fileHeader)
	if !ok {
		writeError(c, http.StatusBadRequest, "validation_failed",
			"Format file harus JPEG, PNG, WebP, atau GIF.")
		return
	}

	if err := os.MkdirAll(h.uploadDir, 0o755); err != nil {
		log.Printf("media mkdir %q: %v", h.uploadDir, err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}

	name := uuid.New().String() + extension
	if err := c.SaveUploadedFile(fileHeader, filepath.Join(h.uploadDir, name)); err != nil {
		log.Printf("media save: %v", err)
		writeError(c, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"url": "/uploads/" + name})
}

// sniffExtension reads the first bytes of the upload and returns the
// extension for its real type, ignoring whatever the client claimed.
func sniffExtension(fileHeader *multipart.FileHeader) (string, bool) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", false
	}
	defer file.Close()

	head := make([]byte, 512)
	read, _ := file.Read(head)
	extension, ok := allowedImageTypes[http.DetectContentType(head[:read])]
	return extension, ok
}
