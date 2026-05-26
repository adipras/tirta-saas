package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/pkg/audit"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/services"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func buildPaymentProofFileURL(proof *models.PaymentProof) string {
	ext := utils.GetFileExtension(proof.ProofImageURL)
	if ext == "" {
		ext = ".bin"
	}

	return fmt.Sprintf("/api/payment-proofs/%s/file/proof%s", proof.ID.String(), ext)
}

func buildPaymentProofResponse(proof *models.PaymentProof) responses.PaymentProofResponse {
	return responses.PaymentProofResponse{
		ID:                      proof.ID,
		InvoiceID:               proof.InvoiceID,
		InvoiceNumber:           proof.Invoice.InvoiceNumber,
		CustomerID:              proof.CustomerID,
		CustomerName:            proof.Customer.Name,
		TenantID:                proof.TenantID,
		Amount:                  proof.Amount,
		PaymentDate:             proof.PaymentDate,
		PaymentMethod:           proof.PaymentMethod,
		AccountName:             proof.AccountName,
		AccountNumber:           proof.AccountNumber,
		ReferenceNumber:         proof.ReferenceNumber,
		ProofImageURL:           buildPaymentProofFileURL(proof),
		Notes:                   proof.Notes,
		SnapshotSubTotal:        proof.SnapshotSubTotal,
		SnapshotPenaltyAmount:   proof.SnapshotPenaltyAmount,
		SnapshotTotalAmount:     proof.SnapshotTotalAmount,
		SnapshotRemainingAmount: proof.SnapshotRemainingAmount,
		SnapshotCapturedAt:      proof.SnapshotCapturedAt,
		Status:                  responses.PaymentProofStatus(proof.Status),
		SubmittedAt:             proof.SubmittedAt,
		VerifiedBy:              proof.VerifiedBy,
		VerifiedAt:              proof.VerifiedAt,
		RejectionReason:         proof.RejectionReason,
		CreatedAt:               proof.CreatedAt,
		UpdatedAt:               proof.UpdatedAt,
	}
}

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
	if err := config.DB.Preload("Customer").Preload("Customer.Subscription").Where("id = ? AND tenant_id = ?", invoiceID, tenantID).First(&invoice).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	if invoice.PaymentStatus == models.PaymentStatusPaid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice already paid"})
		return
	}

	snapshot := services.CalculateInvoiceAmountSnapshot(invoice, &invoice.Customer.Subscription, services.LoadTenantSettings(tenantID), paymentDate)
	if invoice.TotalPaid+amount > snapshot.TotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":            "Payment amount exceeds the current invoice balance",
			"remaining_amount": snapshot.RemainingAmount,
		})
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

	uploadConfig := utils.DefaultProofUploadConfig()
	uploadConfig.UploadDir = fmt.Sprintf("storage/private/payment-proofs/%s", tenantID.String())
	uploadPath, err := utils.SaveUploadedFile(file, uploadConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file: " + err.Error()})
		return
	}

	// Create payment proof record
	paymentProof := models.PaymentProof{
		TenantID:                tenantID,
		InvoiceID:               invoiceID,
		CustomerID:              invoice.CustomerID,
		Amount:                  amount,
		PaymentDate:             paymentDate,
		PaymentMethod:           paymentMethod,
		AccountName:             accountName,
		AccountNumber:           accountNumber,
		ReferenceNumber:         referenceNumber,
		ProofImageURL:           uploadPath,
		Notes:                   notes,
		SnapshotSubTotal:        snapshot.SubTotal,
		SnapshotPenaltyAmount:   snapshot.PenaltyAmount,
		SnapshotTotalAmount:     snapshot.TotalAmount,
		SnapshotRemainingAmount: snapshot.RemainingAmount,
		SnapshotCapturedAt:      snapshot.ReferenceAt,
		Status:                  models.PaymentProofStatusPending,
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&paymentProof).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment proof: " + err.Error()})
		return
	}

	subject, body := services.BuildPaymentProofSubmittedNotification(invoice.Customer.Name, invoice.InvoiceNumber, amount)
	if err := services.NotifyTenantUsersByRoles(
		tx,
		tenantID,
		[]constants.UserRole{constants.RoleTenantAdmin, constants.RoleFinance},
		subject,
		body,
		map[string]interface{}{
			"payment_proof_id": paymentProof.ID.String(),
			"invoice_id":       invoice.ID.String(),
			"invoice_number":   invoice.InvoiceNumber,
			"customer_id":      invoice.CustomerID.String(),
		},
	); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create in-app notification"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit payment proof"})
		return
	}

	// Load relations
	config.DB.Preload("Invoice").Preload("Customer").First(&paymentProof, paymentProof.ID)
	audit.LogPaymentProofSubmission(c, paymentProof.ID, paymentProof.InvoiceID, paymentProof.Amount)

	helpers.RespondCreated(c, "Bukti pembayaran berhasil dikirim", buildPaymentProofResponse(&paymentProof))
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
		proofResponses[i] = buildPaymentProofResponse(&proof)
	}

	response := responses.PaymentProofListResponse{
		PaymentProofs: proofResponses,
		Total:         total,
		Page:          page,
		PerPage:       perPage,
	}

	helpers.RespondSuccess(c, "Daftar bukti pembayaran berhasil diambil", response)
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
		Preload("Invoice.Customer").
		Preload("Invoice.Customer.Subscription").
		Preload("Customer").
		Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&paymentProof).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment proof not found"})
		return
	}

	helpers.RespondSuccess(c, "Detail bukti pembayaran berhasil diambil", buildPaymentProofResponse(&paymentProof))
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
		Preload("Invoice.Customer").
		Preload("Invoice.Customer.Subscription").
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
	previousStatus := string(paymentProof.Status)

	snapshot := services.CalculateInvoiceAmountSnapshot(
		paymentProof.Invoice,
		&paymentProof.Invoice.Customer.Subscription,
		services.LoadTenantSettings(tenantID),
		paymentProof.PaymentDate,
	)
	if err := services.ValidateStoredSnapshot(
		snapshot,
		paymentProof.SnapshotSubTotal,
		paymentProof.SnapshotPenaltyAmount,
		paymentProof.SnapshotTotalAmount,
		paymentProof.SnapshotRemainingAmount,
	); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Snapshot tagihan sudah berubah sejak konfirmasi dikirim. Minta pelanggan checkout atau kirim konfirmasi ulang.",
		})
		return
	}

	if paymentProof.Invoice.TotalPaid+paymentProof.Amount > paymentProof.SnapshotTotalAmount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":            "Payment proof amount exceeds the frozen invoice balance",
			"remaining_amount": paymentProof.SnapshotRemainingAmount,
		})
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
		TenantID:          tenantID,
		InvoiceID:         paymentProof.InvoiceID,
		Amount:            paymentProof.Amount,
		PaidAt:            paymentProof.PaymentDate,
		PaymentMethodType: paymentProof.PaymentMethod,
		ReferenceNumber:   paymentProof.ReferenceNumber,
		ProofImageURL:     paymentProof.ProofImageURL,
		Notes:             paymentProof.Notes,
		ReceivedBy:        &verifierID,
		VerifiedBy:        &verifierID,
		VerifiedAt:        &now,
		Status:            "verified",
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment record"})
		return
	}

	invoice := paymentProof.Invoice
	if _, err := services.SyncInvoicePaymentState(tx, &invoice, paymentProof.PaymentDate); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice"})
		return
	}

	// Commit transaction
	subject, body := services.BuildPaymentProofVerifiedNotification(paymentProof.Invoice.InvoiceNumber, paymentProof.Amount)
	if err := services.CreateInAppNotification(tx, services.CreateInAppNotificationInput{
		TenantID:      tenantID,
		RecipientType: "CUSTOMER",
		RecipientID:   paymentProof.CustomerID,
		RecipientName: paymentProof.Customer.Name,
		Subject:       subject,
		Body:          body,
		Metadata: map[string]interface{}{
			"payment_proof_id": paymentProof.ID.String(),
			"invoice_id":       paymentProof.InvoiceID.String(),
			"invoice_number":   paymentProof.Invoice.InvoiceNumber,
		},
	}); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create in-app notification"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Reload with relations
	config.DB.Preload("Invoice").Preload("Customer").First(&paymentProof, paymentProof.ID)
	audit.LogPaymentProofVerification(
		c,
		paymentProof.ID,
		paymentProof.InvoiceID,
		payment.ID,
		paymentProof.Amount,
		previousStatus,
		string(paymentProof.Status),
	)

	helpers.RespondSuccess(c, "Bukti pembayaran berhasil diverifikasi", buildPaymentProofResponse(&paymentProof))
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
	previousStatus := string(paymentProof.Status)

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update payment proof status
	now := time.Now()
	paymentProof.Status = models.PaymentProofStatusRejected
	paymentProof.VerifiedBy = &verifierID
	paymentProof.VerifiedAt = &now
	paymentProof.RejectionReason = req.RejectionReason

	if err := tx.Model(&paymentProof).Select("Status", "VerifiedBy", "VerifiedAt", "RejectionReason").Updates(&paymentProof).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject payment proof"})
		return
	}

	subject, body := services.BuildPaymentProofRejectedNotification(paymentProof.Invoice.InvoiceNumber, req.RejectionReason)
	if err := services.CreateInAppNotification(tx, services.CreateInAppNotificationInput{
		TenantID:      tenantID,
		RecipientType: "CUSTOMER",
		RecipientID:   paymentProof.CustomerID,
		RecipientName: paymentProof.Customer.Name,
		Subject:       subject,
		Body:          body,
		Metadata: map[string]interface{}{
			"payment_proof_id": paymentProof.ID.String(),
			"invoice_id":       paymentProof.InvoiceID.String(),
			"invoice_number":   paymentProof.Invoice.InvoiceNumber,
			"status":           string(paymentProof.Status),
		},
	}); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create in-app notification"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit payment proof rejection"})
		return
	}

	audit.LogPaymentProofRejection(c, paymentProof.ID, paymentProof.InvoiceID, previousStatus, req.RejectionReason)
	helpers.RespondSuccess(c, "Bukti pembayaran berhasil ditolak", buildPaymentProofResponse(&paymentProof))
}

func DownloadPaymentProofFile(c *gin.Context) {
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
	if err := config.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&paymentProof).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment proof not found"})
		return
	}

	downloadName := "payment-proof" + utils.GetFileExtension(paymentProof.ProofImageURL)
	if err := utils.ServeStoredFile(c, paymentProof.ProofImageURL, downloadName); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment proof file not found"})
	}
}
