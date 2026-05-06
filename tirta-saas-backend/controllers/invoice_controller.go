package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getInvoiceSubscription(invoice models.Invoice) *models.SubscriptionType {
	if invoice.Customer.Subscription.ID == uuid.Nil {
		return nil
	}

	subscription := invoice.Customer.Subscription
	return &subscription
}

func buildInvoiceResponse(invoice models.Invoice, tenantSettings models.TenantSettings, referenceTime time.Time) responses.InvoiceResponse {
	snapshot := services.CalculateInvoiceAmountSnapshot(invoice, getInvoiceSubscription(invoice), tenantSettings, referenceTime)
	paymentStatus := strings.ToLower(string(services.DetermineInvoicePaymentStatus(invoice, snapshot)))
	manualItems := invoice.GetManualItems()
	responseItems := make([]responses.InvoiceItem, 0, len(manualItems))
	for _, item := range manualItems {
		responseItems = append(responseItems, responses.InvoiceItem{
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Amount:      item.Amount,
		})
	}

	response := responses.InvoiceResponse{
		ID:                  invoice.ID,
		InvoiceNumber:       invoice.InvoiceNumber,
		CustomerID:          invoice.CustomerID,
		UsageMonth:          invoice.UsageMonth,
		UsageM3:             invoice.UsageM3,
		WaterCharge:         invoice.WaterCharge,
		Abonemen:            invoice.Abonemen,
		PricePerM3:          invoice.PricePerM3,
		SubTotal:            snapshot.SubTotal,
		PenaltyAmount:       snapshot.PenaltyAmount,
		TotalAmount:         snapshot.TotalAmount,
		TotalPaid:           invoice.TotalPaid,
		RemainingAmount:     snapshot.RemainingAmount,
		StoredPenaltyAmount: snapshot.StoredPenaltyAmount,
		StoredTotalAmount:   snapshot.StoredTotalAmount,
		PenaltyDays:         snapshot.PenaltyDays,
		IsPaid:              snapshot.RemainingAmount == 0 && invoice.TotalPaid >= snapshot.TotalAmount,
		PaymentStatus:       paymentStatus,
		Type:                invoice.Type,
		Notes:               invoice.Notes,
		Items:               responseItems,
		DueDate:             invoice.DueDate,
		PaidDate:            invoice.PaidDate,
		CreatedAt:           invoice.CreatedAt,
	}

	if invoice.Customer.ID != uuid.Nil {
		response.CustomerName = invoice.Customer.Name
		response.MeterNumber = invoice.Customer.MeterNumber
		response.Customer = &responses.CustomerSummary{
			ID:          invoice.Customer.ID,
			Name:        invoice.Customer.Name,
			MeterNumber: invoice.Customer.MeterNumber,
			Email:       invoice.Customer.Email,
			Address:     invoice.Customer.Address,
		}
	}

	// Build frozen receipt payload for mobile thermal printer rendering.
	// Populated with data already in scope — no extra DB call needed here.
	receipt := &responses.ReceiptPayload{
		InvoiceNumber: invoice.InvoiceNumber,
		CustomerName:  response.CustomerName,
		MeterNumber:   response.MeterNumber,
		UsageMonth:    invoice.UsageMonth,
		UsageM3:       invoice.UsageM3,
		WaterCharge:   invoice.WaterCharge,
		Abonemen:      invoice.Abonemen,
		PenaltyAmount: snapshot.PenaltyAmount,
		TotalAmount:   snapshot.TotalAmount,
		TotalPaid:     invoice.TotalPaid,
		DueDate:       invoice.DueDate,
		CompanyName:   tenantSettings.CompanyName,
		CompanyPhone:  tenantSettings.Phone,
		CompanyEmail:  tenantSettings.Email,
		FooterText:    tenantSettings.InvoiceFooterText,
	}
	if invoice.Customer.ID != uuid.Nil {
		receipt.Address = invoice.Customer.Address
	}
	response.Receipt = receipt

	return response
}

func attachInvoiceUsageReadings(response *responses.InvoiceResponse, tenantID uuid.UUID) {
	if response.Type != "monthly" || response.UsageMonth == "" {
		return
	}

	var usage models.WaterUsage
	if err := config.DB.
		Where("tenant_id = ? AND customer_id = ? AND usage_month = ?", tenantID, response.CustomerID, response.UsageMonth).
		Order("created_at desc").
		First(&usage).Error; err != nil {
		return
	}

	meterStart := usage.MeterStart
	meterEnd := usage.MeterEnd
	response.MeterStart = &meterStart
	response.MeterEnd = &meterEnd

	// Sync meter readings into the receipt payload as well
	if response.Receipt != nil {
		response.Receipt.MeterStart = usage.MeterStart
		response.Receipt.MeterEnd = usage.MeterEnd
	}
}

func buildInvoiceListStats(invoices []responses.InvoiceResponse) responses.InvoiceListStats {
	stats := responses.InvoiceListStats{
		TotalInvoices: len(invoices),
	}

	for _, invoice := range invoices {
		stats.TotalAmount += invoice.TotalAmount
		stats.OutstandingAmount += invoice.RemainingAmount

		switch invoice.PaymentStatus {
		case "paid":
			stats.PaidCount++
		case "partial":
			stats.PartialCount++
			stats.OpenCount++
		case "overdue":
			stats.OverdueCount++
			stats.OpenCount++
		default:
			stats.UnpaidCount++
			stats.OpenCount++
		}
	}

	return stats
}

func parseInvoiceDueDate(value string) (time.Time, error) {
	return time.Parse("2006-01-02", value)
}

// CreateInvoice godoc
// @Summary Create manual invoice
// @Description Create a manual invoice for non-registration and non-water-usage charges
// @Tags Invoices
// @Accept json
// @Produce json
// @Param request body requests.CreateInvoiceRequest true "Create invoice request"
// @Security BearerAuth
// @Success 201 {object} responses.InvoiceResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/invoices [post]
func CreateInvoice(c *gin.Context) {
	var req requests.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := config.DB.Preload("Subscription").
		Where("id = ? AND tenant_id = ?", req.CustomerID, tenantID).
		First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	dueDate, err := parseInvoiceDueDate(req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format jatuh tempo tidak valid"})
		return
	}

	totalAmount := 0.0
	manualItems := make([]models.ManualInvoiceItem, 0, len(req.Items))
	for _, item := range req.Items {
		lineTotal := item.Quantity * item.UnitPrice
		if lineTotal < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nominal item tidak valid"})
			return
		}
		totalAmount += lineTotal
		manualItems = append(manualItems, models.ManualInvoiceItem{
			Description: strings.TrimSpace(item.Description),
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Amount:      lineTotal,
		})
	}

	if totalAmount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Total tagihan harus lebih besar dari nol"})
		return
	}

	invoiceNumberGen := services.GetInvoiceNumberGenerator()
	invoiceNumber, err := invoiceNumberGen.GenerateInvoiceNumber(tenantID, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat nomor invoice"})
		return
	}

	invoice := models.Invoice{
		InvoiceNumber: invoiceNumber,
		CustomerID:    req.CustomerID,
		TenantID:      tenantID,
		UsageMonth:    "",
		UsageM3:       0,
		PricePerM3:    0,
		Abonemen:      0,
		WaterCharge:   totalAmount,
		SubTotal:      totalAmount,
		TotalAmount:   totalAmount,
		TotalPaid:     0,
		PaymentStatus: models.PaymentStatusUnpaid,
		IsPaid:        false,
		DueDate:       &dueDate,
		Type:          string(models.InvoiceTypeManual),
		Notes:         strings.TrimSpace(req.Notes),
	}

	if err := invoice.SetManualItems(manualItems); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses item tagihan"})
		return
	}

	if err := config.DB.Create(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat tagihan"})
		return
	}

	if err := config.DB.Preload("Customer").Preload("Customer.Subscription").
		Where("id = ? AND tenant_id = ?", invoice.ID, tenantID).
		First(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tagihan berhasil dibuat, tetapi gagal memuat ulang data"})
		return
	}

	response := buildInvoiceResponse(invoice, services.LoadTenantSettings(tenantID), time.Time{})
	c.JSON(http.StatusCreated, response)
}

// GenerateMonthlyInvoiceRequest represents the request body for generating monthly invoice
type GenerateMonthlyInvoiceRequest struct {
	UsageMonth string `json:"usage_month" binding:"required" example:"2024-01"` // format: YYYY-MM
}

// GenerateMonthlyInvoice godoc
// @Summary Generate monthly invoice
// @Description Generate monthly invoice for a customer
// @Tags Invoices
// @Accept json
// @Produce json
// @Param request body GenerateMonthlyInvoiceRequest true "Generate invoice request"
// @Security BearerAuth
// @Success 201 {object} responses.InvoiceResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/invoices/generate [post]
func GenerateMonthlyInvoice(c *gin.Context) {
	type Request struct {
		UsageMonth string `json:"usage_month" binding:"required"` // format: YYYY-MM
	}
	var req Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UsageMonth wajib diisi (format: YYYY-MM)"})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}

	service := services.NewInvoiceGenerationService()
	result, err := service.GenerateInvoices(services.InvoiceGenerationRequest{
		TenantID:   tenantID,
		UsageMonth: req.UsageMonth,
		DryRun:     false,
	})
	if err != nil {
		if strings.Contains(err.Error(), "no water usage records found") {
			c.JSON(http.StatusOK, gin.H{"message": "Tidak ada water usage untuk bulan tersebut"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Generate invoice selesai",
		"created_count": result.Success,
		"skipped":       result.Skipped,
		"failed":        result.Failed,
		"errors":        result.Errors,
	})
}

// GetOutstandingInvoices godoc
// @Summary Get outstanding (unpaid) invoices
// @Description Get unpaid invoices for a customer
// @Tags Invoices
// @Accept json
// @Produce json
// @Param customer_id query string true "Customer ID (UUID)"
// @Security BearerAuth
// @Success 200 {array} responses.InvoiceResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/invoices/outstanding [get]
func GetOutstandingInvoices(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customerIDStr := c.Query("customer_id")
	if customerIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "customer_id is required"})
		return
	}

	customerID, err := uuid.Parse(customerIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var invoices []models.Invoice
	if err := config.DB.Preload("Customer").Preload("Customer.Subscription").
		Where("customer_id = ? AND tenant_id = ? AND is_paid = ?", customerID, tenantID, false).
		Order("created_at ASC").
		Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data invoice"})
		return
	}

	tenantSettings := services.LoadTenantSettings(tenantID)
	invoiceResponses := make([]responses.InvoiceResponse, len(invoices))
	for i, invoice := range invoices {
		invoiceResponses[i] = buildInvoiceResponse(invoice, tenantSettings, time.Time{})
	}

	c.JSON(http.StatusOK, invoiceResponses)
}

// GetInvoices godoc
// @Summary List invoices
// @Description Get all invoices for the tenant
// @Tags Invoices
// @Accept json
// @Produce json
// @Param status query string false "Filter by status"
// @Param customer_id query string false "Filter by customer ID"
// @Security BearerAuth
// @Success 200 {array} responses.InvoiceResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/invoices [get]
func GetInvoices(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var invoices []models.Invoice
	query := config.DB.Preload("Customer").Preload("Customer.Subscription")

	if hasSpecificTenant {
		query = query.Where("invoices.tenant_id = ?", tenantID)
	}

	statusFilter := strings.TrimSpace(strings.ToLower(c.Query("status")))
	if invoiceType := c.Query("type"); invoiceType != "" {
		query = query.Where("invoices.type = ?", invoiceType)
	}
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("invoices.customer_id = ?", customerID)
	}
	if search := c.Query("search"); search != "" {
		query = query.Joins("LEFT JOIN customers ON customers.id = invoices.customer_id").
			Where(
				"invoices.invoice_number LIKE ? OR customers.name LIKE ? OR customers.meter_number LIKE ?",
				"%"+search+"%",
				"%"+search+"%",
				"%"+search+"%",
			)
	}

	if err := query.Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
		return
	}

	// Convert to response format
	invoiceResponses := make([]responses.InvoiceResponse, len(invoices))
	for i, invoice := range invoices {
		invoiceTenantSettings := services.LoadTenantSettings(invoice.TenantID)
		if hasSpecificTenant {
			invoiceTenantSettings = services.LoadTenantSettings(tenantID)
		}
		invoiceResponses[i] = buildInvoiceResponse(invoice, invoiceTenantSettings, time.Time{})
	}

	if statusFilter != "" {
		filteredResponses := make([]responses.InvoiceResponse, 0, len(invoiceResponses))
		for _, invoiceResponse := range invoiceResponses {
			if invoiceResponse.PaymentStatus == statusFilter {
				filteredResponses = append(filteredResponses, invoiceResponse)
			}
		}
		invoiceResponses = filteredResponses
	}

	response := responses.InvoiceListResponse{
		Invoices: invoiceResponses,
		Total:    len(invoiceResponses),
		Stats:    buildInvoiceListStats(invoiceResponses),
	}
	c.JSON(http.StatusOK, response)
}

// GetInvoice godoc
// @Summary Get invoice by ID
// @Description Get a specific invoice details
// @Tags Invoices
// @Accept json
// @Produce json
// @Param id path string true "Invoice ID"
// @Security BearerAuth
// @Success 200 {object} responses.InvoiceResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/invoices/{id} [get]
func GetInvoice(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	invoiceID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var invoice models.Invoice
	if err := config.DB.Preload("Customer").Preload("Customer.Subscription").
		Where("id = ? AND tenant_id = ?", invoiceID, tenantID).
		First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice tidak ditemukan"})
		return
	}

	response := buildInvoiceResponse(invoice, services.LoadTenantSettings(tenantID), time.Time{})
	attachInvoiceUsageReadings(&response, tenantID)
	helpers.RespondSuccess(c, "Invoice retrieved successfully", response)
}

func UpdateInvoice(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	invoiceID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var invoice models.Invoice
	if err := config.DB.Where("id = ? AND tenant_id = ?", invoiceID, tenantID).
		First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice tidak ditemukan"})
		return
	}

	type UpdateInvoiceInput struct {
		UsageM3     float64 `json:"usage_m3"`
		Abonemen    float64 `json:"abonemen"`
		PricePerM3  float64 `json:"price_per_m3"`
		TotalAmount float64 `json:"total_amount"`
		IsPaid      bool    `json:"is_paid"`
		TotalPaid   float64 `json:"total_paid"`
	}

	var input UpdateInvoiceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invoice.UsageM3 = input.UsageM3
	invoice.Abonemen = input.Abonemen
	invoice.PricePerM3 = input.PricePerM3
	invoice.TotalAmount = input.TotalAmount
	invoice.IsPaid = input.IsPaid
	invoice.TotalPaid = input.TotalPaid

	if err := config.DB.Model(&invoice).Select("UsageM3", "Abonemen", "PricePerM3", "TotalAmount", "IsPaid", "TotalPaid").Updates(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui invoice"})
		return
	}

	response := responses.InvoiceResponse{
		ID:          invoice.ID,
		CustomerID:  invoice.CustomerID,
		UsageMonth:  invoice.UsageMonth,
		UsageM3:     invoice.UsageM3,
		Abonemen:    invoice.Abonemen,
		PricePerM3:  invoice.PricePerM3,
		TotalAmount: invoice.TotalAmount,
		TotalPaid:   invoice.TotalPaid,
		IsPaid:      invoice.IsPaid,
		Type:        invoice.Type,
		CreatedAt:   invoice.CreatedAt,
	}
	c.JSON(http.StatusOK, response)
}

func DeleteInvoice(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	invoiceID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	if err := config.DB.Where("id = ? AND tenant_id = ?", invoiceID, tenantID).
		Delete(&models.Invoice{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice berhasil dihapus"})
}

// BulkGenerateInvoices godoc
// @Summary Bulk generate invoices
// @Description Generate invoices in bulk for specified month and customers
// @Tags Invoices
// @Accept json
// @Produce json
// @Param request body requests.BulkInvoiceGenerationRequest true "Bulk generation request"
// @Security BearerAuth
// @Success 200 {object} responses.BulkInvoiceGenerationResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/invoices/bulk-generate [post]
func BulkGenerateInvoices(c *gin.Context) {
	var req requests.BulkInvoiceGenerationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant ID required",
			Error:   err.Error(),
		})
		return
	}

	// Create service
	service := services.NewInvoiceGenerationService()

	// Generate invoices
	result, err := service.GenerateInvoices(services.InvoiceGenerationRequest{
		TenantID:    tenantID,
		UsageMonth:  req.UsageMonth,
		CustomerIDs: req.CustomerIDs,
		DryRun:      req.Preview,
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to generate invoices",
			Error:   err.Error(),
		})
		return
	}

	// Convert to response format
	invoiceItems := make([]responses.InvoicePreviewItem, len(result.Invoices))
	for i, inv := range result.Invoices {
		// Get customer details
		var customer models.Customer
		config.DB.First(&customer, "id = ?", inv.CustomerID)
		var subType models.SubscriptionType
		config.DB.First(&subType, "id = ?", customer.SubscriptionID)

		subTotal := inv.WaterCharge + subType.MonthlyFee + subType.MaintenanceFee
		totalAmount := subTotal + inv.PenaltyAmount

		invoiceItems[i] = responses.InvoicePreviewItem{
			InvoiceNumber:  inv.InvoiceNumber,
			CustomerID:     inv.CustomerID,
			CustomerName:   customer.Name,
			CustomerCode:   customer.MeterNumber,
			UsageMonth:     inv.UsageMonth,
			UsageM3:        inv.UsageM3,
			PricePerM3:     inv.PricePerM3,
			WaterCharge:    inv.WaterCharge,
			Abonemen:       subType.MonthlyFee,
			MaintenanceFee: subType.MaintenanceFee,
			PenaltyAmount:  inv.PenaltyAmount,
			SubTotal:       subTotal,
			TotalAmount:    totalAmount,
			DueDate:        inv.DueDate,
			Notes:          inv.Notes,
		}
	}

	response := responses.BulkInvoiceGenerationResponse{
		Status:      "success",
		Message:     getMessage(req.Preview, result),
		Success:     result.Success,
		Skipped:     result.Skipped,
		Failed:      result.Failed,
		TotalAmount: result.TotalAmount,
		Invoices:    invoiceItems,
		Errors:      result.Errors,
		PreviewOnly: result.PreviewOnly,
	}

	c.JSON(http.StatusOK, response)
}

// PreviewInvoiceGeneration godoc
// @Summary Preview invoice generation
// @Description Preview what invoices will be generated without actually creating them
// @Tags Invoices
// @Accept json
// @Produce json
// @Param request body requests.InvoicePreviewRequest true "Preview request"
// @Security BearerAuth
// @Success 200 {object} responses.BulkInvoiceGenerationResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/invoices/preview-generation [post]
func PreviewInvoiceGeneration(c *gin.Context) {
	var req requests.InvoicePreviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant ID required",
			Error:   err.Error(),
		})
		return
	}

	// Create service
	service := services.NewInvoiceGenerationService()

	// Preview (dry run)
	result, err := service.GenerateInvoices(services.InvoiceGenerationRequest{
		TenantID:    tenantID,
		UsageMonth:  req.UsageMonth,
		CustomerIDs: req.CustomerIDs,
		DryRun:      true, // Always preview mode
	})

	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to preview invoices",
			Error:   err.Error(),
		})
		return
	}

	// Convert to response format
	invoiceItems := make([]responses.InvoicePreviewItem, len(result.Invoices))
	for i, inv := range result.Invoices {
		var customer models.Customer
		config.DB.First(&customer, "id = ?", inv.CustomerID)
		var subType models.SubscriptionType
		config.DB.First(&subType, "id = ?", customer.SubscriptionID)

		subTotal := inv.WaterCharge + subType.MonthlyFee + subType.MaintenanceFee
		totalAmount := subTotal + inv.PenaltyAmount

		invoiceItems[i] = responses.InvoicePreviewItem{
			InvoiceNumber:  inv.InvoiceNumber,
			CustomerID:     inv.CustomerID,
			CustomerName:   customer.Name,
			CustomerCode:   customer.MeterNumber,
			UsageMonth:     inv.UsageMonth,
			UsageM3:        inv.UsageM3,
			PricePerM3:     inv.PricePerM3,
			WaterCharge:    inv.WaterCharge,
			Abonemen:       subType.MonthlyFee,
			MaintenanceFee: subType.MaintenanceFee,
			PenaltyAmount:  inv.PenaltyAmount,
			SubTotal:       subTotal,
			TotalAmount:    totalAmount,
			DueDate:        inv.DueDate,
			Notes:          inv.Notes,
		}
	}

	response := responses.BulkInvoiceGenerationResponse{
		Status:      "success",
		Message:     fmt.Sprintf("Preview: %d invoices ready to be generated", result.Success),
		Success:     result.Success,
		Skipped:     result.Skipped,
		Failed:      result.Failed,
		TotalAmount: result.TotalAmount,
		Invoices:    invoiceItems,
		Errors:      result.Errors,
		PreviewOnly: true,
	}

	c.JSON(http.StatusOK, response)
}

// getMessage generates appropriate message based on result
func getMessage(preview bool, result *services.InvoiceGenerationResult) string {
	if preview {
		return fmt.Sprintf("Preview: %d invoices ready to be generated", result.Success)
	}
	return fmt.Sprintf("Successfully generated %d invoices, skipped %d, failed %d",
		result.Success, result.Skipped, result.Failed)
}
