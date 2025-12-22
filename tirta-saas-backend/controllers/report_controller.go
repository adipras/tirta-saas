package controllers

import (
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"

	"github.com/gin-gonic/gin"
)

// GetRevenueReport godoc
// @Summary Get revenue report
// @Description Get revenue statistics and breakdown
// @Tags Reports
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/reports/revenue [get]
func GetRevenueReport(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date filters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// Default to current month if not specified
	if startDate == "" {
		startDate = time.Now().Format("2006-01-01")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	// Query total revenue from payments
	query := config.DB.Model(&models.Payment{})
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	query = query.Where("created_at BETWEEN ? AND ?", startDate, endDate)

	var totalRevenue float64
	var paymentCount int64
	
	query.Count(&paymentCount)
	query.Select("COALESCE(SUM(amount), 0)").Scan(&totalRevenue)

	// Get revenue by payment method
	var revenueByMethod []struct {
		PaymentMethod string  `json:"payment_method"`
		Total         float64 `json:"total"`
		Count         int64   `json:"count"`
	}
	
	methodQuery := config.DB.Model(&models.Payment{}).
		Select("payment_method, COALESCE(SUM(amount), 0) as total, COUNT(*) as count")
	
	if hasSpecificTenant {
		methodQuery = methodQuery.Where("tenant_id = ?", tenantID)
	}
	
	methodQuery.Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("payment_method").
		Scan(&revenueByMethod)

	c.JSON(http.StatusOK, gin.H{
		"total_revenue":       totalRevenue,
		"total_payments":      paymentCount,
		"revenue_by_method":   revenueByMethod,
		"period": gin.H{
			"start": startDate,
			"end":   endDate,
		},
	})
}

// GetCustomerReport godoc
// @Summary Get customer report
// @Description Get customer statistics and breakdown
// @Tags Reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/reports/customers [get]
func GetCustomerReport(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Total customers
	query := config.DB.Model(&models.Customer{})
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	var totalCustomers int64
	var activeCustomers int64
	var inactiveCustomers int64

	query.Count(&totalCustomers)
	
	activeQuery := config.DB.Model(&models.Customer{}).Where("is_active = ?", true)
	if hasSpecificTenant {
		activeQuery = activeQuery.Where("tenant_id = ?", tenantID)
	}
	activeQuery.Count(&activeCustomers)

	inactiveCustomers = totalCustomers - activeCustomers

	// Customers by subscription type
	var customersBySubscription []struct {
		SubscriptionID   string `json:"subscription_id"`
		SubscriptionName string `json:"subscription_name"`
		Count            int64  `json:"count"`
	}

	subQuery := config.DB.Model(&models.Customer{}).
		Select("customers.subscription_id, subscription_types.name as subscription_name, COUNT(*) as count").
		Joins("LEFT JOIN subscription_types ON customers.subscription_id = subscription_types.id")
	
	if hasSpecificTenant {
		subQuery = subQuery.Where("customers.tenant_id = ?", tenantID)
	}
	
	subQuery.Group("customers.subscription_id, subscription_types.name").
		Scan(&customersBySubscription)

	c.JSON(http.StatusOK, gin.H{
		"total_customers":          totalCustomers,
		"active_customers":         activeCustomers,
		"inactive_customers":       inactiveCustomers,
		"customers_by_subscription": customersBySubscription,
	})
}

// GetUsageReport godoc
// @Summary Get water usage report
// @Description Get water usage statistics
// @Tags Reports
// @Accept json
// @Produce json
// @Param month query string false "Month (YYYY-MM)"
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/reports/usage [get]
func GetUsageReport(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Default to current month
	month := c.Query("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	query := config.DB.Model(&models.WaterUsage{})
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	query = query.Where("usage_month = ?", month)

	var totalUsage float64
	var recordCount int64
	var avgUsage float64

	query.Count(&recordCount)
	query.Select("COALESCE(SUM(usage_m3), 0)").Scan(&totalUsage)
	
	if recordCount > 0 {
		avgUsage = totalUsage / float64(recordCount)
	}

	c.JSON(http.StatusOK, gin.H{
		"total_usage_m3":    totalUsage,
		"total_records":     recordCount,
		"average_usage_m3":  avgUsage,
		"month":             month,
	})
}

// GetPaymentReport godoc
// @Summary Get payment report
// @Description Get payment statistics and trends
// @Tags Reports
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/reports/payments [get]
func GetPaymentReport(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date filters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" {
		startDate = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	query := config.DB.Model(&models.Payment{})
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	query = query.Where("created_at BETWEEN ? AND ?", startDate, endDate)

	var totalAmount float64
	var paymentCount int64

	query.Count(&paymentCount)
	query.Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount)

	// Get daily payment trends
	var dailyPayments []struct {
		Date  string  `json:"date"`
		Total float64 `json:"total"`
		Count int64   `json:"count"`
	}

	trendQuery := config.DB.Model(&models.Payment{}).
		Select("DATE(created_at) as date, COALESCE(SUM(amount), 0) as total, COUNT(*) as count")
	
	if hasSpecificTenant {
		trendQuery = trendQuery.Where("tenant_id = ?", tenantID)
	}
	
	trendQuery.Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&dailyPayments)

	c.JSON(http.StatusOK, gin.H{
		"total_amount":    totalAmount,
		"total_payments":  paymentCount,
		"daily_trends":    dailyPayments,
		"period": gin.H{
			"start": startDate,
			"end":   endDate,
		},
	})
}

// GetOutstandingReport godoc
// @Summary Get outstanding invoices report
// @Description Get statistics on unpaid invoices
// @Tags Reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /api/reports/outstanding [get]
func GetOutstandingReport(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := config.DB.Model(&models.Invoice{}).Where("is_paid = ?", false)
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	var totalOutstanding float64
	var invoiceCount int64

	query.Count(&invoiceCount)
	query.Select("COALESCE(SUM(total_amount - total_paid), 0)").Scan(&totalOutstanding)

	// Get oldest unpaid invoices
	var oldestInvoices []struct {
		InvoiceID   string    `json:"invoice_id"`
		CustomerID  string    `json:"customer_id"`
		TotalAmount float64   `json:"total_amount"`
		TotalPaid   float64   `json:"total_paid"`
		Outstanding float64   `json:"outstanding"`
		CreatedAt   time.Time `json:"created_at"`
	}

	oldestQuery := config.DB.Model(&models.Invoice{}).
		Select("id as invoice_id, customer_id, total_amount, total_paid, (total_amount - total_paid) as outstanding, created_at").
		Where("is_paid = ?", false)
	
	if hasSpecificTenant {
		oldestQuery = oldestQuery.Where("tenant_id = ?", tenantID)
	}
	
	oldestQuery.Order("created_at ASC").
		Limit(10).
		Scan(&oldestInvoices)

	c.JSON(http.StatusOK, gin.H{
		"total_outstanding": totalOutstanding,
		"unpaid_count":      invoiceCount,
		"oldest_invoices":   oldestInvoices,
	})
}
