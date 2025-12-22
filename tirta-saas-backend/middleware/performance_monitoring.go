package middleware

import (
	"runtime"
	"sync"
	"time"

	"github.com/adipras/tirta-saas-backend/pkg/logger"
	"github.com/gin-gonic/gin"
)

var (
	requestMetrics = struct {
		sync.RWMutex
		TotalRequests   int64
		ActiveRequests  int64
		AverageLatency  time.Duration
		latencySum      time.Duration
		ErrorCount      int64
		SlowRequestCount int64
	}{}
)

// PerformanceMonitoringMiddleware tracks performance metrics
func PerformanceMonitoringMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		start := time.Now()
		
		// Increment active requests
		requestMetrics.Lock()
		requestMetrics.ActiveRequests++
		requestMetrics.TotalRequests++
		requestMetrics.Unlock()
		
		// Process request
		c.Next()
		
		// Calculate metrics
		duration := time.Since(start)
		
		requestMetrics.Lock()
		requestMetrics.ActiveRequests--
		requestMetrics.latencySum += duration
		requestMetrics.AverageLatency = requestMetrics.latencySum / time.Duration(requestMetrics.TotalRequests)
		
		// Track errors
		if c.Writer.Status() >= 400 {
			requestMetrics.ErrorCount++
		}
		
		// Track slow requests
		if duration > 1*time.Second {
			requestMetrics.SlowRequestCount++
		}
		requestMetrics.Unlock()
		
		// Log performance warnings
		if duration > 2*time.Second {
			logger.Error("Very slow request", nil, map[string]interface{}{
				"request_id": GetRequestID(c),
				"method":     c.Request.Method,
				"path":       c.Request.URL.Path,
				"duration":   duration.String(),
				"status":     c.Writer.Status(),
			})
		}
	})
}

// GetPerformanceMetrics returns current performance metrics
func GetPerformanceMetrics() map[string]interface{} {
	requestMetrics.RLock()
	defer requestMetrics.RUnlock()
	
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	
	return map[string]interface{}{
		"requests": map[string]interface{}{
			"total":        requestMetrics.TotalRequests,
			"active":       requestMetrics.ActiveRequests,
			"avg_latency":  requestMetrics.AverageLatency.String(),
			"error_count":  requestMetrics.ErrorCount,
			"slow_count":   requestMetrics.SlowRequestCount,
		},
		"memory": map[string]interface{}{
			"alloc_mb":      float64(memStats.Alloc) / 1024 / 1024,
			"total_alloc_mb": float64(memStats.TotalAlloc) / 1024 / 1024,
			"sys_mb":        float64(memStats.Sys) / 1024 / 1024,
			"num_gc":        memStats.NumGC,
		},
		"runtime": map[string]interface{}{
			"goroutines": runtime.NumGoroutine(),
			"cpus":       runtime.NumCPU(),
		},
	}
}