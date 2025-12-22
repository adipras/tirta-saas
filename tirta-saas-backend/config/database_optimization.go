package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/adipras/tirta-saas-backend/pkg/logger"

	"gorm.io/gorm"
)

// DatabaseConfig holds database optimization configuration
type DatabaseConfig struct {
	MaxOpenConns    int           `json:"max_open_conns"`
	MaxIdleConns    int           `json:"max_idle_conns"`
	ConnMaxLifetime time.Duration `json:"conn_max_lifetime"`
	ConnMaxIdleTime time.Duration `json:"conn_max_idle_time"`
	EnableLogging   bool          `json:"enable_logging"`
	SlowThreshold   time.Duration `json:"slow_threshold"`
}

// GetDatabaseConfig returns database configuration from environment variables
func GetDatabaseConfig() DatabaseConfig {
	config := DatabaseConfig{
		MaxOpenConns:    100,              // Default: 100 connections
		MaxIdleConns:    10,               // Default: 10 idle connections
		ConnMaxLifetime: 1 * time.Hour,    // Default: 1 hour
		ConnMaxIdleTime: 10 * time.Minute, // Default: 10 minutes
		EnableLogging:   true,             // Default: enable logging
		SlowThreshold:   200 * time.Millisecond, // Default: 200ms
	}

	// Override with environment variables if set
	if maxOpen := os.Getenv("DB_MAX_OPEN_CONNS"); maxOpen != "" {
		if val, err := strconv.Atoi(maxOpen); err == nil {
			config.MaxOpenConns = val
		}
	}

	if maxIdle := os.Getenv("DB_MAX_IDLE_CONNS"); maxIdle != "" {
		if val, err := strconv.Atoi(maxIdle); err == nil {
			config.MaxIdleConns = val
		}
	}

	if lifetime := os.Getenv("DB_CONN_MAX_LIFETIME"); lifetime != "" {
		if val, err := time.ParseDuration(lifetime); err == nil {
			config.ConnMaxLifetime = val
		}
	}

	if idleTime := os.Getenv("DB_CONN_MAX_IDLE_TIME"); idleTime != "" {
		if val, err := time.ParseDuration(idleTime); err == nil {
			config.ConnMaxIdleTime = val
		}
	}

	if logging := os.Getenv("DB_ENABLE_LOGGING"); logging != "" {
		if val, err := strconv.ParseBool(logging); err == nil {
			config.EnableLogging = val
		}
	}

	if threshold := os.Getenv("DB_SLOW_THRESHOLD"); threshold != "" {
		if val, err := time.ParseDuration(threshold); err == nil {
			config.SlowThreshold = val
		}
	}

	return config
}

// OptimizeDatabase applies database optimizations
func OptimizeDatabase(db *gorm.DB) error {
	config := GetDatabaseConfig()

	// Get underlying SQL database
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying SQL database: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	logger.Info("Database connection pool configured", map[string]interface{}{
		"max_open_conns":     config.MaxOpenConns,
		"max_idle_conns":     config.MaxIdleConns,
		"conn_max_lifetime":  config.ConnMaxLifetime.String(),
		"conn_max_idle_time": config.ConnMaxIdleTime.String(),
	})

	// Create database indexes for performance
	if err := createIndexes(db); err != nil {
		logger.Error("Failed to create database indexes", err)
		return err
	}

	// Optimize MySQL specific settings
	if err := optimizeMySQLSettings(db); err != nil {
		logger.Error("Failed to optimize MySQL settings", err)
		return err
	}

	return nil
}

// createIndexes creates database indexes for better performance
func createIndexes(db *gorm.DB) error {
	logger.Info("Creating database indexes for performance optimization")

	indexes := []struct {
		table   string
		columns []string
		name    string
	}{
		// Tenant-based indexes (most important for multi-tenant performance)
		{"users", []string{"tenant_id"}, "idx_users_tenant_id"},
		{"customers", []string{"tenant_id"}, "idx_customers_tenant_id"},
		{"subscription_types", []string{"tenant_id"}, "idx_subscription_types_tenant_id"},
		{"water_rates", []string{"tenant_id"}, "idx_water_rates_tenant_id"},
		{"water_usages", []string{"tenant_id"}, "idx_water_usages_tenant_id"},
		{"invoices", []string{"tenant_id"}, "idx_invoices_tenant_id"},
		{"payments", []string{"tenant_id"}, "idx_payments_tenant_id"},

		// Customer-based indexes
		{"customers", []string{"tenant_id", "customer_id"}, "idx_customers_tenant_customer"},
		{"customers", []string{"tenant_id", "email"}, "idx_customers_tenant_email"},
		{"customers", []string{"tenant_id", "is_active"}, "idx_customers_tenant_active"},

		// Invoice-related indexes
		{"invoices", []string{"customer_id"}, "idx_invoices_customer_id"},
		{"invoices", []string{"tenant_id", "customer_id"}, "idx_invoices_tenant_customer"},
		{"invoices", []string{"tenant_id", "is_paid"}, "idx_invoices_tenant_paid"},
		{"invoices", []string{"tenant_id", "type"}, "idx_invoices_tenant_type"},
		{"invoices", []string{"tenant_id", "usage_month"}, "idx_invoices_tenant_month"},

		// Payment-related indexes
		{"payments", []string{"invoice_id"}, "idx_payments_invoice_id"},
		{"payments", []string{"tenant_id", "created_at"}, "idx_payments_tenant_created"},

		// Water usage indexes
		{"water_usages", []string{"customer_id"}, "idx_water_usages_customer_id"},
		{"water_usages", []string{"tenant_id", "customer_id"}, "idx_water_usages_tenant_customer"},
		{"water_usages", []string{"tenant_id", "usage_month"}, "idx_water_usages_tenant_month"},

		// Water rate indexes
		{"water_rates", []string{"subscription_id"}, "idx_water_rates_subscription_id"},
		{"water_rates", []string{"tenant_id", "active"}, "idx_water_rates_tenant_active"},
		{"water_rates", []string{"tenant_id", "effective_date"}, "idx_water_rates_tenant_date"},

		// Authentication indexes
		{"users", []string{"email"}, "idx_users_email"},
		{"customers", []string{"email"}, "idx_customers_email"},

		// Timestamp indexes for audit and reporting
		{"users", []string{"created_at"}, "idx_users_created_at"},
		{"customers", []string{"created_at"}, "idx_customers_created_at"},
		{"invoices", []string{"created_at"}, "idx_invoices_created_at"},
		{"payments", []string{"created_at"}, "idx_payments_created_at"},
	}

	for _, idx := range indexes {
		if err := createIndex(db, idx.table, idx.columns, idx.name); err != nil {
			logger.Error("Failed to create index", err, map[string]interface{}{
				"table":   idx.table,
				"columns": idx.columns,
				"name":    idx.name,
			})
			// Continue with other indexes even if one fails
		} else {
			logger.Debug("Created index", map[string]interface{}{
				"table":   idx.table,
				"columns": idx.columns,
				"name":    idx.name,
			})
		}
	}

	return nil
}

// createIndex creates a single database index
func createIndex(db *gorm.DB, table string, columns []string, indexName string) error {
	// Check if index already exists
	var count int64
	query := `SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
			  WHERE TABLE_SCHEMA = DATABASE() 
			  AND TABLE_NAME = ? 
			  AND INDEX_NAME = ?`

	if err := db.Raw(query, table, indexName).Scan(&count).Error; err != nil {
		return fmt.Errorf("failed to check if index exists: %w", err)
	}

	if count > 0 {
		// Index already exists
		return nil
	}

	// Create the index
	columnList := "`" + columns[0] + "`"
	for _, col := range columns[1:] {
		columnList += ", `" + col + "`"
	}

	indexSQL := fmt.Sprintf("CREATE INDEX `%s` ON `%s` (%s)", indexName, table, columnList)

	if err := db.Exec(indexSQL).Error; err != nil {
		return fmt.Errorf("failed to create index %s: %w", indexName, err)
	}

	return nil
}

// optimizeMySQLSettings applies MySQL-specific optimizations
func optimizeMySQLSettings(db *gorm.DB) error {
	logger.Info("Applying MySQL optimization settings")

	// MySQL optimization queries
	optimizations := []string{
		// Enable query cache (if not disabled by default)
		"SET SESSION query_cache_type = ON",
		
		// Optimize for faster reads
		"SET SESSION transaction_isolation = 'READ-COMMITTED'",
		
		// Optimize sort buffer
		"SET SESSION sort_buffer_size = 2097152", // 2MB
		
		// Optimize join buffer
		"SET SESSION join_buffer_size = 262144", // 256KB
	}

	for _, query := range optimizations {
		if err := db.Exec(query).Error; err != nil {
			logger.Warn("Failed to execute MySQL optimization", map[string]interface{}{
				"query": query,
				"error": err.Error(),
			})
			// Continue with other optimizations
		}
	}

	return nil
}

// DatabaseHealthCheck performs basic database health checks
func DatabaseHealthCheck(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying database: %w", err)
	}

	// Check database connectivity
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	// Get database stats
	stats := sqlDB.Stats()
	logger.Info("Database connection pool stats", map[string]interface{}{
		"open_connections":     stats.OpenConnections,
		"in_use":              stats.InUse,
		"idle":                stats.Idle,
		"wait_count":          stats.WaitCount,
		"wait_duration":       stats.WaitDuration.String(),
		"max_idle_closed":     stats.MaxIdleClosed,
		"max_idle_time_closed": stats.MaxIdleTimeClosed,
		"max_lifetime_closed": stats.MaxLifetimeClosed,
	})

	// Warn if connection pool is under stress
	if stats.WaitCount > 100 {
		logger.Warn("High database connection wait count detected", map[string]interface{}{
			"wait_count":    stats.WaitCount,
			"wait_duration": stats.WaitDuration.String(),
		})
	}

	if float64(stats.InUse)/float64(stats.OpenConnections) > 0.8 {
		logger.Warn("High database connection usage detected", map[string]interface{}{
			"usage_ratio":      float64(stats.InUse) / float64(stats.OpenConnections),
			"in_use":           stats.InUse,
			"open_connections": stats.OpenConnections,
		})
	}

	return nil
}

// AnalyzeQueryPerformance analyzes slow queries and suggests optimizations
func AnalyzeQueryPerformance(db *gorm.DB) {
	// Check for slow queries
	var slowQueries []struct {
		Query     string  `gorm:"column:sql_text"`
		ExecCount int     `gorm:"column:exec_count"`
		AvgTime   float64 `gorm:"column:avg_timer_wait"`
		MaxTime   float64 `gorm:"column:max_timer_wait"`
	}

	query := `
		SELECT 
			SUBSTR(digest_text, 1, 100) as sql_text,
			count_star as exec_count,
			avg_timer_wait / 1000000000 as avg_timer_wait,
			max_timer_wait / 1000000000 as max_timer_wait
		FROM performance_schema.events_statements_summary_by_digest 
		WHERE avg_timer_wait > 200000000  -- queries slower than 200ms
		ORDER BY avg_timer_wait DESC 
		LIMIT 10
	`

	if err := db.Raw(query).Scan(&slowQueries).Error; err != nil {
		logger.Debug("Could not analyze query performance (performance_schema may not be available)")
		return
	}

	if len(slowQueries) > 0 {
		logger.Warn("Slow queries detected", map[string]interface{}{
			"slow_query_count": len(slowQueries),
			"queries":          slowQueries,
		})
	} else {
		logger.Info("No slow queries detected")
	}
}

// OptimizeForReporting creates additional indexes optimized for reporting queries
func OptimizeForReporting(db *gorm.DB) error {
	logger.Info("Creating reporting-optimized indexes")

	reportingIndexes := []struct {
		table   string
		columns []string
		name    string
	}{
		// Revenue reporting indexes
		{"payments", []string{"tenant_id", "created_at", "amount"}, "idx_payments_revenue_report"},
		{"invoices", []string{"tenant_id", "created_at", "total_amount", "is_paid"}, "idx_invoices_revenue_report"},

		// Usage analytics indexes
		{"water_usages", []string{"tenant_id", "usage_month", "usage_m3"}, "idx_water_usage_analytics"},
		{"water_usages", []string{"customer_id", "usage_month", "usage_m3"}, "idx_customer_usage_analytics"},

		// Customer analytics indexes
		{"customers", []string{"tenant_id", "subscription_id", "is_active", "created_at"}, "idx_customer_analytics"},

		// Subscription performance indexes
		{"customers", []string{"subscription_id", "is_active"}, "idx_subscription_performance"},
	}

	for _, idx := range reportingIndexes {
		if err := createIndex(db, idx.table, idx.columns, idx.name); err != nil {
			logger.Error("Failed to create reporting index", err, map[string]interface{}{
				"table":   idx.table,
				"columns": idx.columns,
				"name":    idx.name,
			})
		}
	}

	return nil
}