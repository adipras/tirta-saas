package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SubmitSubscriptionPayment handles tenant submission of subscription payment
func SubmitSubscriptionPayment(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found"})
		return
	}

	// Parse form data
	subscriptionPlan := c.PostForm("subscription_plan")
	billingPeriod := c.PostForm("billing_period")
	amount := c.PostForm("amount")
	paymentDate := c.PostForm("payment_date")
	paymentMethod := c.PostForm("payment_method")
	accountName := c.PostForm("account_name")
	accountNumber := c.PostForm("account_number")
	referenceNumber := c.PostForm("reference_number")
	notes := c.PostForm("notes")

	// Validate required fields
	if subscriptionPlan == "" || billingPeriod == "" || amount == "" || paymentDate == "" || paymentMethod == "" || accountName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	// Parse values
	billingPeriodInt, err := strconv.Atoi(billingPeriod)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid billing period"})
		return
	}

	amountFloat, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid amount"})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", paymentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment date format"})
		return
	}

	// Check if payment date is not in future
	if parsedDate.After(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment date cannot be in the future"})
		return
	}

	// Handle file upload for proof
	file, err := c.FormFile("proof_file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Proof file is required"})
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must not exceed 5MB"})
		return
	}

	// Validate file type
	ext := file.Filename[len(file.Filename)-4:]
	if ext != ".jpg" && ext != ".png" && ext != ".pdf" && ext != "jpeg" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only JPG, PNG, and PDF files are allowed"})
		return
	}

	// Save file
	filename := fmt.Sprintf("subscription_%s_%s%s", tenantID, uuid.New().String()[:8], ext)
	uploadPath := fmt.Sprintf("./uploads/subscription-proofs/%s", filename)
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Create payment record
	payment := models.SubscriptionPayment{
		TenantID:         tenantID,
		SubscriptionPlan: subscriptionPlan,
		BillingPeriod:    billingPeriodInt,
		Amount:           amountFloat,
		PaymentDate:      parsedDate,
		PaymentMethod:    paymentMethod,
		AccountNumber:    accountNumber,
		AccountName:      accountName,
		ReferenceNumber:  referenceNumber,
		ProofURL:         uploadPath,
		Notes:            notes,
		Status:           models.PaymentStatusPending,
	}

	if err := config.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment record"})
		return
	}

	// Update tenant status to PENDING_VERIFICATION
	config.DB.Model(&models.Tenant{}).Where("id = ?", tenantID).Updates(map[string]interface{}{
		"status":            models.TenantStatusPendingVerification,
		"payment_proof_url": uploadPath,
	})

	confirmationID := fmt.Sprintf("SUB-%s-%s", time.Now().Format("20060102"), payment.ID.String()[:8])

	c.JSON(http.StatusCreated, responses.SubmitPaymentResponse{
		ID:             payment.ID.String(),
		ConfirmationID: confirmationID,
		Status:         string(payment.Status),
		Message:        "Payment submitted successfully. Waiting for verification.",
	})
}

// GetSubscriptionPayments lists all subscription payments (Platform Owner only)
func GetSubscriptionPayments(c *gin.Context) {
	status := c.Query("status")
	tenantID := c.Query("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	query := config.DB.Model(&models.SubscriptionPayment{}).Preload("Tenant")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}

	var total int64
	query.Count(&total)

	var payments []models.SubscriptionPayment
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}

	var data []responses.SubscriptionPaymentResponse
	for _, p := range payments {
		resp := responses.SubscriptionPaymentResponse{
			ID:               p.ID.String(),
			TenantID:         p.TenantID,
			SubscriptionPlan: p.SubscriptionPlan,
			BillingPeriod:    p.BillingPeriod,
			Amount:           p.Amount,
			PaymentDate:      p.PaymentDate,
			PaymentMethod:    p.PaymentMethod,
			AccountNumber:    p.AccountNumber,
			AccountName:      p.AccountName,
			ReferenceNumber:  p.ReferenceNumber,
			ProofURL:         p.ProofURL,
			Notes:            p.Notes,
			Status:           string(p.Status),
			VerifiedAt:       p.VerifiedAt,
			VerifiedBy:       p.VerifiedBy,
			RejectionReason:  p.RejectionReason,
			CreatedAt:        p.CreatedAt,
			UpdatedAt:        p.UpdatedAt,
		}
		if p.Tenant != nil {
			resp.TenantName = p.Tenant.Name
			resp.TenantEmail = p.Tenant.Email
		}
		data = append(data, resp)
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, responses.SubscriptionPaymentListResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

// GetSubscriptionPaymentDetail gets a single payment detail
func GetSubscriptionPaymentDetail(c *gin.Context) {
	id := c.Param("id")

	var payment models.SubscriptionPayment
	if err := config.DB.Preload("Tenant").First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	resp := responses.SubscriptionPaymentResponse{
		ID:               payment.ID.String(),
		TenantID:         payment.TenantID,
		SubscriptionPlan: payment.SubscriptionPlan,
		BillingPeriod:    payment.BillingPeriod,
		Amount:           payment.Amount,
		PaymentDate:      payment.PaymentDate,
		PaymentMethod:    payment.PaymentMethod,
		AccountNumber:    payment.AccountNumber,
		AccountName:      payment.AccountName,
		ReferenceNumber:  payment.ReferenceNumber,
		ProofURL:         payment.ProofURL,
		Notes:            payment.Notes,
		Status:           string(payment.Status),
		VerifiedAt:       payment.VerifiedAt,
		VerifiedBy:       payment.VerifiedBy,
		RejectionReason:  payment.RejectionReason,
		CreatedAt:        payment.CreatedAt,
		UpdatedAt:        payment.UpdatedAt,
	}
	if payment.Tenant != nil {
		resp.TenantName = payment.Tenant.Name
		resp.TenantEmail = payment.Tenant.Email
	}

	c.JSON(http.StatusOK, resp)
}

// VerifySubscriptionPayment verifies and activates tenant subscription
func VerifySubscriptionPayment(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	var req requests.VerifySubscriptionPaymentRequest
	c.ShouldBindJSON(&req)

	var payment models.SubscriptionPayment
	if err := config.DB.Preload("Tenant").First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	if payment.Status != models.PaymentStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment already processed"})
		return
	}

	// Start transaction
	tx := config.DB.Begin()

	// Update payment status
	now := time.Now()
	updates := map[string]interface{}{
		"status":      models.PaymentStatusVerified,
		"verified_at": now,
		"verified_by": userID,
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}

	if err := tx.Model(&payment).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	// Calculate subscription dates
	subscriptionStart := time.Now()
	subscriptionEnd := subscriptionStart.AddDate(0, payment.BillingPeriod, 0)

	// Update tenant status
	tenantUpdates := map[string]interface{}{
		"status":                    models.TenantStatusActive,
		"subscription_plan":         payment.SubscriptionPlan,
		"subscription_starts_at":    subscriptionStart,
		"subscription_ends_at":      subscriptionEnd,
		"subscription_status":       "active",
		"payment_verified_at":       now,
		"payment_verified_by":       userID,
	}

	if err := tx.Model(&models.Tenant{}).Where("id = ?", payment.TenantID).Updates(tenantUpdates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tenant"})
		return
	}

	tx.Commit()

	// Fetch updated tenant
	var tenant models.Tenant
	config.DB.First(&tenant, "id = ?", payment.TenantID)

	resp := responses.VerifyPaymentResponse{
		Success: true,
		Message: "Payment verified and tenant activated successfully",
	}
	resp.Tenant.ID = tenant.ID.String()
	resp.Tenant.Status = string(tenant.Status)
	resp.Tenant.SubscriptionPlan = tenant.SubscriptionPlan
	resp.Tenant.SubscriptionStart = tenant.SubscriptionStartsAt
	resp.Tenant.SubscriptionEnd = tenant.SubscriptionEndsAt

	c.JSON(http.StatusOK, resp)
}

// RejectSubscriptionPayment rejects a payment submission
func RejectSubscriptionPayment(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	var req requests.RejectSubscriptionPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var payment models.SubscriptionPayment
	if err := config.DB.First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	if payment.Status != models.PaymentStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment already processed"})
		return
	}

	// Update payment status
	updates := map[string]interface{}{
		"status":           models.PaymentStatusRejected,
		"rejection_reason": req.Reason,
		"verified_by":      userID,
		"verified_at":      time.Now(),
	}

	if err := config.DB.Model(&payment).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject payment"})
		return
	}

	// Keep tenant in TRIAL status
	config.DB.Model(&models.Tenant{}).Where("id = ?", payment.TenantID).Update("status", models.TenantStatusTrial)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment rejected successfully",
	})
}

// GetTenantSubscriptionStatus gets current tenant subscription status
func GetTenantSubscriptionStatus(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	// Calculate days remaining
	daysRemaining := 0
	if tenant.Status == models.TenantStatusTrial && tenant.TrialEndsAt != nil {
		duration := time.Until(*tenant.TrialEndsAt)
		daysRemaining = int(duration.Hours() / 24)
		if daysRemaining < 0 {
			daysRemaining = 0
		}
	} else if tenant.SubscriptionEndsAt != nil {
		duration := time.Until(*tenant.SubscriptionEndsAt)
		daysRemaining = int(duration.Hours() / 24)
		if daysRemaining < 0 {
			daysRemaining = 0
		}
	}

	resp := responses.TenantSubscriptionStatusResponse{
		Status:            string(tenant.Status),
		SubscriptionPlan:  tenant.SubscriptionPlan,
		TrialEndDate:      tenant.TrialEndsAt,
		SubscriptionStart: tenant.SubscriptionStartsAt,
		SubscriptionEnd:   tenant.SubscriptionEndsAt,
		DaysRemaining:     daysRemaining,
	}

	// Check for pending payment
	var pendingPayment models.SubscriptionPayment
	if err := config.DB.Where("tenant_id = ? AND status = ?", tenantID, models.PaymentStatusPending).
		Order("created_at DESC").First(&pendingPayment).Error; err == nil {
		resp.PendingPayment = &struct {
			ID          string    `json:"id"`
			Status      string    `json:"status"`
			SubmittedAt time.Time `json:"submitted_at"`
		}{
			ID:          pendingPayment.ID.String(),
			Status:      string(pendingPayment.Status),
			SubmittedAt: pendingPayment.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, resp)
}
