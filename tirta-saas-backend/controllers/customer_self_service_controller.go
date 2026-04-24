package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/services"
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type customerInvoiceResponse struct {
	ID                  uuid.UUID  `json:"id"`
	InvoiceNumber       string     `json:"invoice_number"`
	CustomerID          uuid.UUID  `json:"customer_id"`
	UsageMonth          string     `json:"usage_month"`
	UsageYear           int        `json:"usage_year"`
	PreviousReading     float64    `json:"previous_reading"`
	CurrentReading      float64    `json:"current_reading"`
	UsageAmount         float64    `json:"usage_amount"`
	WaterCharge         float64    `json:"water_charge"`
	SubscriptionFee     float64    `json:"subscription_fee"`
	PenaltyAmount       float64    `json:"penalty_amount"`
	SubTotal            float64    `json:"sub_total"`
	TotalAmount         float64    `json:"total_amount"`
	TotalPaid           float64    `json:"total_paid"`
	RemainingAmount     float64    `json:"remaining_amount"`
	StoredPenaltyAmount float64    `json:"stored_penalty_amount"`
	StoredTotalAmount   float64    `json:"stored_total_amount"`
	PenaltyDays         int        `json:"penalty_days"`
	PaymentStatus       string     `json:"payment_status"`
	IsPaid              bool       `json:"is_paid"`
	DueDate             *time.Time `json:"due_date,omitempty"`
	PaidDate            *time.Time `json:"paid_date,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
}

func buildCustomerInvoiceResponse(invoice models.Invoice, subscription *models.SubscriptionType, tenantSettings models.TenantSettings) customerInvoiceResponse {
	snapshot := services.CalculateInvoiceAmountSnapshot(invoice, subscription, tenantSettings, time.Time{})
	usageYear := 0
	if len(invoice.UsageMonth) >= 4 {
		parsedYear, err := time.Parse("2006", invoice.UsageMonth[:4])
		if err == nil {
			usageYear = parsedYear.Year()
		}
	}

	return customerInvoiceResponse{
		ID:                  invoice.ID,
		InvoiceNumber:       invoice.InvoiceNumber,
		CustomerID:          invoice.CustomerID,
		UsageMonth:          invoice.UsageMonth,
		UsageYear:           usageYear,
		PreviousReading:     0,
		CurrentReading:      0,
		UsageAmount:         invoice.UsageM3,
		WaterCharge:         invoice.WaterCharge,
		SubscriptionFee:     invoice.Abonemen,
		PenaltyAmount:       snapshot.PenaltyAmount,
		SubTotal:            snapshot.SubTotal,
		TotalAmount:         snapshot.TotalAmount,
		TotalPaid:           invoice.TotalPaid,
		RemainingAmount:     snapshot.RemainingAmount,
		StoredPenaltyAmount: snapshot.StoredPenaltyAmount,
		StoredTotalAmount:   snapshot.StoredTotalAmount,
		PenaltyDays:         snapshot.PenaltyDays,
		PaymentStatus:       strings.ToLower(string(services.DetermineInvoicePaymentStatus(invoice, snapshot))),
		IsPaid:              snapshot.RemainingAmount == 0 && invoice.TotalPaid >= snapshot.TotalAmount,
		DueDate:             invoice.DueDate,
		PaidDate:            invoice.PaidDate,
		CreatedAt:           invoice.CreatedAt,
	}
}

func GetCustomerProfile(c *gin.Context) {
	customerID := c.MustGet("customer_id").(uuid.UUID)
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	var customer models.Customer
	if err := config.DB.Preload("Subscription").
		Where("id = ? AND tenant_id = ?", customerID, tenantID).
		First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer tidak ditemukan"})
		return
	}

	// Return customer data without password
	response := gin.H{
		"id":           customer.ID,
		"meter_number": customer.MeterNumber,
		"name":         customer.Name,
		"email":        customer.Email,
		"address":      customer.Address,
		"phone":        customer.Phone,
		"subscription": customer.Subscription,
		"is_active":    customer.IsActive,
		"created_at":   customer.CreatedAt,
	}

	c.JSON(http.StatusOK, response)
}

func UpdateCustomerProfile(c *gin.Context) {
	customerID := c.MustGet("customer_id").(uuid.UUID)
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).
		First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer tidak ditemukan"})
		return
	}

	type UpdateProfileInput struct {
		Name    string `json:"name"`
		Address string `json:"address"`
		Phone   string `json:"phone"`
	}

	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update allowed fields
	if input.Name != "" {
		customer.Name = input.Name
	}
	if input.Address != "" {
		customer.Address = input.Address
	}
	if input.Phone != "" {
		customer.Phone = input.Phone
	}

	if err := config.DB.Model(&customer).Select("Name", "Address", "Phone").Updates(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profil"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profil berhasil diperbarui"})
}

func GetCustomerInvoices(c *gin.Context) {
	customerID := c.MustGet("customer_id").(uuid.UUID)
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	var invoices []models.Invoice
	if err := config.DB.Where("customer_id = ? AND tenant_id = ?", customerID, tenantID).
		Order("created_at desc").
		Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data tagihan"})
		return
	}

	var customer models.Customer
	if err := config.DB.Preload("Subscription").
		Where("id = ? AND tenant_id = ?", customerID, tenantID).
		First(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil profil pelanggan"})
		return
	}

	tenantSettings := services.LoadTenantSettings(tenantID)
	responses := make([]customerInvoiceResponse, len(invoices))
	for i, invoice := range invoices {
		responses[i] = buildCustomerInvoiceResponse(invoice, &customer.Subscription, tenantSettings)
	}

	c.JSON(http.StatusOK, responses)
}

func GetCustomerPayments(c *gin.Context) {
	customerID := c.MustGet("customer_id").(uuid.UUID)
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	var payments []models.Payment
	if err := config.DB.Preload("Invoice").
		Where("tenant_id = ? AND invoice_id IN (SELECT id FROM invoices WHERE customer_id = ?)", tenantID, customerID).
		Order("created_at desc").
		Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat pembayaran"})
		return
	}

	c.JSON(http.StatusOK, payments)
}

func GetCustomerWaterUsage(c *gin.Context) {
	customerID := c.MustGet("customer_id").(uuid.UUID)
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	var usage []models.WaterUsage
	if err := config.DB.Where("customer_id = ? AND tenant_id = ?", customerID, tenantID).
		Order("usage_month desc").
		Find(&usage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data penggunaan air"})
		return
	}

	c.JSON(http.StatusOK, usage)
}

func CustomerMakePayment(c *gin.Context) {
	customerID := c.MustGet("customer_id").(uuid.UUID)
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	type PaymentInput struct {
		InvoiceID uuid.UUID `json:"invoice_id" binding:"required"`
		Amount    float64   `json:"amount" binding:"required,min=0"`
	}

	var input PaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify invoice belongs to this customer
	var invoice models.Invoice
	if err := config.DB.Where("id = ? AND customer_id = ? AND tenant_id = ?",
		input.InvoiceID, customerID, tenantID).First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tagihan tidak ditemukan"})
		return
	}

	if invoice.IsPaid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tagihan sudah lunas"})
		return
	}

	var customer models.Customer
	if err := config.DB.Preload("Subscription").
		Where("id = ? AND tenant_id = ?", customerID, tenantID).
		First(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pelanggan"})
		return
	}

	snapshot := services.CalculateInvoiceAmountSnapshot(invoice, &customer.Subscription, services.LoadTenantSettings(tenantID), time.Now())
	if invoice.TotalPaid+input.Amount > snapshot.TotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":            "Pembayaran melebihi total tagihan",
			"remaining_amount": snapshot.RemainingAmount,
		})
		return
	}

	// Create payment record
	payment := models.Payment{
		InvoiceID: input.InvoiceID,
		Amount:    input.Amount,
		TenantID:  tenantID,
	}

	if err := config.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat pembayaran"})
		return
	}

	// Update invoice
	var totalPaid float64
	config.DB.Model(&models.Payment{}).
		Where("invoice_id = ? AND status != ?", input.InvoiceID, "voided").
		Select("COALESCE(SUM(amount), 0)").Scan(&totalPaid)

	invoice.TotalPaid = totalPaid
	services.ApplyInvoiceAmountSnapshot(&invoice, snapshot)
	invoice.IsPaid = totalPaid >= snapshot.TotalAmount
	if invoice.IsPaid {
		now := time.Now()
		invoice.PaidDate = &now
		invoice.PaymentStatus = models.PaymentStatusPaid
	} else if totalPaid > 0 {
		invoice.PaymentStatus = models.PaymentStatusPartial
		invoice.PaidDate = nil
	} else {
		invoice.PaymentStatus = models.PaymentStatusUnpaid
		invoice.PaidDate = nil
	}
	config.DB.Model(&invoice).Updates(map[string]interface{}{
		"sub_total":      invoice.SubTotal,
		"penalty_amount": invoice.PenaltyAmount,
		"total_amount":   invoice.TotalAmount,
		"total_paid":     invoice.TotalPaid,
		"is_paid":        invoice.IsPaid,
		"payment_status": invoice.PaymentStatus,
		"paid_date":      invoice.PaidDate,
	})

	// If registration invoice is now paid, activate customer
	if invoice.Type == "registration" && invoice.IsPaid {
		config.DB.Model(&models.Customer{}).
			Where("id = ?", customerID).
			Update("is_active", true)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Pembayaran berhasil dicatat",
		"payment_id": payment.ID,
		"total_paid": invoice.TotalPaid,
		"is_paid":    invoice.IsPaid,
	})
}

func ChangeCustomerPassword(c *gin.Context) {
	customerID := c.MustGet("customer_id").(uuid.UUID)
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	type ChangePasswordInput struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	var input ChangePasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).
		First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer tidak ditemukan"})
		return
	}

	// Verify current password
	if !utils.CheckPasswordHash(input.CurrentPassword, customer.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password saat ini salah"})
		return
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(input.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
		return
	}

	// Update password
	if err := config.DB.Model(&customer).Update("password", hashedPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah"})
}
