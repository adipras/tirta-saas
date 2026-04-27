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

func parsePaymentTimestamp(paymentDate string) (time.Time, error) {
	if paymentDate == "" {
		return time.Now(), nil
	}

	parsed, err := time.Parse("2006-01-02", paymentDate)
	if err != nil {
		return time.Time{}, err
	}

	return parsed, nil
}

func loadPaymentWithRelations(paymentID uuid.UUID, tenantID uuid.UUID) (*models.Payment, error) {
	var payment models.Payment
	if err := config.DB.
		Preload("Invoice.Customer").
		Preload("Invoice.Customer.Subscription").
		Preload("PaymentMethod").
		Where("id = ? AND tenant_id = ?", paymentID, tenantID).
		First(&payment).Error; err != nil {
		return nil, err
	}

	return &payment, nil
}

func buildPaymentReceiptResponse(payment *models.Payment) gin.H {
	dueDate := ""
	if payment.Invoice.DueDate != nil {
		dueDate = payment.Invoice.DueDate.Format(time.RFC3339)
	}

	paymentMethod := "cash"
	if payment.PaymentMethod != nil && payment.PaymentMethod.Type != "" {
		paymentMethod = payment.PaymentMethod.Type
	} else if payment.PaymentMethodType != "" {
		paymentMethod = payment.PaymentMethodType
	}

	snapshot, err := services.ResolveInvoiceSnapshotWithDB(config.DB, payment.Invoice, payment.PaidAt)
	if err != nil {
		snapshot = services.InvoiceAmountSnapshot{
			SubTotal:        payment.Invoice.SubTotal,
			PenaltyAmount:   payment.Invoice.PenaltyAmount,
			TotalAmount:     payment.Invoice.TotalAmount,
			TotalPaid:       payment.Invoice.TotalPaid,
			RemainingAmount: maxFloat(payment.Invoice.TotalAmount-payment.Invoice.TotalPaid, 0),
		}
	}

	var totalPaidBefore float64
	config.DB.Model(&models.Payment{}).
		Where(
			"invoice_id = ? AND status != ? AND (paid_at < ? OR (paid_at = ? AND created_at < ?))",
			payment.InvoiceID,
			"voided",
			payment.PaidAt,
			payment.PaidAt,
			payment.CreatedAt,
		).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalPaidBefore)

	totalPaidAfter := totalPaidBefore
	if payment.Status != "voided" {
		totalPaidAfter += payment.Amount
	}
	if totalPaidAfter > snapshot.TotalAmount {
		totalPaidAfter = snapshot.TotalAmount
	}

	remainingAfter := snapshot.TotalAmount - totalPaidAfter
	if remainingAfter < 0 {
		remainingAfter = 0
	}

	paymentCoverageType := "partial"
	invoicePaymentStatus := "partial"
	receiptStatus := services.DetermineInvoicePaymentStatus(models.Invoice{
		DueDate:   payment.Invoice.DueDate,
		TotalPaid: totalPaidAfter,
	}, services.InvoiceAmountSnapshot{
		TotalAmount:     snapshot.TotalAmount,
		RemainingAmount: remainingAfter,
		PenaltyDays:     snapshot.PenaltyDays,
	})
	if remainingAfter == 0 {
		paymentCoverageType = "full"
	}
	invoicePaymentStatus = strings.ToLower(string(receiptStatus))

	// Load tenant settings for receipt header and payment info
	tenantSettings := services.LoadTenantSettings(payment.Invoice.TenantID)

	bankName := tenantSettings.BankName
	bankAccountName := tenantSettings.BankAccountName
	bankAccountNo := tenantSettings.BankAccountNo
	var primaryBankAccount models.BankAccount
	if err := config.DB.
		Where("tenant_id = ? AND is_primary = ? AND is_active = ?", payment.Invoice.TenantID, true, true).
		First(&primaryBankAccount).Error; err == nil {
		bankName = primaryBankAccount.BankName
		bankAccountName = primaryBankAccount.AccountName
		bankAccountNo = primaryBankAccount.AccountNumber
	}

	// Load primary active QRIS image for the tenant
	qrisImageUrl := ""
	var primaryQR models.QRCode
	if err := config.DB.
		Where("tenant_id = ? AND is_primary = ? AND is_active = ?", payment.Invoice.TenantID, true, true).
		First(&primaryQR).Error; err == nil {
		qrisImageUrl = primaryQR.ImageURL
	}

	return gin.H{
		"id":            payment.ID,
		"payment_id":    payment.ID,
		"receiptNumber": fmt.Sprintf("RCT-%s", payment.ID.String()[:8]),
		"tenantInfo": gin.H{
			"companyName":     tenantSettings.CompanyName,
			"phone":           tenantSettings.Phone,
			"logoUrl":         tenantSettings.LogoURL,
			"footerText":      tenantSettings.InvoiceFooterText,
			"bankName":        bankName,
			"bankAccountName": bankAccountName,
			"bankAccountNo":   bankAccountNo,
			"qrisImageUrl":    qrisImageUrl,
		},
		"usageDetails": gin.H{
			"usageMonth": payment.Invoice.UsageMonth,
			"usageM3":    payment.Invoice.UsageM3,
		},
		"payment": gin.H{
			"id":              payment.ID,
			"invoiceId":       payment.InvoiceID,
			"amount":          payment.Amount,
			"paymentMethod":   paymentMethod,
			"paymentDate":     payment.PaidAt,
			"referenceNumber": payment.ReferenceNumber,
			"notes":           payment.Notes,
			"status":          payment.Status,
			"invoiceNumber":   payment.Invoice.InvoiceNumber,
			"customerName":    payment.Invoice.Customer.Name,
			"createdAt":       payment.CreatedAt,
			"updatedAt":       payment.UpdatedAt,
		},
		"invoiceDetails": gin.H{
			"invoiceNumber":        payment.Invoice.InvoiceNumber,
			"invoiceDate":          payment.Invoice.CreatedAt,
			"dueDate":              dueDate,
			"invoiceType":          payment.Invoice.Type,
			"items":                payment.Invoice.GetManualItems(),
			"notes":                payment.Invoice.Notes,
			"subTotal":             snapshot.SubTotal,
			"penaltyAmount":        snapshot.PenaltyAmount,
			"totalAmount":          snapshot.TotalAmount,
			"totalPaidBefore":      totalPaidBefore,
			"totalPaidAfter":       totalPaidAfter,
			"remainingAmount":      remainingAfter,
			"paymentCoverageType":  paymentCoverageType,
			"invoicePaymentStatus": invoicePaymentStatus,
		},
		"customerDetails": gin.H{
			"name":        payment.Invoice.Customer.Name,
			"address":     payment.Invoice.Customer.Address,
			"phone":       payment.Invoice.Customer.Phone,
			"meterNumber": payment.Invoice.Customer.MeterNumber,
		},
		"generatedAt": time.Now(),
	}
}

func maxFloat(value, min float64) float64 {
	if value < min {
		return min
	}

	return value
}

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

	paidAt, err := parsePaymentTimestamp(req.PaymentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal pembayaran tidak valid"})
		return
	}

	snapshot, err := services.ResolveInvoiceSnapshotWithDB(config.DB, invoice, paidAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total tagihan terkini"})
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

	if invoice.TotalPaid+req.Amount > snapshot.TotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Pembayaran melebihi total tagihan. Sisa tagihan: %.2f", snapshot.RemainingAmount),
		})
		return
	}

	normalizedPaymentMethod := strings.TrimSpace(strings.ToLower(req.PaymentMethod))
	var paymentMethodID *uuid.UUID
	if normalizedPaymentMethod != "" {
		var paymentMethod models.PaymentMethod
		if err := config.DB.
			Where("tenant_id = ? AND type = ? AND is_active = ?", tenantID, normalizedPaymentMethod, true).
			Order("display_order asc, created_at asc").
			First(&paymentMethod).Error; err == nil {
			paymentMethodID = &paymentMethod.ID
		}
	}

	var receivedBy *uuid.UUID
	if userIDValue, exists := c.Get("user_id"); exists {
		if userID, ok := userIDValue.(uuid.UUID); ok {
			receivedBy = &userID
		}
	}

	payment := models.Payment{
		InvoiceID:         req.InvoiceID,
		Amount:            req.Amount,
		TenantID:          tenantID,
		PaidAt:            paidAt,
		PaymentMethodID:   paymentMethodID,
		PaymentMethodType: normalizedPaymentMethod,
		ReceivedBy:        receivedBy,
		ReferenceNumber:   strings.TrimSpace(req.ReferenceNumber),
		Notes:             strings.TrimSpace(req.Notes),
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat pembayaran"})
		return
	}

	if _, err := services.SyncInvoicePaymentState(tx, &invoice, paidAt); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status invoice"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan pembayaran"})
		return
	}

	// Kirim response
	res := responses.PaymentResponse{
		ID:              payment.ID,
		InvoiceID:       payment.InvoiceID,
		Amount:          payment.Amount,
		PaidAt:          payment.PaidAt,
		PaymentMethod:   normalizedPaymentMethod,
		ReferenceNumber: payment.ReferenceNumber,
		Notes:           payment.Notes,
		Status:          payment.Status,
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
	query := config.DB.Preload("Invoice.Customer").Preload("PaymentMethod")

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
	c.JSON(http.StatusMethodNotAllowed, gin.H{
		"error": "Pembayaran yang sudah tercatat tidak dapat diedit. Gunakan void lalu catat ulang pembayaran yang benar.",
	})
}

func DeletePayment(c *gin.Context) {
	c.JSON(http.StatusMethodNotAllowed, gin.H{
		"error": "Pembayaran yang sudah tercatat tidak dapat dihapus. Gunakan void untuk membatalkan pembayaran.",
	})
}

func VoidPayment(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pembayaran tidak valid"})
		return
	}

	payment, err := loadPaymentWithRelations(paymentID, tenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pembayaran tidak ditemukan"})
		return
	}

	if payment.Status == "voided" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pembayaran sudah dibatalkan"})
		return
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	payment.Status = "voided"
	if err := tx.Model(payment).Update("status", payment.Status).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membatalkan pembayaran"})
		return
	}

	var invoice models.Invoice
	if err := tx.Where("id = ? AND tenant_id = ?", payment.InvoiceID, tenantID).First(&invoice).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil invoice terkait"})
		return
	}

	if _, err := services.SyncInvoicePaymentState(tx, &invoice, time.Now()); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status invoice"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan pembatalan pembayaran"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pembayaran berhasil dibatalkan",
		"data":    payment,
	})
}

func GetPaymentReceipt(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pembayaran tidak valid"})
		return
	}

	payment, err := loadPaymentWithRelations(paymentID, tenantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pembayaran tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, buildPaymentReceiptResponse(payment))
}

func GeneratePaymentReceipt(c *gin.Context) {
	GetPaymentReceipt(c)
}
