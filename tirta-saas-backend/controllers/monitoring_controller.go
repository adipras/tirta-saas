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
	"gorm.io/gorm"
	"github.com/google/uuid"
)

type platformSystemAlert struct {
	Code       string   `json:"code"`
	Severity   string   `json:"severity"`
	Title      string   `json:"title"`
	Message    string   `json:"message"`
	Source     string   `json:"source"`
	ObservedAt string   `json:"observed_at"`
	Value      *float64 `json:"value,omitempty"`
	Threshold  *float64 `json:"threshold,omitempty"`
}

func calculatePercentage(part, total int64) float64 {
	if total <= 0 {
		return 0
	}

	return float64(part) / float64(total) * 100
}

func newFloat64Ptr(value float64) *float64 {
	return &value
}

func appendPlatformAlert(
	alerts *[]platformSystemAlert,
	severity string,
	code string,
	title string,
	message string,
	source string,
	observedAt time.Time,
	value *float64,
	threshold *float64,
) {
	*alerts = append(*alerts, platformSystemAlert{
		Code:       code,
		Severity:   severity,
		Title:      title,
		Message:    message,
		Source:     source,
		ObservedAt: observedAt.Format(time.RFC3339),
		Value:      value,
		Threshold:  threshold,
	})
}

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
	query.Session(&gorm.Session{}).Count(&total)

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
	query.Session(&gorm.Session{}).Count(&total)

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
	var recentRequestCount int64
	config.DB.Model(&models.AuditLog{}).
		Where("success = ? AND created_at >= ?", false, time.Now().Add(-1*time.Hour)).
		Count(&recentErrorCount)
	config.DB.Model(&models.AuditLog{}).
		Where("created_at >= ?", time.Now().Add(-1*time.Hour)).
		Count(&recentRequestCount)

	errorRatePercent := calculatePercentage(recentErrorCount, recentRequestCount)

	errorHealth := map[string]interface{}{
		"status":             "healthy",
		"errors_last_hour":   recentErrorCount,
		"requests_last_hour": recentRequestCount,
		"error_rate_percent": errorRatePercent,
	}

	if recentErrorCount > 100 || errorRatePercent >= 5 {
		errorHealth["status"] = "warning"
		errorHealth["message"] = "High error rate detected"
	}

	health["checks"].(map[string]interface{})["errors"] = errorHealth

	// Set overall status
	if !allHealthy {
		health["status"] = "unhealthy"
	} else if recentErrorCount > 100 || errorRatePercent >= 5 {
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
	sqlDB, err := config.DB.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to read database metrics",
			Error:   err.Error(),
		})
		return
	}

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

	uptime := time.Since(startTime)
	successRate := calculatePercentage(successfulRequests, totalRequests)
	errorRate := calculatePercentage(failedRequests, totalRequests)

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
				"alloc_mb":       float64(m.Alloc) / 1024 / 1024,
				"total_alloc_mb": float64(m.TotalAlloc) / 1024 / 1024,
				"sys_mb":         float64(m.Sys) / 1024 / 1024,
				"num_gc":         m.NumGC,
				"goroutines":     runtime.NumGoroutine(),
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
			"uptime_hours":    uptime.Hours(),
			"active_tenants":  activeTenants,
			"total_users":     totalUsers,
			"total_customers": totalCustomers,
		},
		"requests_24h": map[string]interface{}{
			"total":             totalRequests,
			"successful":        successfulRequests,
			"failed":            failedRequests,
			"success_rate":      successRate,
			"error_rate":        errorRate,
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

// GetSystemAlerts derives operational alerts from current runtime and recent audit/error trends.
func GetSystemAlerts(c *gin.Context) {
	now := time.Now()
	alerts := make([]platformSystemAlert, 0)

	sqlDB, err := config.DB.DB()
	if err != nil {
		appendPlatformAlert(
			&alerts,
			"critical",
			"database-unavailable",
			"Database tidak tersedia",
			"Gagal membaca koneksi database utama aplikasi.",
			"database",
			now,
			nil,
			nil,
		)
	} else {
		if err := sqlDB.Ping(); err != nil {
			appendPlatformAlert(
				&alerts,
				"critical",
				"database-ping-failed",
				"Ping database gagal",
				"Runtime tidak bisa menjangkau database. Cek koneksi MySQL dan kredensial runtime.",
				"database",
				now,
				nil,
				nil,
			)
		}

		stats := sqlDB.Stats()
		if stats.MaxOpenConnections > 0 {
			usageRatio := float64(stats.InUse) / float64(stats.MaxOpenConnections) * 100
			switch {
			case usageRatio >= 95:
				appendPlatformAlert(
					&alerts,
					"critical",
					"database-pool-critical",
					"Pool koneksi database hampir habis",
					"Sebagian besar koneksi database sedang terpakai. Risiko antrean request meningkat.",
					"database",
					now,
					newFloat64Ptr(usageRatio),
					newFloat64Ptr(95),
				)
			case usageRatio >= 80:
				appendPlatformAlert(
					&alerts,
					"warning",
					"database-pool-high",
					"Utilisasi pool database tinggi",
					"Koneksi database aktif mendekati batas maksimum. Pantau beban query dan kapasitas pool.",
					"database",
					now,
					newFloat64Ptr(usageRatio),
					newFloat64Ptr(80),
				)
			}
		}

		if stats.WaitCount >= 100 {
			appendPlatformAlert(
				&alerts,
				"warning",
				"database-wait-queue",
				"Antrean koneksi database meningkat",
				"Terjadi penantian koneksi database yang cukup sering. Periksa query lambat atau ukuran pool.",
				"database",
				now,
				newFloat64Ptr(float64(stats.WaitCount)),
				newFloat64Ptr(100),
			)
		}
	}

	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)
	allocMB := float64(mem.Alloc) / 1024 / 1024
	switch {
	case allocMB >= 1024:
		appendPlatformAlert(
			&alerts,
			"critical",
			"memory-critical",
			"Memori aplikasi sangat tinggi",
			"Pemakaian memori aktif runtime sudah melewati ambang kritis. Investigasi potensi leak atau lonjakan traffic.",
			"runtime",
			now,
			newFloat64Ptr(allocMB),
			newFloat64Ptr(1024),
		)
	case allocMB >= 512:
		appendPlatformAlert(
			&alerts,
			"warning",
			"memory-high",
			"Memori aplikasi tinggi",
			"Pemakaian memori runtime sudah cukup tinggi dan perlu dipantau sebelum memicu tekanan resource.",
			"runtime",
			now,
			newFloat64Ptr(allocMB),
			newFloat64Ptr(512),
		)
	}

	goroutines := float64(runtime.NumGoroutine())
	switch {
	case goroutines >= 500:
		appendPlatformAlert(
			&alerts,
			"critical",
			"goroutines-critical",
			"Goroutine runtime melonjak",
			"Jumlah goroutine aktif sudah sangat tinggi. Periksa worker, request yang menggantung, atau retry loop.",
			"runtime",
			now,
			newFloat64Ptr(goroutines),
			newFloat64Ptr(500),
		)
	case goroutines >= 200:
		appendPlatformAlert(
			&alerts,
			"warning",
			"goroutines-high",
			"Goroutine runtime tinggi",
			"Jumlah goroutine aktif meningkat signifikan dan perlu dipantau agar tidak menjadi bottleneck.",
			"runtime",
			now,
			newFloat64Ptr(goroutines),
			newFloat64Ptr(200),
		)
	}

	var recentErrorCount int64
	var recentRequestCount int64
	var criticalErrors24h int64
	config.DB.Model(&models.AuditLog{}).
		Where("success = ? AND created_at >= ?", false, now.Add(-1*time.Hour)).
		Count(&recentErrorCount)
	config.DB.Model(&models.AuditLog{}).
		Where("created_at >= ?", now.Add(-1*time.Hour)).
		Count(&recentRequestCount)
	config.DB.Model(&models.AuditLog{}).
		Where("success = ? AND level = ? AND created_at >= ?", false, "CRITICAL", now.Add(-24*time.Hour)).
		Count(&criticalErrors24h)

	errorRatePercent := calculatePercentage(recentErrorCount, recentRequestCount)
	switch {
	case recentErrorCount >= 100 || errorRatePercent >= 10:
		appendPlatformAlert(
			&alerts,
			"critical",
			"error-rate-critical",
			"Error rate kritis",
			"Lonjakan error dalam 1 jam terakhir sudah masuk level kritis dan berisiko mengganggu tenant aktif.",
			"audit_log",
			now,
			newFloat64Ptr(errorRatePercent),
			newFloat64Ptr(10),
		)
	case recentErrorCount >= 25 || errorRatePercent >= 5:
		appendPlatformAlert(
			&alerts,
			"warning",
			"error-rate-high",
			"Error rate meningkat",
			"Error aplikasi dalam 1 jam terakhir melewati ambang warning. Prioritaskan endpoint gagal dan penyebab utamanya.",
			"audit_log",
			now,
			newFloat64Ptr(errorRatePercent),
			newFloat64Ptr(5),
		)
	}

	switch {
	case criticalErrors24h >= 5:
		appendPlatformAlert(
			&alerts,
			"critical",
			"critical-errors-recurring",
			"Error kritis berulang dalam 24 jam",
			"Terdapat beberapa error level critical dalam 24 jam terakhir. Investigasi akar masalah dan siapkan mitigasi operasional.",
			"audit_log",
			now,
			newFloat64Ptr(float64(criticalErrors24h)),
			newFloat64Ptr(5),
		)
	case criticalErrors24h > 0:
		appendPlatformAlert(
			&alerts,
			"warning",
			"critical-errors-detected",
			"Error kritis terdeteksi",
			"Setidaknya ada satu error level critical dalam 24 jam terakhir yang perlu ditinjau.",
			"audit_log",
			now,
			newFloat64Ptr(float64(criticalErrors24h)),
			newFloat64Ptr(1),
		)
	}

	if len(alerts) == 0 {
		appendPlatformAlert(
			&alerts,
			"info",
			"system-stable",
			"Tidak ada alert aktif",
			"Belum ada sinyal alerting yang melewati ambang observability saat ini.",
			"system",
			now,
			nil,
			nil,
		)
	}

	summary := map[string]int{
		"critical": 0,
		"warning":  0,
		"info":     0,
	}
	for _, alert := range alerts {
		summary[alert.Severity]++
	}

	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "System alerts retrieved successfully",
		Data: map[string]interface{}{
			"timestamp": now,
			"summary":   summary,
			"alerts":    alerts,
		},
	})
}
