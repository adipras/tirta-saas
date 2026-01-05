package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SubmitPaymentProof godoc
// @Summary Submit payment proof for invoice
// @Description Customer submits payment proof with image for invoice payment
// @Tags Payment Proof
// @Accept multipart/form-data
// @Produce json
// @Param invoice_id formData string true "Invoice ID"
// @Param amount formData number true "Payment amount"
// @Param payment_date formData string true "Payment date (YYYY-MM-DD)"
// @Param payment_method formData string true "Payment method (bank_transfer, e_wallet, cash)"
// @Param account_name formData string true "Account name"
// @Param account_number formData string false "Account number"
// @Param reference_number formData string false "Reference number"
// @Param notes formData string false "Notes"
// @Param proof_image formData file true "Payment proof image (max 5MB)"
// @Security BearerAuth
// @Success 201 {object} responses.PaymentProofResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/payment-proofs [post]
func SubmitPaymentProof(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse form data
	invoiceIDStr := c.PostForm("invoice_id")
	amountStr := c.PostForm("amount")
	paymentDateStr := c.PostForm("payment_date")
	paymentMethod := c.PostForm("payment_method")
	accountName := c.PostForm("account_name")
	accountNumber := c.PostForm("account_number")
	referenceNumber := c.PostForm("reference_number")
	notes := c.PostForm("notes")

	// Validate required fields
	if invoiceIDStr == "" || amountStr == "" || paymentDateStr == "" || paymentMethod == "" || accountName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	invoiceID, err := uuid.Parse(invoiceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid amount"})
		return
	}

	paymentDate, err := time.Parse("2006-01-02", paymentDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment date format (use YYYY-MM-DD)"})
		return
	}

	// Get invoice and validate
	var invoice models.Invoice
	if err := config.DB.Preload("Customer").Where("id = ? AND tenant_id = ?", invoiceID, tenantID).First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	if invoice.PaymentStatus == models.PaymentStatusPaid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice already paid"})
		return
	}

	// Check if there's already a pending payment proof for this invoice
	var existingProof models.PaymentProof
	if err := config.DB.Where("invoice_id = ? AND status = ?", invoiceID, models.PaymentProofStatusPending).First(&existingProof).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "There is already a pending payment proof for this invoice"})
		return
	}

	// Handle file upload
	file, err := c.FormFile("proof_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment proof image is required"})
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 5MB limit"})
		return
	}

	// Validate file type
	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only JPG, PNG, and PDF are allowed"})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("payment-proof-%s-%d%s", invoiceID.String(), time.Now().Unix(), ext)
	uploadPath := "uploads/payment-proofs/" + filename

	// Save file
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}

	// Create payment proof record
	paymentProof := models.PaymentProof{
		TenantID:        tenantID,
		InvoiceID:       invoiceID,
		CustomerID:      invoice.CustomerID,
		Amount:          amount,
		PaymentDate:     paymentDate,
		PaymentMethod:   paymentMethod,
		AccountName:     accountName,
		AccountNumber:   accountNumber,
		ReferenceNumber: referenceNumber,
		ProofImageURL:   "/" + uploadPath,
		Notes:           notes,
		Status:          models.PaymentProofStatusPending,
	}

	if err := config.DB.Create(&paymentProof).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment proof: " + err.Error()})
		return
	}

	// Load relations
	config.DB.Preload("Invoice").Preload("Customer").First(&paymentProof, paymentProof.ID)

	// Build response
	response := responses.PaymentProofResponse{
		ID:              paymentProof.ID,
		InvoiceID:       paymentProof.InvoiceID,
		InvoiceNumber:   paymentProof.Invoice.InvoiceNumber,
		CustomerID:      paymentProof.CustomerID,
		CustomerName:    paymentProof.Customer.Name,
		TenantID:        paymentProof.TenantID,
		Amount:          paymentProof.Amount,
		PaymentDate:     paymentProof.PaymentDate,
		PaymentMethod:   paymentProof.PaymentMethod,
		AccountName:     paymentProof.AccountName,
		AccountNumber:   paymentProof.AccountNumber,
		ReferenceNumber: paymentProof.ReferenceNumber,
		ProofImageURL:   paymentProof.ProofImageURL,
		Notes:           paymentProof.Notes,
		Status:          responses.PaymentProofStatus(paymentProof.Status),
		SubmittedAt:     paymentProof.SubmittedAt,
		CreatedAt:       paymentProof.CreatedAt,
		UpdatedAt:       paymentProof.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetPaymentProofs godoc
// @Summary List payment proofs
// @Description Get list of payment proofs with optional filtering
// @Tags Payment Proof
// @Produce json
// @Param status query string false "Filter by status (PENDING, VERIFIED, REJECTED)"
// @Param invoice_id query string false "Filter by invoice ID"
// @Param page query int false "Page number (default: 1)"
// @Param per_page query int false "Items per page (default: 10)"
// @Security BearerAuth
// @Success 200 {object} responses.PaymentProofListResponse
// @Router /api/payment-proofs [get]
func GetPaymentProofs(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse query params
	status := c.Query("status")
	invoiceIDStr := c.Query("invoice_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	offset := (page - 1) * perPage

	// Build query
	query := config.DB.Model(&models.PaymentProof{}).Where("tenant_id = ?", tenantID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if invoiceIDStr != "" {
		invoiceID, err := uuid.Parse(invoiceIDStr)
		if err == nil {
			query = query.Where("invoice_id = ?", invoiceID)
		}
	}

	// Count total
	var total int64
	query.Count(&total)

	// Get payment proofs
	var paymentProofs []models.PaymentProof
	if err := query.
		Preload("Invoice").
		Preload("Customer").
		Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&paymentProofs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment proofs"})
		return
	}

	// Build response
	proofResponses := make([]responses.PaymentProofResponse, len(paymentProofs))
	for i, proof := range paymentProofs {
		proofResponses[i] = responses.PaymentProofResponse{
			ID:              proof.ID,
			InvoiceID:       proof.InvoiceID,
			InvoiceNumber:   proof.Invoice.InvoiceNumber,
			CustomerID:      proof.CustomerID,
			CustomerName:    proof.Customer.Name,
			TenantID:        proof.TenantID,
			Amount:          proof.Amount,
			PaymentDate:     proof.PaymentDate,
			PaymentMethod:   proof.PaymentMethod,
			AccountName:     proof.AccountName,
			AccountNumber:   proof.AccountNumber,
			ReferenceNumber: proof.ReferenceNumber,
			ProofImageURL:   proof.ProofImageURL,
			Notes:           proof.Notes,
			Status:          responses.PaymentProofStatus(proof.Status),
			SubmittedAt:     proof.SubmittedAt,
			VerifiedBy:      proof.VerifiedBy,
			VerifiedAt:      proof.VerifiedAt,
			RejectionReason: proof.RejectionReason,
			CreatedAt:       proof.CreatedAt,
			UpdatedAt:       proof.UpdatedAt,
		}
	}

	response := responses.PaymentProofListResponse{
		PaymentProofs: proofResponses,
		Total:         total,
		Page:          page,
		PerPage:       perPage,
	}

	c.JSON(http.StatusOK, response)
}

// GetPaymentProof godoc
// @Summary Get payment proof by ID
// @Description Get detailed information of a payment proof
// @Tags Payment Proof
// @Produce json
// @Param id path string true "Payment Proof ID"
// @Security BearerAuth
// @Success 200 {object} responses.PaymentProofResponse
// @Router /api/payment-proofs/{id} [get]
func GetPaymentProof(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment proof ID"})
		return
	}

	var paymentProof models.PaymentProof
	if err := config.DB.
		Preload("Invoice").
		Preload("Customer").
		Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&paymentProof).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment proof not found"})
		return
	}

	response := responses.PaymentProofResponse{
		ID:              paymentProof.ID,
		InvoiceID:       paymentProof.InvoiceID,
		InvoiceNumber:   paymentProof.Invoice.InvoiceNumber,
		CustomerID:      paymentProof.CustomerID,
		CustomerName:    paymentProof.Customer.Name,
		TenantID:        paymentProof.TenantID,
		Amount:          paymentProof.Amount,
		PaymentDate:     paymentProof.PaymentDate,
		PaymentMethod:   paymentProof.PaymentMethod,
		AccountName:     paymentProof.AccountName,
		AccountNumber:   paymentProof.AccountNumber,
		ReferenceNumber: paymentProof.ReferenceNumber,
		ProofImageURL:   paymentProof.ProofImageURL,
		Notes:           paymentProof.Notes,
		Status:          responses.PaymentProofStatus(paymentProof.Status),
		SubmittedAt:     paymentProof.SubmittedAt,
		VerifiedBy:      paymentProof.VerifiedBy,
		VerifiedAt:      paymentProof.VerifiedAt,
		RejectionReason: paymentProof.RejectionReason,
		CreatedAt:       paymentProof.CreatedAt,
		UpdatedAt:       paymentProof.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// VerifyPaymentProof godoc
// @Summary Verify payment proof (Admin only)
// @Description Admin verifies payment proof and updates invoice payment status
// @Tags Payment Proof
// @Accept json
// @Produce json
// @Param id path string true "Payment Proof ID"
// @Param request body requests.VerifyPaymentRequest false "Verification notes"
// @Security BearerAuth
// @Success 200 {object} responses.PaymentProofResponse
// @Router /api/payment-proofs/{id}/verify [post]
func VerifyPaymentProof(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	verifierID := userID.(uuid.UUID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment proof ID"})
		return
	}

	var req requests.VerifyPaymentRequest
	c.ShouldBindJSON(&req)

	// Get payment proof
	var paymentProof models.PaymentProof
	if err := config.DB.
		Preload("Invoice").
		Preload("Customer").
		Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&paymentProof).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment proof not found"})
		return
	}

	if paymentProof.Status != models.PaymentProofStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment proof already processed"})
		return
	}

	// Begin transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update payment proof status
	now := time.Now()
	paymentProof.Status = models.PaymentProofStatusVerified
	paymentProof.VerifiedBy = &verifierID
	paymentProof.VerifiedAt = &now
	if req.Notes != "" {
		paymentProof.Notes = req.Notes
	}

	if err := tx.Save(&paymentProof).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify payment proof"})
		return
	}

	// Create payment record
	payment := models.Payment{
		TenantID:        tenantID,
		InvoiceID:       paymentProof.InvoiceID,
		Amount:          paymentProof.Amount,
		PaidAt:          paymentProof.PaymentDate,
		ReferenceNumber: paymentProof.ReferenceNumber,
		ProofImageURL:   paymentProof.ProofImageURL,
		Notes:           paymentProof.Notes,
		ReceivedBy:      &verifierID,
		VerifiedBy:      &verifierID,
		VerifiedAt:      &now,
		Status:          "verified",
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment record"})
		return
	}

	// Update invoice payment status
	invoice := paymentProof.Invoice
	invoice.TotalPaid += paymentProof.Amount

	if invoice.TotalPaid >= invoice.TotalAmount {
		invoice.PaymentStatus = models.PaymentStatusPaid
		invoice.IsPaid = true
		invoice.PaidDate = &now
	} else {
		invoice.PaymentStatus = models.PaymentStatusPartial
	}

	if err := tx.Save(&invoice).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Reload with relations
	config.DB.Preload("Invoice").Preload("Customer").First(&paymentProof, paymentProof.ID)

	response := responses.PaymentProofResponse{
		ID:              paymentProof.ID,
		InvoiceID:       paymentProof.InvoiceID,
		InvoiceNumber:   paymentProof.Invoice.InvoiceNumber,
		CustomerID:      paymentProof.CustomerID,
		CustomerName:    paymentProof.Customer.Name,
		TenantID:        paymentProof.TenantID,
		Amount:          paymentProof.Amount,
		PaymentDate:     paymentProof.PaymentDate,
		PaymentMethod:   paymentProof.PaymentMethod,
		AccountName:     paymentProof.AccountName,
		AccountNumber:   paymentProof.AccountNumber,
		ReferenceNumber: paymentProof.ReferenceNumber,
		ProofImageURL:   paymentProof.ProofImageURL,
		Notes:           paymentProof.Notes,
		Status:          responses.PaymentProofStatus(paymentProof.Status),
		SubmittedAt:     paymentProof.SubmittedAt,
		VerifiedBy:      paymentProof.VerifiedBy,
		VerifiedAt:      paymentProof.VerifiedAt,
		CreatedAt:       paymentProof.CreatedAt,
		UpdatedAt:       paymentProof.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// RejectPaymentProof godoc
// @Summary Reject payment proof (Admin only)
// @Description Admin rejects payment proof with reason
// @Tags Payment Proof
// @Accept json
// @Produce json
// @Param id path string true "Payment Proof ID"
// @Param request body requests.RejectPaymentRequest true "Rejection reason"
// @Security BearerAuth
// @Success 200 {object} responses.PaymentProofResponse
// @Router /api/payment-proofs/{id}/reject [post]
func RejectPaymentProof(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	verifierID := userID.(uuid.UUID)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment proof ID"})
		return
	}

	var req requests.RejectPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get payment proof
	var paymentProof models.PaymentProof
	if err := config.DB.
		Preload("Invoice").
		Preload("Customer").
		Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&paymentProof).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment proof not found"})
		return
	}

	if paymentProof.Status != models.PaymentProofStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment proof already processed"})
		return
	}

	// Update payment proof status
	now := time.Now()
	paymentProof.Status = models.PaymentProofStatusRejected
	paymentProof.VerifiedBy = &verifierID
	paymentProof.VerifiedAt = &now
	paymentProof.RejectionReason = req.RejectionReason

	if err := config.DB.Save(&paymentProof).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject payment proof"})
		return
	}

	response := responses.PaymentProofResponse{
		ID:              paymentProof.ID,
		InvoiceID:       paymentProof.InvoiceID,
		InvoiceNumber:   paymentProof.Invoice.InvoiceNumber,
		CustomerID:      paymentProof.CustomerID,
		CustomerName:    paymentProof.Customer.Name,
		TenantID:        paymentProof.TenantID,
		Amount:          paymentProof.Amount,
		PaymentDate:     paymentProof.PaymentDate,
		PaymentMethod:   paymentProof.PaymentMethod,
		AccountName:     paymentProof.AccountName,
		AccountNumber:   paymentProof.AccountNumber,
		ReferenceNumber: paymentProof.ReferenceNumber,
		ProofImageURL:   paymentProof.ProofImageURL,
		Notes:           paymentProof.Notes,
		Status:          responses.PaymentProofStatus(paymentProof.Status),
		SubmittedAt:     paymentProof.SubmittedAt,
		VerifiedBy:      paymentProof.VerifiedBy,
		VerifiedAt:      paymentProof.VerifiedAt,
		RejectionReason: paymentProof.RejectionReason,
		CreatedAt:       paymentProof.CreatedAt,
		UpdatedAt:       paymentProof.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}
