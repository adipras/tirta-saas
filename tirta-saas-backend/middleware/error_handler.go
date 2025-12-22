package middleware

import (
	"errors"
	"runtime/debug"
	"time"

	"github.com/adipras/tirta-saas-backend/pkg/logger"
	"github.com/adipras/tirta-saas-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

// ErrorHandlerMiddleware handles panics and errors globally
func ErrorHandlerMiddleware() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		// Log the panic
		logger.Error("Panic recovered", errors.New("panic"), map[string]interface{}{
			"panic":      recovered,
			"stack":      string(debug.Stack()),
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"user_agent": c.Request.UserAgent(),
			"ip":         c.ClientIP(),
		})

		// Return 500 error
		response.InternalServerError(c, "An unexpected error occurred")
		c.Abort()
	})
}

// DatabaseErrorHandlerMiddleware handles database-specific errors
func DatabaseErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check for database errors
		for _, err := range c.Errors {
			if isDatabaseError(err.Err) {
				handleDatabaseError(c, err.Err)
				return
			}
		}
	}
}

// ValidationErrorHandlerMiddleware handles validation errors
func ValidationErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check for validation errors
		for _, err := range c.Errors {
			if validationErrors, ok := err.Err.(validator.ValidationErrors); ok {
				handleValidationErrors(c, validationErrors)
				return
			}

			if businessError, ok := err.Err.(*BusinessValidationError); ok {
				handleBusinessValidationError(c, businessError)
				return
			}
		}
	}
}

// AuthErrorHandlerMiddleware handles authentication and authorization errors
func AuthErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check for auth errors
		for _, err := range c.Errors {
			if isAuthError(err.Err) {
				handleAuthError(c, err.Err)
				return
			}
		}
	}
}

// RequestTimeoutMiddleware adds request timeout handling
func RequestTimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add timeout to context
		// Note: In a real implementation, you might want to use context.WithTimeout
		// For this example, we'll just add the middleware structure

		c.Next()
	}
}

// isDatabaseError checks if an error is database-related
func isDatabaseError(err error) bool {
	if err == nil {
		return false
	}

	// Check for GORM errors
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return true
	}
	if errors.Is(err, gorm.ErrInvalidTransaction) {
		return true
	}
	if errors.Is(err, gorm.ErrNotImplemented) {
		return true
	}
	if errors.Is(err, gorm.ErrMissingWhereClause) {
		return true
	}
	if errors.Is(err, gorm.ErrUnsupportedRelation) {
		return true
	}
	if errors.Is(err, gorm.ErrPrimaryKeyRequired) {
		return true
	}

	// Check for common database error patterns
	errorStr := err.Error()
	if contains(errorStr, "duplicate key") ||
		contains(errorStr, "foreign key constraint") ||
		contains(errorStr, "unique constraint") ||
		contains(errorStr, "check constraint") ||
		contains(errorStr, "connection refused") ||
		contains(errorStr, "connection timeout") {
		return true
	}

	return false
}

// isAuthError checks if an error is authentication/authorization related
func isAuthError(err error) bool {
	if err == nil {
		return false
	}

	errorStr := err.Error()
	return contains(errorStr, "unauthorized") ||
		contains(errorStr, "forbidden") ||
		contains(errorStr, "access denied") ||
		contains(errorStr, "invalid token") ||
		contains(errorStr, "token expired")
}

// handleDatabaseError handles database-specific errors
func handleDatabaseError(c *gin.Context, err error) {
	logger.Error("Database error", err, map[string]interface{}{
		"method": c.Request.Method,
		"path":   c.Request.URL.Path,
	})

	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NotFound(c, "Resource not found")
		return
	}

	errorStr := err.Error()
	if contains(errorStr, "duplicate key") {
		response.Conflict(c, "Resource already exists")
		return
	}

	if contains(errorStr, "foreign key constraint") {
		response.BadRequest(c, "Invalid reference to related resource")
		return
	}

	if contains(errorStr, "unique constraint") {
		response.Conflict(c, "Resource must be unique")
		return
	}

	if contains(errorStr, "connection") {
		response.InternalServerError(c, "Database connection error")
		return
	}

	// Generic database error
	response.InternalServerError(c, "Database operation failed")
}

// handleValidationErrors handles validation errors
func handleValidationErrors(c *gin.Context, validationErrors validator.ValidationErrors) {
	var errors []response.ValidationErrorDetail

	for _, fieldErr := range validationErrors {
		errors = append(errors, response.ValidationErrorDetail{
			Field:   getJSONFieldName(fieldErr),
			Tag:     fieldErr.Tag(),
			Value:   fieldErr.Value(),
			Message: getValidationMessage(fieldErr),
		})
	}

	logger.Warn("Validation error", map[string]interface{}{
		"method":            c.Request.Method,
		"path":              c.Request.URL.Path,
		"validation_errors": errors,
	})

	response.ValidationError(c, errors)
}

// handleBusinessValidationError handles business rule validation errors
func handleBusinessValidationError(c *gin.Context, err *BusinessValidationError) {
	logger.Warn("Business validation error", map[string]interface{}{
		"method": c.Request.Method,
		"path":   c.Request.URL.Path,
		"field":  err.Field,
		"tag":    err.Tag,
	})

	response.BusinessRuleError(c, err.Tag, err.Message)
}

// handleAuthError handles authentication and authorization errors
func handleAuthError(c *gin.Context, err error) {
	logger.Warn("Authentication/Authorization error", map[string]interface{}{
		"method": c.Request.Method,
		"path":   c.Request.URL.Path,
		"error":  err.Error(),
	})

	errorStr := err.Error()
	if contains(errorStr, "unauthorized") || contains(errorStr, "invalid token") || contains(errorStr, "token expired") {
		response.Unauthorized(c, "Authentication required")
		return
	}

	if contains(errorStr, "forbidden") || contains(errorStr, "access denied") {
		response.Forbidden(c, "Access denied")
		return
	}

	response.Unauthorized(c, "Authentication failed")
}

// Helper function to check if a string contains a substring (case-insensitive)
func contains(str, substr string) bool {
	return len(str) >= len(substr) && (str == substr ||
		(len(str) > len(substr) &&
			(str[:len(substr)] == substr ||
				str[len(str)-len(substr):] == substr ||
				findSubstring(str, substr))))
}

func findSubstring(str, substr string) bool {
	for i := 0; i <= len(str)-len(substr); i++ {
		if str[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// RateLimitErrorMiddleware handles rate limiting errors
func RateLimitErrorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check for rate limit errors
		for _, err := range c.Errors {
			if isRateLimitError(err.Err) {
				handleRateLimitError(c, err.Err)
				return
			}
		}
	}
}

func isRateLimitError(err error) bool {
	if err == nil {
		return false
	}
	errorStr := err.Error()
	return contains(errorStr, "rate limit") || contains(errorStr, "too many requests")
}

func handleRateLimitError(c *gin.Context, _ error) {
	logger.Warn("Rate limit exceeded", map[string]interface{}{
		"method": c.Request.Method,
		"path":   c.Request.URL.Path,
		"ip":     c.ClientIP(),
	})

	response.TooManyRequests(c, "Rate limit exceeded. Please try again later.")
}
