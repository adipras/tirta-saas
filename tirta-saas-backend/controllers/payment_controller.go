package controllers

import (
	"github.com/adipras/tirta-saas-backend/helpers"
	"fmt"
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreatePayment godoc
// @Summary Create payment
// @Description Record a new payment for an invoice
// @Tags Payments
// @Accept json
// @Produce json
// @Param request body requests.CreatePaymentRequest true "Create payment request"
// @Security BearerAuth
// @Success 201 {object} responses.PaymentResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/payments [post]
func CreatePayment(c *gin.Context) {
	var req requests.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)


	if err != nil {


		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})


		return


	}

	// Ambil invoice terkait
	var invoice models.Invoice
	if err := config.DB.Where("id = ? AND tenant_id = ?", req.InvoiceID, tenantID).
		First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice tidak ditemukan"})
		return
	}

	if invoice.IsPaid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tagihan sudah lunas"})
		return
	}

	// Business rule validations
	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment amount must be greater than zero"})
		return
	}

	if req.Amount > 999999 { // Max payment amount validation
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment amount exceeds maximum allowed limit"})
		return
	}

	if invoice.TotalPaid+req.Amount > invoice.TotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Pembayaran melebihi total tagihan. Sisa tagihan: %.2f", invoice.TotalAmount-invoice.TotalPaid),
		})
		return
	}

	// Buat record pembayaran
	payment := models.Payment{
		InvoiceID: req.InvoiceID,
		Amount:    req.Amount,
		TenantID:  tenantID,
	}
	if err := config.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat pembayaran"})
		return
	}

	// Hitung total bayar baru
	var totalPaid float64
	config.DB.Model(&models.Payment{}).
		Where("invoice_id = ?", req.InvoiceID).
		Select("SUM(amount)").Scan(&totalPaid)

	// Update invoice
	invoice.TotalPaid = totalPaid
	invoice.IsPaid = totalPaid >= invoice.TotalAmount
	if err := config.DB.Save(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status invoice"})
		return
	}

	// Jika invoice pendaftaran dan sudah lunas → aktifkan customer
	if invoice.Type == "registration" && invoice.IsPaid {
		if err := config.DB.Model(&models.Customer{}).
			Where("id = ? AND tenant_id = ?", invoice.CustomerID, tenantID).
			Update("is_active", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengaktifkan pelanggan"})
			return
		}
	}

	// Kirim response
	res := responses.PaymentResponse{
		ID:        payment.ID,
		InvoiceID: payment.InvoiceID,
		Amount:    payment.Amount,
		PaidAt:    payment.CreatedAt,
	}
	c.JSON(http.StatusCreated, res)
}

// GetPaymentHistoryByCustomerID godoc
// @Summary Get customer payment history
// @Description Get all payments for a specific customer
// @Tags Payments
// @Accept json
// @Produce json
// @Param customer_id path string true "Customer ID"
// @Security BearerAuth
// @Success 200 {array} responses.PaymentResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/payments/customer/{customer_id} [get]
func GetPaymentHistoryByCustomerID(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	customerIDStr := c.Param("customer_id")

	customerID, err := uuid.Parse(customerIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "customer_id tidak valid"})
		return
	}

	var payments []models.Payment
	if err := config.DB.Preload("Invoice").
		Where("tenant_id = ? AND invoice_id IN (SELECT id FROM invoices WHERE customer_id = ?)", tenantID, customerID).
		Order("paid_at desc").
		Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat pembayaran"})
		return
	}

	c.JSON(http.StatusOK, payments)
}

// GetAllPayments godoc
// @Summary List all payments
// @Description Get all payments for the tenant
// @Tags Payments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} responses.PaymentResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/payments [get]
func GetAllPayments(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var payments []models.Payment
	query := config.DB.Preload("Invoice")
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if err := query.Order("created_at desc").Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pembayaran"})
		return
	}

	c.JSON(http.StatusOK, payments)
}

func GetPayment(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	paymentID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var payment models.Payment
	if err := config.DB.Preload("Invoice").
		Where("id = ? AND tenant_id = ?", paymentID, tenantID).
		First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pembayaran tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, payment)
}

func UpdatePayment(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	paymentID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var payment models.Payment
	if err := config.DB.Where("id = ? AND tenant_id = ?", paymentID, tenantID).
		First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pembayaran tidak ditemukan"})
		return
	}

	type UpdatePaymentInput struct {
		Amount float64 `json:"amount" binding:"required,min=0"`
	}

	var input UpdatePaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get the invoice to validate the update
	var invoice models.Invoice
	if err := config.DB.Where("id = ? AND tenant_id = ?", payment.InvoiceID, tenantID).First(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data invoice"})
		return
	}

	// Calculate total paid excluding current payment
	var totalPaidExcludingCurrent float64
	config.DB.Model(&models.Payment{}).
		Where("invoice_id = ? AND id != ?", payment.InvoiceID, paymentID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalPaidExcludingCurrent)

	// Business rule validations
	if input.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment amount must be greater than zero"})
		return
	}

	if input.Amount > 999999 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment amount exceeds maximum allowed limit"})
		return
	}

	// Validate new amount
	if totalPaidExcludingCurrent+input.Amount > invoice.TotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Pembayaran melebihi total tagihan. Maksimal: %.2f", invoice.TotalAmount-totalPaidExcludingCurrent),
		})
		return
	}

	// Update payment
	payment.Amount = input.Amount
	if err := config.DB.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui pembayaran"})
		return
	}

	// Update invoice total paid
	var newTotalPaid float64
	config.DB.Model(&models.Payment{}).
		Where("invoice_id = ?", payment.InvoiceID).
		Select("SUM(amount)").Scan(&newTotalPaid)

	invoice.TotalPaid = newTotalPaid
	invoice.IsPaid = newTotalPaid >= invoice.TotalAmount
	config.DB.Save(&invoice)

	c.JSON(http.StatusOK, payment)
}

func DeletePayment(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	paymentID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	var payment models.Payment
	if err := config.DB.Where("id = ? AND tenant_id = ?", paymentID, tenantID).
		First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pembayaran tidak ditemukan"})
		return
	}

	// Store invoice ID before deleting payment
	invoiceID := payment.InvoiceID

	// Delete payment
	if err := config.DB.Delete(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus pembayaran"})
		return
	}

	// Update invoice total paid
	var invoice models.Invoice
	if err := config.DB.Where("id = ? AND tenant_id = ?", invoiceID, tenantID).First(&invoice).Error; err == nil {
		var newTotalPaid float64
		config.DB.Model(&models.Payment{}).
			Where("invoice_id = ?", invoiceID).
			Select("COALESCE(SUM(amount), 0)").Scan(&newTotalPaid)

		invoice.TotalPaid = newTotalPaid
		invoice.IsPaid = newTotalPaid >= invoice.TotalAmount
		config.DB.Save(&invoice)

		// If this was a registration invoice and is no longer paid, deactivate customer
		if invoice.Type == "registration" && !invoice.IsPaid {
			config.DB.Model(&models.Customer{}).
				Where("id = ?", invoice.CustomerID).
				Update("is_active", false)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pembayaran berhasil dihapus"})
}
