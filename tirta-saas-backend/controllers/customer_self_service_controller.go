package controllers

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

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
		"id":            customer.ID,
		"meter_number":  customer.MeterNumber,
		"name":          customer.Name,
		"email":         customer.Email,
		"address":       customer.Address,
		"phone":         customer.Phone,
		"subscription":  customer.Subscription,
		"is_active":     customer.IsActive,
		"created_at":    customer.CreatedAt,
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

	if err := config.DB.Save(&customer).Error; err != nil {
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

	c.JSON(http.StatusOK, invoices)
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

	if invoice.TotalPaid+input.Amount > invoice.TotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Pembayaran melebihi total tagihan",
			"remaining_amount": invoice.TotalAmount - invoice.TotalPaid,
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
		Where("invoice_id = ?", input.InvoiceID).
		Select("SUM(amount)").Scan(&totalPaid)

	invoice.TotalPaid = totalPaid
	invoice.IsPaid = totalPaid >= invoice.TotalAmount
	config.DB.Save(&invoice)

	// If registration invoice is now paid, activate customer
	if invoice.Type == "registration" && invoice.IsPaid {
		config.DB.Model(&models.Customer{}).
			Where("id = ?", customerID).
			Update("is_active", true)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Pembayaran berhasil dicatat",
		"payment_id":  payment.ID,
		"total_paid":  invoice.TotalPaid,
		"is_paid":     invoice.IsPaid,
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
	customer.Password = hashedPassword
	if err := config.DB.Save(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah"})
}