package utils

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// AllowedImageTypes defines allowed image MIME types
var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

// MaxImageSize defines maximum image size (5MB)
const MaxImageSize = 5 * 1024 * 1024

// UploadConfig holds configuration for file upload
type UploadConfig struct {
	MaxSize       int64
	AllowedTypes  map[string]bool
	UploadDir     string
	GenerateName  bool
	KeepOriginal  bool
}

// DefaultImageUploadConfig returns default config for image uploads
func DefaultImageUploadConfig() UploadConfig {
	return UploadConfig{
		MaxSize:      MaxImageSize,
		AllowedTypes: AllowedImageTypes,
		UploadDir:    "uploads/logos",
		GenerateName: true,
		KeepOriginal: false,
	}
}

// ValidateFile validates uploaded file against config
func ValidateFile(file *multipart.FileHeader, config UploadConfig) error {
	// Check file size
	if file.Size > config.MaxSize {
		return fmt.Errorf("file size exceeds maximum allowed size of %d bytes", config.MaxSize)
	}

	// Check content type
	contentType := file.Header.Get("Content-Type")
	if !config.AllowedTypes[contentType] {
		return errors.New("invalid file type. Only images are allowed")
	}

	return nil
}

// SaveUploadedFile saves the uploaded file to disk
func SaveUploadedFile(file *multipart.FileHeader, config UploadConfig) (string, error) {
	// Validate file
	if err := ValidateFile(file, config); err != nil {
		return "", err
	}

	// Create upload directory if not exists
	if err := os.MkdirAll(config.UploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Generate filename
	var filename string
	if config.GenerateName {
		ext := filepath.Ext(file.Filename)
		filename = fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	} else if config.KeepOriginal {
		filename = file.Filename
	} else {
		// Sanitize original filename
		filename = sanitizeFilename(file.Filename)
	}

	// Full path
	fullPath := filepath.Join(config.UploadDir, filename)

	// Open uploaded file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %v", err)
	}
	defer src.Close()

	// Create destination file
	dst, err := os.Create(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()

	// Copy file
	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("failed to save file: %v", err)
	}

	// Return relative path
	return fullPath, nil
}

// DeleteFile deletes a file from disk
func DeleteFile(filePath string) error {
	if filePath == "" {
		return nil
	}

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // File doesn't exist, nothing to delete
	}

	// Delete file
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("failed to delete file: %v", err)
	}

	return nil
}

// sanitizeFilename removes potentially dangerous characters from filename
func sanitizeFilename(filename string) string {
	// Replace spaces with underscores
	filename = strings.ReplaceAll(filename, " ", "_")
	
	// Remove any path separators
	filename = filepath.Base(filename)
	
	// Keep only alphanumeric, dots, hyphens, and underscores
	var result strings.Builder
	for _, r := range filename {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || 
		   (r >= '0' && r <= '9') || r == '.' || r == '-' || r == '_' {
			result.WriteRune(r)
		}
	}
	
	return result.String()
}

// GetFileExtension returns the file extension from filename
func GetFileExtension(filename string) string {
	return strings.ToLower(filepath.Ext(filename))
}

// GetFilenameWithoutExt returns filename without extension
func GetFilenameWithoutExt(filename string) string {
	ext := filepath.Ext(filename)
	return filename[:len(filename)-len(ext)]
}
