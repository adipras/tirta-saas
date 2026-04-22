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

	startTime, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format start_date tidak valid"})
		return
	}

	endTime, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format end_date tidak valid"})
		return
	}

	endExclusive := endTime.AddDate(0, 0, 1)

	// Query total revenue from paid payments in the selected period
	totalQuery := config.DB.Model(&models.Payment{}).
		Where("paid_at >= ? AND paid_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		totalQuery = totalQuery.Where("tenant_id = ?", tenantID)
	}

	var totalRevenue float64
	var paymentCount int64

	totalQuery.Count(&paymentCount)
	totalQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalRevenue)

	var monthlyRevenueRows []struct {
		Year     int     `json:"year"`
		Month    int     `json:"month"`
		Revenue  float64 `json:"revenue"`
		Invoices int64   `json:"invoices"`
	}

	monthlyQuery := config.DB.Model(&models.Payment{}).
		Select(`
			YEAR(paid_at) as year,
			MONTH(paid_at) as month,
			COALESCE(SUM(amount), 0) as revenue,
			COUNT(*) as invoices
		`).
		Where("paid_at >= ? AND paid_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		monthlyQuery = monthlyQuery.Where("tenant_id = ?", tenantID)
	}

	monthlyQuery.
		Group("YEAR(paid_at), MONTH(paid_at)").
		Order("YEAR(paid_at), MONTH(paid_at)").
		Scan(&monthlyRevenueRows)

	monthlyRevenue := make([]gin.H, 0, len(monthlyRevenueRows))
	for _, row := range monthlyRevenueRows {
		monthName := time.Month(row.Month).String()
		monthlyRevenue = append(monthlyRevenue, gin.H{
			"month":    monthName,
			"year":     row.Year,
			"revenue":  row.Revenue,
			"invoices": row.Invoices,
		})
	}

	var revenueByTypeRows []struct {
		SubscriptionType string  `json:"subscription_type"`
		Revenue          float64 `json:"revenue"`
	}

	typeQuery := config.DB.Model(&models.Payment{}).
		Select(`
			COALESCE(subscription_types.name, 'Tanpa Tipe') as subscription_type,
			COALESCE(SUM(payments.amount), 0) as revenue
		`).
		Joins("LEFT JOIN invoices ON payments.invoice_id = invoices.id").
		Joins("LEFT JOIN customers ON invoices.customer_id = customers.id").
		Joins("LEFT JOIN subscription_types ON customers.subscription_id = subscription_types.id").
		Where("payments.paid_at >= ? AND payments.paid_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		typeQuery = typeQuery.Where("payments.tenant_id = ?", tenantID)
	}

	typeQuery.
		Group("subscription_types.name").
		Order("revenue DESC").
		Scan(&revenueByTypeRows)

	revenueBySubscriptionType := make([]gin.H, 0, len(revenueByTypeRows))
	for _, row := range revenueByTypeRows {
		percentage := 0.0
		if totalRevenue > 0 {
			percentage = (row.Revenue / totalRevenue) * 100
		}

		revenueBySubscriptionType = append(revenueBySubscriptionType, gin.H{
			"subscription_type": row.SubscriptionType,
			"revenue":           row.Revenue,
			"percentage":        percentage,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_revenue": totalRevenue,
		"total_payments": paymentCount,
		"monthly_revenue": monthlyRevenue,
		"revenue_by_subscription_type": revenueBySubscriptionType,
		"period": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
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

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" {
		startDate = time.Now().AddDate(0, -11, 0).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	startTime, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format start_date tidak valid"})
		return
	}

	endTime, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format end_date tidak valid"})
		return
	}

	endExclusive := endTime.AddDate(0, 0, 1)

	baseQuery := config.DB.Model(&models.Customer{})
	if hasSpecificTenant {
		baseQuery = baseQuery.Where("tenant_id = ?", tenantID)
	}

	var totalCustomers int64
	var activeCustomers int64
	baseQuery.Count(&totalCustomers)

	activeQuery := config.DB.Model(&models.Customer{}).Where("is_active = ?", true)
	if hasSpecificTenant {
		activeQuery = activeQuery.Where("tenant_id = ?", tenantID)
	}
	activeQuery.Count(&activeCustomers)

	inactiveCustomers := totalCustomers - activeCustomers
	suspendedCustomers := int64(0)

	statusDistribution := []gin.H{}
	if totalCustomers > 0 {
		statusDistribution = append(statusDistribution,
			gin.H{
				"status":     "Aktif",
				"count":      activeCustomers,
				"percentage": (float64(activeCustomers) / float64(totalCustomers)) * 100,
			},
			gin.H{
				"status":     "Tidak Aktif",
				"count":      inactiveCustomers,
				"percentage": (float64(inactiveCustomers) / float64(totalCustomers)) * 100,
			},
		)
	} else {
		statusDistribution = append(statusDistribution,
			gin.H{"status": "Aktif", "count": 0, "percentage": 0.0},
			gin.H{"status": "Tidak Aktif", "count": 0, "percentage": 0.0},
		)
	}

	var startingTotal int64
	startingTotalQuery := config.DB.Model(&models.Customer{}).Where("created_at < ?", startTime)
	if hasSpecificTenant {
		startingTotalQuery = startingTotalQuery.Where("tenant_id = ?", tenantID)
	}
	startingTotalQuery.Count(&startingTotal)

	var growthRows []struct {
		Year         int   `json:"year"`
		Month        int   `json:"month"`
		NewCustomers int64 `json:"new_customers"`
	}

	growthQuery := config.DB.Model(&models.Customer{}).
		Select(`
			YEAR(created_at) as year,
			MONTH(created_at) as month,
			COUNT(*) as new_customers
		`).
		Where("created_at >= ? AND created_at < ?", startTime, endExclusive)
	if hasSpecificTenant {
		growthQuery = growthQuery.Where("tenant_id = ?", tenantID)
	}
	growthQuery.
		Group("YEAR(created_at), MONTH(created_at)").
		Order("YEAR(created_at), MONTH(created_at)").
		Scan(&growthRows)

	growthMap := map[string]int64{}
	for _, row := range growthRows {
		key := time.Date(row.Year, time.Month(row.Month), 1, 0, 0, 0, 0, time.UTC).Format("2006-01")
		growthMap[key] = row.NewCustomers
	}

	customerGrowth := make([]gin.H, 0)
	runningTotal := startingTotal
	cursor := time.Date(startTime.Year(), startTime.Month(), 1, 0, 0, 0, 0, time.UTC)
	lastMonth := time.Date(endTime.Year(), endTime.Month(), 1, 0, 0, 0, 0, time.UTC)
	for !cursor.After(lastMonth) {
		key := cursor.Format("2006-01")
		newCustomers := growthMap[key]
		runningTotal += newCustomers

		customerGrowth = append(customerGrowth, gin.H{
			"month":           cursor.Month().String(),
			"year":            cursor.Year(),
			"new_customers":   newCustomers,
			"total_customers": runningTotal,
		})

		cursor = cursor.AddDate(0, 1, 0)
	}

	var usageRows []struct {
		CustomerID   string  `json:"customer_id"`
		TotalUsageM3 float64 `json:"total_usage_m3"`
	}
	usageQuery := config.DB.Model(&models.Invoice{}).
		Select("customer_id, COALESCE(SUM(usage_m3), 0) as total_usage_m3").
		Where("created_at >= ? AND created_at < ?", startTime, endExclusive)
	if hasSpecificTenant {
		usageQuery = usageQuery.Where("tenant_id = ?", tenantID)
	}
	usageQuery.
		Group("customer_id").
		Scan(&usageRows)

	usageMap := map[string]float64{}
	for _, row := range usageRows {
		usageMap[row.CustomerID] = row.TotalUsageM3
	}

	var topCustomerRows []struct {
		CustomerID   string  `json:"customer_id"`
		CustomerName string  `json:"customer_name"`
		TotalRevenue float64 `json:"total_revenue"`
	}

	topCustomersQuery := config.DB.Model(&models.Payment{}).
		Select(`
			customers.id as customer_id,
			customers.name as customer_name,
			COALESCE(SUM(payments.amount), 0) as total_revenue
		`).
		Joins("LEFT JOIN invoices ON payments.invoice_id = invoices.id").
		Joins("LEFT JOIN customers ON invoices.customer_id = customers.id").
		Where("payments.paid_at >= ? AND payments.paid_at < ?", startTime, endExclusive)
	if hasSpecificTenant {
		topCustomersQuery = topCustomersQuery.Where("payments.tenant_id = ?", tenantID)
	}
	topCustomersQuery.
		Group("customers.id, customers.name").
		Order("total_revenue DESC").
		Limit(10).
		Scan(&topCustomerRows)

	topCustomers := make([]gin.H, 0, len(topCustomerRows))
	for index, row := range topCustomerRows {
		topCustomers = append(topCustomers, gin.H{
			"customer_id":    row.CustomerID,
			"customer_name":  row.CustomerName,
			"total_usage_m3": usageMap[row.CustomerID],
			"total_revenue":  row.TotalRevenue,
			"rank":           index + 1,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_customers":      totalCustomers,
		"active_customers":     activeCustomers,
		"inactive_customers":   inactiveCustomers,
		"suspended_customers":  suspendedCustomers,
		"customer_growth":      customerGrowth,
		"status_distribution":  statusDistribution,
		"top_customers":        topCustomers,
		"period": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
		},
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

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" {
		startDate = time.Now().AddDate(0, -11, 0).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	startTime, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format start_date tidak valid"})
		return
	}

	endTime, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format end_date tidak valid"})
		return
	}

	startMonth := startTime.Format("2006-01")
	endMonth := endTime.Format("2006-01")

	baseQuery := config.DB.Model(&models.WaterUsage{}).
		Where("usage_month >= ? AND usage_month <= ?", startMonth, endMonth)

	if hasSpecificTenant {
		baseQuery = baseQuery.Where("tenant_id = ?", tenantID)
	}

	var totalUsage float64
	var recordCount int64
	var averageUsage float64

	baseQuery.Count(&recordCount)
	baseQuery.Select("COALESCE(SUM(usage_m3), 0)").Scan(&totalUsage)

	if recordCount > 0 {
		averageUsage = totalUsage / float64(recordCount)
	}

	var trendRows []struct {
		UsageMonth   string  `json:"usage_month"`
		TotalUsage   float64 `json:"total_usage"`
		AverageUsage float64 `json:"average_usage"`
		CustomerCount int64  `json:"customer_count"`
	}

	trendQuery := config.DB.Model(&models.WaterUsage{}).
		Select(`
			usage_month,
			COALESCE(SUM(usage_m3), 0) as total_usage,
			COALESCE(AVG(usage_m3), 0) as average_usage,
			COUNT(DISTINCT customer_id) as customer_count
		`).
		Where("usage_month >= ? AND usage_month <= ?", startMonth, endMonth)

	if hasSpecificTenant {
		trendQuery = trendQuery.Where("tenant_id = ?", tenantID)
	}

	trendQuery.
		Group("usage_month").
		Order("usage_month ASC").
		Scan(&trendRows)

	usageTrends := make([]gin.H, 0, len(trendRows))
	for _, row := range trendRows {
		monthTime, parseErr := time.Parse("2006-01", row.UsageMonth)
		monthName := row.UsageMonth
		yearValue := 0
		if parseErr == nil {
			monthName = monthTime.Month().String()
			yearValue = monthTime.Year()
		}

		usageTrends = append(usageTrends, gin.H{
			"month":            monthName,
			"year":             yearValue,
			"total_usage":      row.TotalUsage,
			"average_usage":    row.AverageUsage,
			"customer_count":   row.CustomerCount,
		})
	}

	var highConsumerRows []struct {
		CustomerID   string  `json:"customer_id"`
		CustomerName string  `json:"customer_name"`
		MeterNumber  string  `json:"meter_number"`
		Usage        float64 `json:"usage"`
		UsageMonth   string  `json:"usage_month"`
	}

	highConsumerQuery := config.DB.Model(&models.WaterUsage{}).
		Select(`
			customers.id as customer_id,
			customers.name as customer_name,
			customers.meter_number as meter_number,
			water_usages.usage_m3 as usage,
			water_usages.usage_month as usage_month
		`).
		Joins("LEFT JOIN customers ON water_usages.customer_id = customers.id").
		Where("water_usages.usage_month >= ? AND water_usages.usage_month <= ?", startMonth, endMonth)

	if hasSpecificTenant {
		highConsumerQuery = highConsumerQuery.Where("water_usages.tenant_id = ?", tenantID)
	}

	highConsumerQuery.
		Order("water_usages.usage_m3 DESC, water_usages.usage_month DESC").
		Limit(10).
		Scan(&highConsumerRows)

	highConsumers := make([]gin.H, 0, len(highConsumerRows))
	for _, row := range highConsumerRows {
		monthTime, parseErr := time.Parse("2006-01", row.UsageMonth)
		monthName := row.UsageMonth
		yearValue := 0
		if parseErr == nil {
			monthName = monthTime.Month().String()
			yearValue = monthTime.Year()
		}

		highConsumers = append(highConsumers, gin.H{
			"customer_id":   row.CustomerID,
			"customer_name": row.CustomerName,
			"meter_number":  row.MeterNumber,
			"usage":         row.Usage,
			"month":         monthName,
			"year":          yearValue,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_usage":   totalUsage,
		"average_usage": averageUsage,
		"usage_trends":  usageTrends,
		"high_consumers": highConsumers,
		"period": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
		},
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

	startTime, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format start_date tidak valid"})
		return
	}

	endTime, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format end_date tidak valid"})
		return
	}

	endExclusive := endTime.AddDate(0, 0, 1)

	paidQuery := config.DB.Model(&models.Payment{}).
		Where("paid_at >= ? AND paid_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		paidQuery = paidQuery.Where("tenant_id = ?", tenantID)
	}

	var totalCollected float64
	var paymentCount int64

	paidQuery.Count(&paymentCount)
	paidQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalCollected)

	var methodRows []struct {
		Method string  `json:"method"`
		Amount float64 `json:"amount"`
		Count  int64   `json:"count"`
	}

	methodQuery := config.DB.Model(&models.Payment{}).
		Select(`
			COALESCE(payment_methods.name, 'Tanpa Metode') as method,
			COALESCE(SUM(payments.amount), 0) as amount,
			COUNT(*) as count
		`).
		Joins("LEFT JOIN payment_methods ON payments.payment_method_id = payment_methods.id").
		Where("payments.paid_at >= ? AND payments.paid_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		methodQuery = methodQuery.Where("payments.tenant_id = ?", tenantID)
	}

	methodQuery.
		Group("payment_methods.name").
		Order("amount DESC").
		Scan(&methodRows)

	paymentMethodBreakdown := make([]gin.H, 0, len(methodRows))
	for _, row := range methodRows {
		percentage := 0.0
		if totalCollected > 0 {
			percentage = (row.Amount / totalCollected) * 100
		}

		paymentMethodBreakdown = append(paymentMethodBreakdown, gin.H{
			"method":     row.Method,
			"amount":     row.Amount,
			"count":      row.Count,
			"percentage": percentage,
		})
	}

	var dailyRows []struct {
		Date   string  `json:"date"`
		Amount float64 `json:"amount"`
		Count  int64   `json:"count"`
	}

	dailyQuery := config.DB.Model(&models.Payment{}).
		Select("DATE(paid_at) as date, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count").
		Where("paid_at >= ? AND paid_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		dailyQuery = dailyQuery.Where("tenant_id = ?", tenantID)
	}

	dailyQuery.
		Group("DATE(paid_at)").
		Order("date ASC").
		Scan(&dailyRows)

	dailyCollection := make([]gin.H, 0, len(dailyRows))
	for _, row := range dailyRows {
		dailyCollection = append(dailyCollection, gin.H{
			"date":   row.Date,
			"amount": row.Amount,
			"count":  row.Count,
		})
	}

	outstandingQuery := config.DB.Model(&models.Invoice{}).
		Where("is_paid = ?", false).
		Where("created_at >= ? AND created_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		outstandingQuery = outstandingQuery.Where("tenant_id = ?", tenantID)
	}

	var totalOutstanding float64
	outstandingQuery.Select("COALESCE(SUM(total_amount - total_paid), 0)").Scan(&totalOutstanding)

	var outstandingRows []struct {
		CustomerID   string  `json:"customer_id"`
		CustomerName string  `json:"customer_name"`
		InvoiceNumber string `json:"invoice_number"`
		Amount       float64 `json:"amount"`
		DueDate      *time.Time `json:"due_date"`
		DaysOverdue  int64   `json:"days_overdue"`
	}

	outstandingDetailQuery := config.DB.Model(&models.Invoice{}).
		Select(`
			customers.id as customer_id,
			customers.name as customer_name,
			invoices.invoice_number as invoice_number,
			(invoices.total_amount - invoices.total_paid) as amount,
			invoices.due_date as due_date,
			CASE
				WHEN invoices.due_date IS NULL THEN 0
				WHEN invoices.due_date < CURDATE() THEN DATEDIFF(CURDATE(), invoices.due_date)
				ELSE 0
			END as days_overdue
		`).
		Joins("LEFT JOIN customers ON invoices.customer_id = customers.id").
		Where("invoices.is_paid = ?", false).
		Where("invoices.created_at >= ? AND invoices.created_at < ?", startTime, endExclusive)

	if hasSpecificTenant {
		outstandingDetailQuery = outstandingDetailQuery.Where("invoices.tenant_id = ?", tenantID)
	}

	outstandingDetailQuery.
		Order("days_overdue DESC, invoices.created_at ASC").
		Limit(20).
		Scan(&outstandingRows)

	outstandingPayments := make([]gin.H, 0, len(outstandingRows))
	for _, row := range outstandingRows {
		dueDateValue := ""
		if row.DueDate != nil {
			dueDateValue = row.DueDate.Format("2006-01-02")
		}

		outstandingPayments = append(outstandingPayments, gin.H{
			"customer_id":    row.CustomerID,
			"customer_name":  row.CustomerName,
			"invoice_number": row.InvoiceNumber,
			"amount":         row.Amount,
			"due_date":       dueDateValue,
			"days_overdue":   row.DaysOverdue,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_collected":          totalCollected,
		"total_outstanding":        totalOutstanding,
		"total_payments":           paymentCount,
		"payment_method_breakdown": paymentMethodBreakdown,
		"daily_collection":         dailyCollection,
		"outstanding_payments":     outstandingPayments,
		"period": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
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
