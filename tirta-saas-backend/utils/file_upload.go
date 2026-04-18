package utils

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// AllowedImageTypes defines allowed image MIME types
var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

var AllowedProofTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"application/pdf": true,
}

var AllowedCSVTypes = map[string]bool{
	"text/csv":                 true,
	"text/plain":               true,
	"application/vnd.ms-excel": true,
	"application/csv":          true,
}

var AllowedImageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

var AllowedProofExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".pdf":  true,
}

var AllowedCSVExtensions = map[string]bool{
	".csv": true,
}

var CanonicalExtensionsByType = map[string]string{
	"image/jpeg":               ".jpg",
	"image/png":                ".png",
	"image/gif":                ".gif",
	"image/webp":               ".webp",
	"application/pdf":          ".pdf",
	"text/csv":                 ".csv",
	"text/plain":               ".csv",
	"application/vnd.ms-excel": ".csv",
	"application/csv":          ".csv",
}

// MaxImageSize defines maximum image size (5MB)
const MaxImageSize = 5 * 1024 * 1024
const MaxProofFileSize = 5 * 1024 * 1024
const MaxCSVFileSize = 5 * 1024 * 1024

type FileValidationResult struct {
	ContentType        string
	CanonicalExtension string
}

// UploadConfig holds configuration for file upload
type UploadConfig struct {
	MaxSize           int64
	AllowedTypes      map[string]bool
	AllowedExtensions map[string]bool
	UploadDir         string
	GenerateName      bool
	KeepOriginal      bool
}

// DefaultImageUploadConfig returns default config for image uploads
func DefaultImageUploadConfig() UploadConfig {
	return UploadConfig{
		MaxSize:           MaxImageSize,
		AllowedTypes:      AllowedImageTypes,
		AllowedExtensions: AllowedImageExtensions,
		UploadDir:         "uploads/logos",
		GenerateName:      true,
		KeepOriginal:      false,
	}
}

func DefaultProofUploadConfig() UploadConfig {
	return UploadConfig{
		MaxSize:           MaxProofFileSize,
		AllowedTypes:      AllowedProofTypes,
		AllowedExtensions: AllowedProofExtensions,
		UploadDir:         "storage/private/proofs",
		GenerateName:      true,
		KeepOriginal:      false,
	}
}

func DefaultCSVUploadConfig() UploadConfig {
	return UploadConfig{
		MaxSize:           MaxCSVFileSize,
		AllowedTypes:      AllowedCSVTypes,
		AllowedExtensions: AllowedCSVExtensions,
		UploadDir:         "storage/private/imports",
		GenerateName:      true,
		KeepOriginal:      false,
	}
}

// ValidateFile validates uploaded file against config
func ValidateFile(file *multipart.FileHeader, config UploadConfig) (*FileValidationResult, error) {
	// Check file size
	if file.Size > config.MaxSize {
		return nil, fmt.Errorf("file size exceeds maximum allowed size of %d bytes", config.MaxSize)
	}

	if err := validateUploadDir(config.UploadDir); err != nil {
		return nil, err
	}

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file for validation: %v", err)
	}
	defer src.Close()

	buffer := make([]byte, 512)
	n, err := src.Read(buffer)
	if err != nil && !errors.Is(err, io.EOF) {
		return nil, fmt.Errorf("failed to inspect uploaded file: %v", err)
	}

	contentType := normalizeContentType(http.DetectContentType(buffer[:n]))
	if !config.AllowedTypes[contentType] {
		return nil, fmt.Errorf("invalid file type: %s", contentType)
	}

	extension := strings.ToLower(filepath.Ext(file.Filename))
	if extension == "" || !config.AllowedExtensions[extension] {
		return nil, fmt.Errorf("invalid file extension: %s", extension)
	}

	canonicalExtension, ok := CanonicalExtensionsByType[contentType]
	if !ok {
		return nil, fmt.Errorf("unsupported file type: %s", contentType)
	}

	if !config.AllowedExtensions[canonicalExtension] {
		return nil, fmt.Errorf("canonical extension %s is not allowed", canonicalExtension)
	}

	return &FileValidationResult{
		ContentType:        contentType,
		CanonicalExtension: canonicalExtension,
	}, nil
}

// SaveUploadedFile saves the uploaded file to disk
func SaveUploadedFile(file *multipart.FileHeader, config UploadConfig) (string, error) {
	// Validate file
	validation, err := ValidateFile(file, config)
	if err != nil {
		return "", err
	}

	// Create upload directory if not exists
	uploadDir := filepath.Clean(config.UploadDir)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Generate filename
	var filename string
	if config.GenerateName {
		filename = fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), validation.CanonicalExtension)
	} else if config.KeepOriginal {
		filename = file.Filename
	} else {
		// Sanitize original filename
		filename = sanitizeFilename(file.Filename)
	}

	// Full path
	if filename == "" {
		filename = fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), validation.CanonicalExtension)
	}

	fullPath := filepath.Join(uploadDir, filename)

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

func normalizeContentType(contentType string) string {
	return strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))
}

func validateUploadDir(uploadDir string) error {
	if uploadDir == "" {
		return errors.New("upload directory is required")
	}

	cleaned := filepath.Clean(uploadDir)
	if cleaned == "." || cleaned == "/" || filepath.IsAbs(cleaned) || strings.HasPrefix(cleaned, "..") {
		return fmt.Errorf("invalid upload directory: %s", uploadDir)
	}

	return nil
}

func NormalizeStoredFilePath(filePath string) (string, error) {
	trimmed := strings.TrimSpace(filePath)
	trimmed = strings.TrimPrefix(trimmed, "/")
	cleaned := filepath.Clean(trimmed)
	if cleaned == "." || filepath.IsAbs(cleaned) || strings.HasPrefix(cleaned, "..") {
		return "", fmt.Errorf("invalid stored file path: %s", filePath)
	}

	return cleaned, nil
}

func DetectStoredFileContentType(filePath string) (string, error) {
	normalizedPath, err := NormalizeStoredFilePath(filePath)
	if err != nil {
		return "", err
	}

	file, err := os.Open(normalizedPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && !errors.Is(err, io.EOF) {
		return "", err
	}

	contentType := normalizeContentType(http.DetectContentType(buffer[:n]))
	if contentType == "application/octet-stream" {
		ext := strings.ToLower(filepath.Ext(normalizedPath))
		for mimeType, canonicalExt := range CanonicalExtensionsByType {
			if canonicalExt == ext {
				return mimeType, nil
			}
		}
	}

	return contentType, nil
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
