package middleware

import (
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/adipras/tirta-saas-backend/pkg/logger"
	"github.com/adipras/tirta-saas-backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RateLimiter represents a rate limiter with configurable limits
type RateLimiter struct {
	requests map[string]*RequestCounter
	mutex    sync.RWMutex
	
	// Rate limit configurations
	DefaultLimit    int           // requests per window
	DefaultWindow   time.Duration // time window
	AdminLimit      int           // higher limit for admins
	CustomerLimit   int           // limit for customers
	TenantLimit     int           // per-tenant limit
	CleanupInterval time.Duration // how often to clean expired entries
}

// RequestCounter tracks requests for a specific key
type RequestCounter struct {
	Count      int
	WindowStart time.Time
	LastRequest time.Time
}

// RateLimitConfig holds rate limiting configuration
type RateLimitConfig struct {
	DefaultLimit    int           `json:"default_limit"`
	DefaultWindow   time.Duration `json:"default_window"`
	AdminLimit      int           `json:"admin_limit"`
	CustomerLimit   int           `json:"customer_limit"`
	TenantLimit     int           `json:"tenant_limit"`
	CleanupInterval time.Duration `json:"cleanup_interval"`
}

// NewRateLimiter creates a new rate limiter with default configuration
func NewRateLimiter() *RateLimiter {
	config := DefaultRateLimitConfig()
	
	rl := &RateLimiter{
		requests:        make(map[string]*RequestCounter),
		DefaultLimit:    config.DefaultLimit,
		DefaultWindow:   config.DefaultWindow,
		AdminLimit:      config.AdminLimit,
		CustomerLimit:   config.CustomerLimit,
		TenantLimit:     config.TenantLimit,
		CleanupInterval: config.CleanupInterval,
	}
	
	// Start cleanup goroutine
	go rl.startCleanup()
	
	return rl
}

// DefaultRateLimitConfig returns default rate limiting configuration
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		DefaultLimit:    100,                // 100 requests
		DefaultWindow:   time.Minute,        // per minute
		AdminLimit:      1000,               // 1000 requests per minute for admins
		CustomerLimit:   50,                 // 50 requests per minute for customers
		TenantLimit:     5000,               // 5000 requests per minute per tenant
		CleanupInterval: 5 * time.Minute,    // cleanup every 5 minutes
	}
}

// IsAllowed checks if a request is allowed based on rate limits
func (rl *RateLimiter) IsAllowed(key string, limit int) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()
	
	now := time.Now()
	
	counter, exists := rl.requests[key]
	if !exists {
		// First request for this key
		rl.requests[key] = &RequestCounter{
			Count:       1,
			WindowStart: now,
			LastRequest: now,
		}
		return true
	}
	
	// Check if we need to reset the window
	if now.Sub(counter.WindowStart) >= rl.DefaultWindow {
		counter.Count = 1
		counter.WindowStart = now
		counter.LastRequest = now
		return true
	}
	
	// Update last request time
	counter.LastRequest = now
	
	// Check if limit is exceeded
	if counter.Count >= limit {
		return false
	}
	
	// Increment counter
	counter.Count++
	return true
}

// GetRequestCount returns current request count for a key
func (rl *RateLimiter) GetRequestCount(key string) int {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()
	
	counter, exists := rl.requests[key]
	if !exists {
		return 0
	}
	
	// Check if window has expired
	if time.Since(counter.WindowStart) >= rl.DefaultWindow {
		return 0
	}
	
	return counter.Count
}

// GetTimeUntilReset returns time until rate limit resets
func (rl *RateLimiter) GetTimeUntilReset(key string) time.Duration {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()
	
	counter, exists := rl.requests[key]
	if !exists {
		return 0
	}
	
	elapsed := time.Since(counter.WindowStart)
	if elapsed >= rl.DefaultWindow {
		return 0
	}
	
	return rl.DefaultWindow - elapsed
}

// startCleanup runs periodic cleanup of expired entries
func (rl *RateLimiter) startCleanup() {
	ticker := time.NewTicker(rl.CleanupInterval)
	defer ticker.Stop()
	
	for range ticker.C {
		rl.cleanup()
	}
}

// cleanup removes expired entries from the rate limiter
func (rl *RateLimiter) cleanup() {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()
	
	now := time.Now()
	expiredKeys := make([]string, 0)
	
	for key, counter := range rl.requests {
		// Remove entries that haven't been accessed for 2x the cleanup interval
		if now.Sub(counter.LastRequest) > 2*rl.CleanupInterval {
			expiredKeys = append(expiredKeys, key)
		}
	}
	
	for _, key := range expiredKeys {
		delete(rl.requests, key)
	}
	
	if len(expiredKeys) > 0 {
		logger.Debug("Rate limiter cleanup completed", map[string]interface{}{
			"expired_entries": len(expiredKeys),
			"total_entries":   len(rl.requests),
		})
	}
}

// Global rate limiter instance
var globalRateLimiter *RateLimiter

func init() {
	globalRateLimiter = NewRateLimiter()
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip rate limiting for health checks
		if c.Request.URL.Path == "/health" || c.Request.URL.Path == "/ready" {
			c.Next()
			return
		}
		
		// Determine rate limit based on user type and context
		limit := globalRateLimiter.DefaultLimit
		keys := make([]string, 0)
		
		// Get IP-based key (fallback)
		ipKey := "ip:" + c.ClientIP()
		keys = append(keys, ipKey)
		
		// Get user-specific keys if authenticated
		if tenantID, exists := c.Get("tenant_id"); exists {
			if tid, ok := tenantID.(uuid.UUID); ok {
				tenantKey := "tenant:" + tid.String()
				keys = append(keys, tenantKey)
				
				// Apply tenant-specific limit
				if !globalRateLimiter.IsAllowed(tenantKey, globalRateLimiter.TenantLimit) {
					handleRateLimitExceeded(c, tenantKey, globalRateLimiter.TenantLimit, "tenant")
					return
				}
			}
		}
		
		if userID, exists := c.Get("user_id"); exists {
			if uid, ok := userID.(uuid.UUID); ok {
				userKey := "user:" + uid.String()
				keys = append(keys, userKey)
				limit = globalRateLimiter.AdminLimit
			}
		}
		
		if customerID, exists := c.Get("customer_id"); exists {
			if cid, ok := customerID.(uuid.UUID); ok {
				customerKey := "customer:" + cid.String()
				keys = append(keys, customerKey)
				limit = globalRateLimiter.CustomerLimit
			}
		}
		
		// Check rate limit for the most specific key
		primaryKey := keys[len(keys)-1] // Use the most specific key
		
		if !globalRateLimiter.IsAllowed(primaryKey, limit) {
			userType := "user"
			if _, exists := c.Get("customer_id"); exists {
				userType = "customer"
			}
			handleRateLimitExceeded(c, primaryKey, limit, userType)
			return
		}
		
		// Add rate limit headers
		addRateLimitHeaders(c, primaryKey, limit)
		
		c.Next()
	}
}

// IPRateLimitMiddleware creates an IP-based rate limiting middleware
func IPRateLimitMiddleware(limit int) gin.HandlerFunc {
	return func(c *gin.Context) {
		ipKey := "ip:" + c.ClientIP()
		
		if !globalRateLimiter.IsAllowed(ipKey, limit) {
			handleRateLimitExceeded(c, ipKey, limit, "ip")
			return
		}
		
		addRateLimitHeaders(c, ipKey, limit)
		c.Next()
	}
}

// EndpointRateLimitMiddleware creates endpoint-specific rate limiting
func EndpointRateLimitMiddleware(endpoint string, limit int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create compound key with user and endpoint
		var key string
		
		if userID, exists := c.Get("user_id"); exists {
			if uid, ok := userID.(uuid.UUID); ok {
				key = fmt.Sprintf("user:%s:endpoint:%s", uid.String(), endpoint)
			}
		} else if customerID, exists := c.Get("customer_id"); exists {
			if cid, ok := customerID.(uuid.UUID); ok {
				key = fmt.Sprintf("customer:%s:endpoint:%s", cid.String(), endpoint)
			}
		} else {
			key = fmt.Sprintf("ip:%s:endpoint:%s", c.ClientIP(), endpoint)
		}
		
		if !globalRateLimiter.IsAllowed(key, limit) {
			handleRateLimitExceeded(c, key, limit, "endpoint")
			return
		}
		
		addRateLimitHeaders(c, key, limit)
		c.Next()
	}
}

// handleRateLimitExceeded handles rate limit exceeded scenarios
func handleRateLimitExceeded(c *gin.Context, key string, limit int, limitType string) {
	resetTime := globalRateLimiter.GetTimeUntilReset(key)
	
	// Log rate limit violation
	logger.Warn("Rate limit exceeded", map[string]interface{}{
		"key":        key,
		"limit":      limit,
		"limit_type": limitType,
		"method":     c.Request.Method,
		"path":       c.Request.URL.Path,
		"ip":         c.ClientIP(),
		"user_agent": c.Request.UserAgent(),
		"reset_in":   resetTime.String(),
	})
	
	// Log security event for potential abuse
	if limitType == "ip" {
		logger.LogSecurityEvent("rate_limit_exceeded", 
			fmt.Sprintf("IP %s exceeded rate limit", c.ClientIP()), 
			"medium", map[string]interface{}{
				"ip":     c.ClientIP(),
				"limit":  limit,
				"method": c.Request.Method,
				"path":   c.Request.URL.Path,
			})
	}
	
	// Add rate limit headers
	c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
	c.Header("X-RateLimit-Remaining", "0")
	c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(resetTime).Unix(), 10))
	c.Header("Retry-After", strconv.FormatInt(int64(resetTime.Seconds()), 10))
	
	response.TooManyRequests(c, "Rate limit exceeded. Please try again later.", map[string]interface{}{
		"limit":       limit,
		"reset_in":    resetTime.String(),
		"limit_type":  limitType,
	})
	c.Abort()
}

// addRateLimitHeaders adds rate limit information to response headers
func addRateLimitHeaders(c *gin.Context, key string, limit int) {
	remaining := limit - globalRateLimiter.GetRequestCount(key)
	if remaining < 0 {
		remaining = 0
	}
	
	resetTime := globalRateLimiter.GetTimeUntilReset(key)
	
	c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
	c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
	c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(resetTime).Unix(), 10))
}

// AuthenticationRateLimitMiddleware applies stricter limits to auth endpoints
func AuthenticationRateLimitMiddleware() gin.HandlerFunc {
	return IPRateLimitMiddleware(10) // Only 10 auth attempts per minute per IP
}

// PaymentRateLimitMiddleware applies stricter limits to payment endpoints
func PaymentRateLimitMiddleware() gin.HandlerFunc {
	return EndpointRateLimitMiddleware("payment", 5) // Only 5 payments per minute
}