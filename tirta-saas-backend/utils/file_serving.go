package utils

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

func ServeStoredFile(c *gin.Context, storedPath string, downloadName string) error {
	normalizedPath, err := NormalizeStoredFilePath(storedPath)
	if err != nil {
		return err
	}

	file, err := os.Open(normalizedPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("stored file not found")
		}
		return err
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return err
	}

	contentType, err := DetectStoredFileContentType(normalizedPath)
	if err != nil {
		return err
	}

	if downloadName == "" {
		downloadName = filepath.Base(normalizedPath)
	}

	disposition := "attachment"
	if strings.HasPrefix(contentType, "image/") || contentType == "application/pdf" {
		disposition = "inline"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf(`%s; filename="%s"`, disposition, sanitizeFilename(downloadName)))
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Cache-Control", "private, no-store")
	c.Header("Pragma", "no-cache")

	c.DataFromReader(http.StatusOK, fileInfo.Size(), contentType, file, nil)
	return nil
}
