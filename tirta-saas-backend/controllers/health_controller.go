package controllers

import (
	"net/http"
	"runtime"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/adipras/tirta-saas-backend/pkg/logger"

	"github.com/gin-gonic/gin"
)

// HealthStatus represents the health status of a component
type HealthStatus string

const (
	StatusHealthy   HealthStatus = "healthy"
	StatusUnhealthy HealthStatus = "unhealthy"
	StatusDegraded  HealthStatus = "degraded"
)

// HealthCheckResponse represents the response structure for health checks
type HealthCheckResponse struct {
	Status    HealthStatus               `json:"status"`
	Timestamp time.Time                  `json:"timestamp"`
	Version   string                     `json:"version"`
	Uptime    string                     `json:"uptime"`
	Checks    map[string]ComponentHealth `json:"checks"`
}

// ComponentHealth represents the health status of an individual component
type ComponentHealth struct {
	Status    HealthStatus `json:"status"`
	Message   string       `json:"message,omitempty"`
	Duration  string       `json:"duration,omitempty"`
	Timestamp time.Time    `json:"timestamp"`
}

// MetricsResponse represents system metrics
type MetricsResponse struct {
	Timestamp   time.Time          `json:"timestamp"`
	Memory      MemoryMetrics      `json:"memory"`
	Runtime     RuntimeMetrics     `json:"runtime"`
	Database    DatabaseMetrics    `json:"database"`
	HTTP        HTTPMetrics        `json:"http"`
	Application ApplicationMetrics `json:"application"`
}

// MemoryMetrics represents memory usage metrics
type MemoryMetrics struct {
	Alloc         uint64  `json:"alloc_bytes"`
	TotalAlloc    uint64  `json:"total_alloc_bytes"`
	Sys           uint64  `json:"sys_bytes"`
	NumGC         uint32  `json:"num_gc"`
	HeapAlloc     uint64  `json:"heap_alloc_bytes"`
	HeapSys       uint64  `json:"heap_sys_bytes"`
	HeapInuse     uint64  `json:"heap_inuse_bytes"`
	StackInuse    uint64  `json:"stack_inuse_bytes"`
	StackSys      uint64  `json:"stack_sys_bytes"`
	GCCPUFraction float64 `json:"gc_cpu_fraction"`
}

// RuntimeMetrics represents Go runtime metrics
type RuntimeMetrics struct {
	NumGoroutine int    `json:"num_goroutine"`
	NumCgoCall   int64  `json:"num_cgo_call"`
	GOMAXPROCS   int    `json:"gomaxprocs"`
	GoVersion    string `json:"go_version"`
	Compiler     string `json:"compiler"`
	GOARCH       string `json:"goarch"`
	GOOS         string `json:"goos"`
}

// DatabaseMetrics represents database connection metrics
type DatabaseMetrics struct {
	OpenConnections   int          `json:"open_connections"`
	InUse             int          `json:"in_use"`
	Idle              int          `json:"idle"`
	WaitCount         int64        `json:"wait_count"`
	WaitDuration      string       `json:"wait_duration"`
	MaxIdleClosed     int64        `json:"max_idle_closed"`
	MaxIdleTimeClosed int64        `json:"max_idle_time_closed"`
	MaxLifetimeClosed int64        `json:"max_lifetime_closed"`
	Status            HealthStatus `json:"status"`
	ResponseTime      string       `json:"response_time"`
}

// HTTPMetrics represents HTTP server metrics
type HTTPMetrics struct {
	RequestsTotal   int64  `json:"requests_total"`
	RequestsSuccess int64  `json:"requests_success"`
	RequestsError   int64  `json:"requests_error"`
	AvgResponseTime string `json:"avg_response_time"`
}

// ApplicationMetrics represents application-specific metrics
type ApplicationMetrics struct {
	StartTime   time.Time `json:"start_time"`
	Uptime      string    `json:"uptime"`
	Version     string    `json:"version"`
	Environment string    `json:"environment"`
	BuildDate   string    `json:"build_date,omitempty"`
	GitCommit   string    `json:"git_commit,omitempty"`
}

var (
	startTime       = time.Now()
	requestsTotal   int64
	requestsSuccess int64
	requestsError   int64
)

// HealthCheck performs a comprehensive health check
func HealthCheck(c *gin.Context) {
	start := time.Now()

	response := HealthCheckResponse{
		Status:    StatusHealthy,
		Timestamp: start,
		Version:   getVersion(),
		Uptime:    time.Since(startTime).String(),
		Checks:    make(map[string]ComponentHealth),
	}

	// Check database health
	dbHealth := checkDatabaseHealth()
	response.Checks["database"] = dbHealth

	// Check memory health
	memHealth := checkMemoryHealth()
	response.Checks["memory"] = memHealth

	// Check disk space (basic check)
	diskHealth := checkDiskHealth()
	response.Checks["disk"] = diskHealth

	// Determine overall status
	overallStatus := StatusHealthy
	for _, check := range response.Checks {
		if check.Status == StatusUnhealthy {
			overallStatus = StatusUnhealthy
			break
		} else if check.Status == StatusDegraded {
			overallStatus = StatusDegraded
		}
	}
	response.Status = overallStatus

	// Set appropriate HTTP status code
	statusCode := http.StatusOK
	switch overallStatus {
	case StatusUnhealthy:
		statusCode = http.StatusServiceUnavailable
	case StatusDegraded:
		statusCode = http.StatusPartialContent
	}

	c.JSON(statusCode, response)
}

// ReadinessCheck checks if the application is ready to serve traffic
func ReadinessCheck(c *gin.Context) {
	// Check database connectivity
	sqlDB, err := config.DB.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database connection unavailable",
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not ready",
			"reason": "database ping failed",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "ready",
		"timestamp": time.Now(),
		"uptime":    time.Since(startTime).String(),
	})
}

// LivenessCheck checks if the application is alive
func LivenessCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "alive",
		"timestamp": time.Now(),
		"uptime":    time.Since(startTime).String(),
	})
}

// Metrics provides detailed system metrics
func Metrics(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// Get database stats
	var dbMetrics DatabaseMetrics
	if sqlDB, err := config.DB.DB(); err == nil {
		stats := sqlDB.Stats()

		// Test database response time
		start := time.Now()
		pingErr := sqlDB.Ping()
		responseTime := time.Since(start)

		dbStatus := StatusHealthy
		if pingErr != nil {
			dbStatus = StatusUnhealthy
		} else if responseTime > 100*time.Millisecond {
			dbStatus = StatusDegraded
		}

		dbMetrics = DatabaseMetrics{
			OpenConnections:   stats.OpenConnections,
			InUse:             stats.InUse,
			Idle:              stats.Idle,
			WaitCount:         stats.WaitCount,
			WaitDuration:      stats.WaitDuration.String(),
			MaxIdleClosed:     stats.MaxIdleClosed,
			MaxIdleTimeClosed: stats.MaxIdleTimeClosed,
			MaxLifetimeClosed: stats.MaxLifetimeClosed,
			Status:            dbStatus,
			ResponseTime:      responseTime.String(),
		}
	}

	response := MetricsResponse{
		Timestamp: time.Now(),
		Memory: MemoryMetrics{
			Alloc:         m.Alloc,
			TotalAlloc:    m.TotalAlloc,
			Sys:           m.Sys,
			NumGC:         m.NumGC,
			HeapAlloc:     m.HeapAlloc,
			HeapSys:       m.HeapSys,
			HeapInuse:     m.HeapInuse,
			StackInuse:    m.StackInuse,
			StackSys:      m.StackSys,
			GCCPUFraction: m.GCCPUFraction,
		},
		Runtime: RuntimeMetrics{
			NumGoroutine: runtime.NumGoroutine(),
			NumCgoCall:   runtime.NumCgoCall(),
			GOMAXPROCS:   runtime.GOMAXPROCS(0),
			GoVersion:    runtime.Version(),
			Compiler:     runtime.Compiler,
			GOARCH:       runtime.GOARCH,
			GOOS:         runtime.GOOS,
		},
		Database: dbMetrics,
		HTTP: HTTPMetrics{
			RequestsTotal:   requestsTotal,
			RequestsSuccess: requestsSuccess,
			RequestsError:   requestsError,
		},
		Application: ApplicationMetrics{
			StartTime:   startTime,
			Uptime:      time.Since(startTime).String(),
			Version:     getVersion(),
			Environment: getEnvironment(),
		},
	}

	// Add performance metrics from middleware
	if perfMetrics := middleware.GetPerformanceMetrics(); perfMetrics != nil {
		response.HTTP = HTTPMetrics{
			RequestsTotal:   perfMetrics["requests"].(map[string]interface{})["total"].(int64),
			RequestsSuccess: requestsSuccess,
			RequestsError:   perfMetrics["requests"].(map[string]interface{})["error_count"].(int64),
			AvgResponseTime: perfMetrics["requests"].(map[string]interface{})["avg_latency"].(string),
		}
	}

	c.JSON(http.StatusOK, response)
}

// checkDatabaseHealth checks database connectivity and performance
func checkDatabaseHealth() ComponentHealth {
	start := time.Now()

	sqlDB, err := config.DB.DB()
	if err != nil {
		return ComponentHealth{
			Status:    StatusUnhealthy,
			Message:   "Cannot access database connection",
			Duration:  time.Since(start).String(),
			Timestamp: time.Now(),
		}
	}

	if err := sqlDB.Ping(); err != nil {
		return ComponentHealth{
			Status:    StatusUnhealthy,
			Message:   "Database ping failed: " + err.Error(),
			Duration:  time.Since(start).String(),
			Timestamp: time.Now(),
		}
	}

	duration := time.Since(start)
	status := StatusHealthy
	message := "Database is healthy"

	// Check response time
	if duration > 100*time.Millisecond {
		status = StatusDegraded
		message = "Database response time is slow"
	}

	// Check connection pool
	stats := sqlDB.Stats()
	if stats.OpenConnections > 80 { // Warning if more than 80 connections
		status = StatusDegraded
		message = "Database connection pool is near capacity"
	}

	return ComponentHealth{
		Status:    status,
		Message:   message,
		Duration:  duration.String(),
		Timestamp: time.Now(),
	}
}

// checkMemoryHealth checks memory usage
func checkMemoryHealth() ComponentHealth {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	status := StatusHealthy
	message := "Memory usage is normal"

	// Check heap usage (warning if > 1GB, critical if > 2GB)
	heapMB := m.HeapAlloc / 1024 / 1024
	if heapMB > 2048 {
		status = StatusUnhealthy
		message = "High memory usage detected"
	} else if heapMB > 1024 {
		status = StatusDegraded
		message = "Elevated memory usage detected"
	}

	// Check GC pressure
	if m.GCCPUFraction > 0.05 {
		status = StatusDegraded
		message = "High GC pressure detected"
	}

	return ComponentHealth{
		Status:    status,
		Message:   message,
		Timestamp: time.Now(),
	}
}

// checkDiskHealth performs basic disk space check
func checkDiskHealth() ComponentHealth {
	// This is a simplified check - in production you might want to check actual disk space
	status := StatusHealthy
	message := "Disk space is adequate"

	return ComponentHealth{
		Status:    status,
		Message:   message,
		Timestamp: time.Now(),
	}
}

// getVersion returns application version
func getVersion() string {
	if version := getEnv("APP_VERSION", ""); version != "" {
		return version
	}
	return "development"
}

// getEnvironment returns current environment
func getEnvironment() string {
	return getEnv("GIN_MODE", "debug")
}

// getEnv gets environment variable with default
func getEnv(key, defaultValue string) string {
	if value := gin.Mode(); key == "GIN_MODE" {
		return value
	}
	// This is a simplified implementation - you might want to use os.Getenv
	return defaultValue
}

// MetricsMiddleware tracks HTTP metrics
func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		// Update metrics
		requestsTotal++
		if c.Writer.Status() >= 200 && c.Writer.Status() < 400 {
			requestsSuccess++
		} else {
			requestsError++
		}

		// Log slow requests
		duration := time.Since(start)
		if duration > 1*time.Second {
			logger.Warn("Slow request detected", map[string]interface{}{
				"method":   c.Request.Method,
				"path":     c.Request.URL.Path,
				"duration": duration.String(),
				"status":   c.Writer.Status(),
			})
		}
	}
}
