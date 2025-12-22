package middleware

import (
	"context"
	"time"

	"github.com/adipras/tirta-saas-backend/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type contextKey string

const RequestIDKey contextKey = "request_id"

// RequestTracingMiddleware adds request ID and tracing to all requests
func RequestTracingMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		start := time.Now()

		// Generate unique request ID
		requestID := uuid.New().String()

		// Add to context
		c.Set(string(RequestIDKey), requestID)
		ctx := context.WithValue(c.Request.Context(), RequestIDKey, requestID)
		c.Request = c.Request.WithContext(ctx)

		// Add to response headers for debugging
		c.Header("X-Request-ID", requestID)

		// Log request start
		logger.Info("Request started", map[string]interface{}{
			"request_id": requestID,
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"user_agent": c.Request.Header.Get("User-Agent"),
			"ip":         c.ClientIP(),
		})

		// Process request
		c.Next()

		// Log request completion
		duration := time.Since(start)
		logger.Info("Request completed", map[string]interface{}{
			"request_id": requestID,
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"status":     c.Writer.Status(),
			"duration":   duration.String(),
			"size":       c.Writer.Size(),
		})

		// Log slow requests
		if duration > 1*time.Second {
			logger.Warn("Slow request detected", map[string]interface{}{
				"request_id": requestID,
				"method":     c.Request.Method,
				"path":       c.Request.URL.Path,
				"duration":   duration.String(),
			})
		}
	})
}

// GetRequestID returns the request ID from context
func GetRequestID(c *gin.Context) string {
	if requestID, exists := c.Get(string(RequestIDKey)); exists {
		return requestID.(string)
	}
	return ""
}
