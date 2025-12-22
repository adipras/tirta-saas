package controllers

import (
	"github.com/adipras/tirta-saas-backend/helpers"
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/responses"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

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

	// Ambil semua WaterUsage bulan tsb yang belum dibuatkan Invoice
	var usages []models.WaterUsage
	if err := config.DB.
		Where("usage_month = ? AND tenant_id = ?", req.UsageMonth, tenantID).
		Find(&usages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal ambil data water usage"})
		return
	}

	if len(usages) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Tidak ada water usage untuk bulan tersebut"})
		return
	}

	created := 0
	skipped := 0

	for _, usage := range usages {
		// Cek apakah invoice sudah pernah dibuat
		var existing models.Invoice
		err := config.DB.Where("customer_id = ? AND usage_month = ? AND type = ?",
			usage.CustomerID, usage.UsageMonth, "monthly").First(&existing).Error
		if err == nil {
			skipped++
			continue
		}

		// Ambil data pelanggan & SubscriptionType
		var customer models.Customer
		if err := config.DB.Where("id = ? AND tenant_id = ?", usage.CustomerID, tenantID).First(&customer).Error; err != nil {
			continue
		}

		var subType models.SubscriptionType
		if err := config.DB.Where("id = ? AND tenant_id = ?", customer.SubscriptionID, tenantID).First(&subType).Error; err != nil {
			continue
		}

		// Business rule validations
		if usage.UsageM3 < 0 {
			continue // Skip invalid usage records
		}

		if usage.AmountCalculated < 0 {
			continue // Skip invalid calculated amounts
		}

		total := usage.AmountCalculated + subType.MonthlyFee + subType.MaintenanceFee

		// Validate calculated total is reasonable
		if total <= 0 || total > 999999 {
			continue // Skip invoices with invalid totals
		}

		// Calculate price per m3 safely
		pricePerM3 := 0.0
		if usage.UsageM3 > 0 {
			pricePerM3 = usage.AmountCalculated / usage.UsageM3
		}

		invoice := models.Invoice{
			CustomerID:  usage.CustomerID,
			UsageMonth:  usage.UsageMonth,
			UsageM3:     usage.UsageM3,
			Abonemen:    subType.MonthlyFee,
			PricePerM3:  pricePerM3,
			TotalAmount: total,
			TotalPaid:   0,
			IsPaid:      false,
			TenantID:    tenantID,
			Type:        "monthly",
		}

		if err := config.DB.Create(&invoice).Error; err == nil {
			created++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Generate invoice selesai",
		"created_count": created,
		"skipped":       skipped,
	})
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
	query := config.DB.Preload("Customer")
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if err := query.Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
		return
	}

	// Convert to response format
	invoiceResponses := make([]responses.InvoiceResponse, len(invoices))
	for i, invoice := range invoices {
		invoiceResponses[i] = responses.InvoiceResponse{
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
	}

	response := responses.InvoiceListResponse{
		Invoices: invoiceResponses,
		Total:    len(invoiceResponses),
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
	if err := config.DB.Preload("Customer").
		Where("id = ? AND tenant_id = ?", invoiceID, tenantID).
		First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice tidak ditemukan"})
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

	if err := config.DB.Save(&invoice).Error; err != nil {
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
