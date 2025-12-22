package middleware

import (
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/pkg/logger"
	"github.com/adipras/tirta-saas-backend/pkg/response"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SecurityConfig holds security middleware configuration
type SecurityConfig struct {
	EnableCORS           bool
	AllowedOrigins       []string
	AllowedMethods       []string
	AllowedHeaders       []string
	ExposeHeaders        []string
	AllowCredentials     bool
	MaxAge               time.Duration
	ContentSecurityPolicy string
	EnableHSTS           bool
	HSTSMaxAge           int
	EnableXSSProtection  bool
	EnableFrameOptions   bool
	EnableContentTypeNoSniff bool
	EnableReferrerPolicy bool
	TrustedProxies       []string
}

// DefaultSecurityConfig returns default security configuration
func DefaultSecurityConfig() SecurityConfig {
	return SecurityConfig{
		EnableCORS: true,
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:3001", 
			"https://localhost:3000",
			"https://localhost:3001",
			// Add your frontend domains here
		},
		AllowedMethods: []string{
			"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD",
		},
		AllowedHeaders: []string{
			"Origin", "Content-Length", "Content-Type", "Authorization",
			"X-Requested-With", "Accept", "Accept-Encoding", "X-CSRF-Token",
		},
		ExposeHeaders: []string{
			"X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset",
		},
		AllowCredentials:     true,
		MaxAge:               12 * time.Hour,
		ContentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
		EnableHSTS:           true,
		HSTSMaxAge:           31536000, // 1 year
		EnableXSSProtection:  true,
		EnableFrameOptions:   true,
		EnableContentTypeNoSniff: true,
		EnableReferrerPolicy: true,
		TrustedProxies: []string{
			"127.0.0.1",
			"::1",
		},
	}
}

// CORSMiddleware sets up CORS with security considerations
func CORSMiddleware() gin.HandlerFunc {
	// For development, use a simple configuration that allows all origins
	if gin.Mode() != gin.ReleaseMode {
		return cors.New(cors.Config{
			AllowAllOrigins:  true,
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
			AllowHeaders:     []string{"*"},
			ExposeHeaders:    []string{"Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"},
			AllowCredentials: false,
			MaxAge:           12 * time.Hour,
		})
	}
	
	// Production configuration
	config := DefaultSecurityConfig()
	
	// Add frontend URL from environment if available
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		config.AllowedOrigins = append(config.AllowedOrigins, frontendURL)
	}
	
	return cors.New(cors.Config{
		AllowOrigins:     config.AllowedOrigins,
		AllowMethods:     config.AllowedMethods,
		AllowHeaders:     config.AllowedHeaders,
		ExposeHeaders:    config.ExposeHeaders,
		AllowCredentials: config.AllowCredentials,
		MaxAge:           config.MaxAge,
	})
}

// SecurityHeadersMiddleware adds security headers to all responses
func SecurityHeadersMiddleware() gin.HandlerFunc {
	config := DefaultSecurityConfig()
	
	return func(c *gin.Context) {
		// Content Security Policy
		if config.ContentSecurityPolicy != "" {
			c.Header("Content-Security-Policy", config.ContentSecurityPolicy)
		}
		
		// HTTP Strict Transport Security (HSTS)
		if config.EnableHSTS && c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", 
				fmt.Sprintf("max-age=%d; includeSubDomains; preload", config.HSTSMaxAge))
		}
		
		// X-XSS-Protection
		if config.EnableXSSProtection {
			c.Header("X-XSS-Protection", "1; mode=block")
		}
		
		// X-Frame-Options
		if config.EnableFrameOptions {
			c.Header("X-Frame-Options", "DENY")
		}
		
		// X-Content-Type-Options
		if config.EnableContentTypeNoSniff {
			c.Header("X-Content-Type-Options", "nosniff")
		}
		
		// Referrer-Policy
		if config.EnableReferrerPolicy {
			c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		}
		
		// Additional security headers
		c.Header("X-Permitted-Cross-Domain-Policies", "none")
		c.Header("X-Download-Options", "noopen")
		c.Header("X-DNS-Prefetch-Control", "off")
		
		// Remove server information
		c.Header("Server", "")
		
		c.Next()
	}
}

// AdvancedInputSanitizationMiddleware sanitizes input data to prevent XSS and injection attacks
func AdvancedInputSanitizationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Limit request body size (already implemented in validation.go but adding here for completeness)
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20) // 10MB
		
		// Sanitize query parameters
		sanitizeQueryParams(c)
		
		// Sanitize headers
		sanitizeHeaders(c)
		
		c.Next()
	}
}

// sanitizeQueryParams removes potentially dangerous content from query parameters
func sanitizeQueryParams(c *gin.Context) {
	query := c.Request.URL.Query()
	modified := false
	
	for key, values := range query {
		for i, value := range values {
			sanitized := sanitizeString(value)
			if sanitized != value {
				query[key][i] = sanitized
				modified = true
				
				logger.LogSecurityEvent("query_param_sanitized",
					"Potentially malicious content detected in query parameter",
					"low", map[string]interface{}{
						"parameter": key,
						"original":  value,
						"sanitized": sanitized,
						"ip":        c.ClientIP(),
						"path":      c.Request.URL.Path,
					})
			}
		}
	}
	
	if modified {
		c.Request.URL.RawQuery = query.Encode()
	}
}

// sanitizeHeaders removes potentially dangerous content from headers
func sanitizeHeaders(c *gin.Context) {
	dangerousHeaders := []string{
		"X-Original-Url", "X-Rewrite-Url", "X-Forwarded-Host",
		"X-Host", "X-Real-IP", "X-Forwarded-For",
	}
	
	for _, header := range dangerousHeaders {
		if value := c.GetHeader(header); value != "" {
			// Log potential header injection attempt
			logger.LogSecurityEvent("suspicious_header",
				"Potentially malicious header detected",
				"medium", map[string]interface{}{
					"header": header,
					"value":  value,
					"ip":     c.ClientIP(),
					"path":   c.Request.URL.Path,
				})
		}
	}
}

// sanitizeString removes potentially dangerous content from strings
func sanitizeString(input string) string {
	// Remove potentially dangerous characters and patterns
	patterns := []string{
		`<script[^>]*>.*?</script>`,
		`<iframe[^>]*>.*?</iframe>`,
		`<object[^>]*>.*?</object>`,
		`<embed[^>]*>.*?</embed>`,
		`<link[^>]*>`,
		`<meta[^>]*>`,
		`javascript:`,
		`vbscript:`,
		`data:text/html`,
		`onload=`,
		`onerror=`,
		`onclick=`,
		`onmouseover=`,
	}
	
	result := input
	for _, pattern := range patterns {
		re := regexp.MustCompile(`(?i)` + pattern)
		result = re.ReplaceAllString(result, "")
	}
	
	// Remove null bytes and other control characters
	result = strings.ReplaceAll(result, "\x00", "")
	result = regexp.MustCompile(`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`).ReplaceAllString(result, "")
	
	return strings.TrimSpace(result)
}

// SQLInjectionProtectionMiddleware detects potential SQL injection attempts
func SQLInjectionProtectionMiddleware() gin.HandlerFunc {
	// Common SQL injection patterns
	sqlPatterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)(union\s+select)`),
		regexp.MustCompile(`(?i)(drop\s+table)`),
		regexp.MustCompile(`(?i)(delete\s+from)`),
		regexp.MustCompile(`(?i)(insert\s+into)`),
		regexp.MustCompile(`(?i)(update\s+.*set)`),
		regexp.MustCompile(`(?i)(exec\s*\()`),
		regexp.MustCompile(`(?i)(script\s*>)`),
		regexp.MustCompile(`(?i)('.*or.*'.*=.*')`),
		regexp.MustCompile(`(?i)(1=1)`),
		regexp.MustCompile(`(?i)(1\s*=\s*1)`),
		regexp.MustCompile(`(?i)('\s*or\s*'1'\s*=\s*'1)`),
	}
	
	return func(c *gin.Context) {
		// Check query parameters
		for key, values := range c.Request.URL.Query() {
			for _, value := range values {
				if containsSQLInjection(value, sqlPatterns) {
					logger.LogSecurityEvent("sql_injection_attempt",
						"Potential SQL injection detected in query parameter",
						"high", map[string]interface{}{
							"parameter": key,
							"value":     value,
							"ip":        c.ClientIP(),
							"path":      c.Request.URL.Path,
							"method":    c.Request.Method,
							"user_agent": c.Request.UserAgent(),
						})
					
					response.BadRequest(c, "Invalid request parameters")
					c.Abort()
					return
				}
			}
		}
		
		c.Next()
	}
}

// containsSQLInjection checks if a string contains SQL injection patterns
func containsSQLInjection(input string, patterns []*regexp.Regexp) bool {
	for _, pattern := range patterns {
		if pattern.MatchString(input) {
			return true
		}
	}
	return false
}

// RequestSizeMiddleware limits request size to prevent DoS attacks
func RequestSizeMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			logger.LogSecurityEvent("request_size_exceeded",
				"Request size limit exceeded",
				"medium", map[string]interface{}{
					"content_length": c.Request.ContentLength,
					"max_size":       maxSize,
					"ip":             c.ClientIP(),
					"path":           c.Request.URL.Path,
				})
			
			response.BadRequest(c, "Request too large")
			c.Abort()
			return
		}
		
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)
		c.Next()
	}
}

// UserAgentValidationMiddleware validates and logs suspicious user agents
func UserAgentValidationMiddleware() gin.HandlerFunc {
	suspiciousPatterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)(sqlmap|havij|nmap|nikto|w3af|acunetix|netsparker|burp)`),
		regexp.MustCompile(`(?i)(python-requests|curl|wget)`),
		regexp.MustCompile(`(?i)(bot|crawler|spider|scraper)`),
		regexp.MustCompile(`^$`), // Empty user agent
	}
	
	return func(c *gin.Context) {
		userAgent := c.Request.UserAgent()
		
		for _, pattern := range suspiciousPatterns {
			if pattern.MatchString(userAgent) {
				logger.LogSecurityEvent("suspicious_user_agent",
					"Suspicious user agent detected",
					"low", map[string]interface{}{
						"user_agent": userAgent,
						"ip":         c.ClientIP(),
						"path":       c.Request.URL.Path,
						"method":     c.Request.Method,
					})
				break
			}
		}
		
		c.Next()
	}
}

// GeolocationSecurityMiddleware (placeholder for geolocation-based security)
func GeolocationSecurityMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// In a real implementation, you might:
		// 1. Check IP against geolocation database
		// 2. Block requests from suspicious countries
		// 3. Log unusual geographical access patterns
		// 4. Implement geofencing for sensitive operations
		
		c.Next()
	}
}

