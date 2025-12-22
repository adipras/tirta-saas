package controllers

import (
	"fmt"
	"net/http"
	"runtime"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetAuditLogs retrieves audit logs with filtering (Platform Owner only)
func GetAuditLogs(c *gin.Context) {
	var logs []models.AuditLog
	query := config.DB.Model(&models.AuditLog{})
	
	// Apply filters
	if tenantID := c.Query("tenant_id"); tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if action := c.Query("action"); action != "" {
		query = query.Where("action = ?", action)
	}
	
	if resource := c.Query("resource"); resource != "" {
		query = query.Where("resource = ?", resource)
	}
	
	if level := c.Query("level"); level != "" {
		query = query.Where("level = ?", level)
	}
	
	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	
	// Date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}
	
	// Pagination
	page := 1
	pageSize := 50
	if p := c.Query("page"); p != "" {
		var err error
		if _, err = uuid.Parse(p); err == nil {
			// If it's a valid UUID, don't treat as page number
		} else {
			// Try parsing as integer
			var pageNum int
			if _, err := fmt.Sscanf(p, "%d", &pageNum); err == nil {
				page = pageNum
			}
		}
	}
	
	if ps := c.Query("page_size"); ps != "" {
		var pageSizeNum int
		if _, err := fmt.Sscanf(ps, "%d", &pageSizeNum); err == nil && pageSizeNum > 0 && pageSizeNum <= 100 {
			pageSize = pageSizeNum
		}
	}
	
	// Count total
	var total int64
	query.Count(&total)
	
	// Get records
	offset := (page - 1) * pageSize
	query = query.Order("created_at DESC").Offset(offset).Limit(pageSize)
	
	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch audit logs",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Audit logs retrieved successfully",
		Data: map[string]interface{}{
			"logs": logs,
			"pagination": map[string]interface{}{
				"page":        page,
				"page_size":   pageSize,
				"total":       total,
				"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
			},
		},
	})
}

// GetErrorLogs retrieves error logs from audit logs (Platform Owner only)
func GetErrorLogs(c *gin.Context) {
	var logs []models.AuditLog
	query := config.DB.Model(&models.AuditLog{}).Where("success = ?", false)
	
	// Apply filters
	if tenantID := c.Query("tenant_id"); tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if level := c.Query("level"); level != "" {
		query = query.Where("level = ?", level)
	}
	
	// Date range
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}
	
	// Pagination
	page := 1
	pageSize := 50
	if p := c.Query("page"); p != "" {
		var pageNum int
		if _, err := fmt.Sscanf(p, "%d", &pageNum); err == nil && pageNum > 0 {
			page = pageNum
		}
	}
	
	if ps := c.Query("page_size"); ps != "" {
		var pageSizeNum int
		if _, err := fmt.Sscanf(ps, "%d", &pageSizeNum); err == nil && pageSizeNum > 0 && pageSizeNum <= 100 {
			pageSize = pageSizeNum
		}
	}
	
	// Count total
	var total int64
	query.Count(&total)
	
	// Get records
	offset := (page - 1) * pageSize
	query = query.Order("created_at DESC").Offset(offset).Limit(pageSize)
	
	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch error logs",
			Error:   err.Error(),
		})
		return
	}
	
	// Get error statistics
	var errorStats struct {
		TotalErrors      int64
		Last24Hours      int64
		Last7Days        int64
		CriticalErrors   int64
		MostCommonErrors []struct {
			Endpoint string
			Count    int64
		}
	}
	
	config.DB.Model(&models.AuditLog{}).Where("success = ?", false).Count(&errorStats.TotalErrors)
	config.DB.Model(&models.AuditLog{}).
		Where("success = ? AND created_at >= ?", false, time.Now().Add(-24*time.Hour)).
		Count(&errorStats.Last24Hours)
	config.DB.Model(&models.AuditLog{}).
		Where("success = ? AND created_at >= ?", false, time.Now().Add(-7*24*time.Hour)).
		Count(&errorStats.Last7Days)
	config.DB.Model(&models.AuditLog{}).
		Where("success = ? AND level = ?", false, "CRITICAL").
		Count(&errorStats.CriticalErrors)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Error logs retrieved successfully",
		Data: map[string]interface{}{
			"logs": logs,
			"pagination": map[string]interface{}{
				"page":        page,
				"page_size":   pageSize,
				"total":       total,
				"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
			},
			"statistics": errorStats,
		},
	})
}

// GetSystemHealth checks system health status (Platform Owner only)
func GetSystemHealth(c *gin.Context) {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"checks":    make(map[string]interface{}),
	}
	
	allHealthy := true
	
	// Database check
	dbHealth := map[string]interface{}{
		"status": "healthy",
	}
	
	sqlDB, err := config.DB.DB()
	if err != nil {
		dbHealth["status"] = "unhealthy"
		dbHealth["error"] = err.Error()
		allHealthy = false
	} else {
		if err := sqlDB.Ping(); err != nil {
			dbHealth["status"] = "unhealthy"
			dbHealth["error"] = "Database ping failed: " + err.Error()
			allHealthy = false
		} else {
			stats := sqlDB.Stats()
			dbHealth["open_connections"] = stats.OpenConnections
			dbHealth["in_use"] = stats.InUse
			dbHealth["idle"] = stats.Idle
			dbHealth["max_open_connections"] = stats.MaxOpenConnections
		}
	}
	health["checks"].(map[string]interface{})["database"] = dbHealth
	
	// Tenant count check
	var tenantCount int64
	if err := config.DB.Model(&models.Tenant{}).Count(&tenantCount).Error; err != nil {
		health["checks"].(map[string]interface{})["tenants"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
		allHealthy = false
	} else {
		health["checks"].(map[string]interface{})["tenants"] = map[string]interface{}{
			"status": "healthy",
			"count":  tenantCount,
		}
	}
	
	// Recent errors check
	var recentErrorCount int64
	config.DB.Model(&models.AuditLog{}).
		Where("success = ? AND created_at >= ?", false, time.Now().Add(-1*time.Hour)).
		Count(&recentErrorCount)
	
	errorHealth := map[string]interface{}{
		"status":              "healthy",
		"errors_last_hour":    recentErrorCount,
		"error_rate_percent":  0.0,
	}
	
	if recentErrorCount > 100 {
		errorHealth["status"] = "warning"
		errorHealth["message"] = "High error rate detected"
	}
	
	health["checks"].(map[string]interface{})["errors"] = errorHealth
	
	// Set overall status
	if !allHealthy {
		health["status"] = "unhealthy"
	} else if recentErrorCount > 100 {
		health["status"] = "degraded"
	}
	
	statusCode := http.StatusOK
	if health["status"] == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	} else if health["status"] == "degraded" {
		statusCode = http.StatusOK
	}
	
	c.JSON(statusCode, health)
}

// GetSystemMetrics retrieves system performance metrics (Platform Owner only)
func GetSystemMetrics(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Database statistics
	sqlDB, _ := config.DB.DB()
	dbStats := sqlDB.Stats()
	
	// Get request statistics from audit logs
	var totalRequests, successfulRequests, failedRequests int64
	var avgResponseTime float64
	
	// Last 24 hours
	last24h := time.Now().Add(-24 * time.Hour)
	config.DB.Model(&models.AuditLog{}).
		Where("created_at >= ?", last24h).
		Count(&totalRequests)
	
	config.DB.Model(&models.AuditLog{}).
		Where("created_at >= ? AND success = ?", last24h, true).
		Count(&successfulRequests)
	
	config.DB.Model(&models.AuditLog{}).
		Where("created_at >= ? AND success = ?", last24h, false).
		Count(&failedRequests)
	
	// Average response time
	var avgDuration struct {
		Avg float64
	}
	config.DB.Model(&models.AuditLog{}).
		Select("AVG(duration) as avg").
		Where("created_at >= ?", last24h).
		Scan(&avgDuration)
	avgResponseTime = avgDuration.Avg
	
	// Get active tenants
	var activeTenants int64
	config.DB.Model(&models.Tenant{}).Where("status = ?", "ACTIVE").Count(&activeTenants)
	
	// Get total users and customers
	var totalUsers, totalCustomers int64
	config.DB.Model(&models.User{}).Count(&totalUsers)
	config.DB.Model(&models.Customer{}).Count(&totalCustomers)
	
	// Calculate uptime (simplified - would need app start time tracking)
	uptime := time.Since(time.Now().Add(-24 * time.Hour)) // Placeholder
	
	// Top endpoints by usage
	type EndpointStat struct {
		Endpoint string
		Count    int64
		AvgTime  float64
	}
	var topEndpoints []EndpointStat
	config.DB.Model(&models.AuditLog{}).
		Select("endpoint, COUNT(*) as count, AVG(duration) as avg_time").
		Where("created_at >= ?", last24h).
		Group("endpoint").
		Order("count DESC").
		Limit(10).
		Scan(&topEndpoints)
	
	metrics := map[string]interface{}{
		"timestamp": time.Now(),
		"system": map[string]interface{}{
			"memory": map[string]interface{}{
				"alloc_mb":        float64(m.Alloc) / 1024 / 1024,
				"total_alloc_mb":  float64(m.TotalAlloc) / 1024 / 1024,
				"sys_mb":          float64(m.Sys) / 1024 / 1024,
				"num_gc":          m.NumGC,
				"goroutines":      runtime.NumGoroutine(),
			},
			"database": map[string]interface{}{
				"open_connections": dbStats.OpenConnections,
				"in_use":           dbStats.InUse,
				"idle":             dbStats.Idle,
				"max_open":         dbStats.MaxOpenConnections,
				"wait_count":       dbStats.WaitCount,
				"wait_duration_ms": dbStats.WaitDuration.Milliseconds(),
			},
		},
		"application": map[string]interface{}{
			"uptime_hours": uptime.Hours(),
			"active_tenants": activeTenants,
			"total_users": totalUsers,
			"total_customers": totalCustomers,
		},
		"requests_24h": map[string]interface{}{
			"total":             totalRequests,
			"successful":        successfulRequests,
			"failed":            failedRequests,
			"success_rate":      float64(successfulRequests) / float64(totalRequests) * 100,
			"avg_response_time": avgResponseTime,
		},
		"top_endpoints": topEndpoints,
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "System metrics retrieved successfully",
		Data:    metrics,
	})
}
