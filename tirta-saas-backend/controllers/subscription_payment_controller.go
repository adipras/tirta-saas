package controllers

import (
	"encoding/json"
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
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

type subscriptionPaymentListRow struct {
	ID                uuid.UUID  `gorm:"column:id"`
	TenantID          string     `gorm:"column:tenant_id"`
	TenantName        string     `gorm:"column:tenant_name"`
	TenantEmail       string     `gorm:"column:tenant_email"`
	TenantVillageCode string     `gorm:"column:tenant_village_code"`
	SubscriptionPlan  string     `gorm:"column:subscription_plan"`
	BillingPeriod     int        `gorm:"column:billing_period"`
	Amount            float64    `gorm:"column:amount"`
	PaymentDate       time.Time  `gorm:"column:payment_date"`
	PaymentMethod     string     `gorm:"column:payment_method"`
	AccountNumber     string     `gorm:"column:account_number"`
	AccountName       string     `gorm:"column:account_name"`
	ReferenceNumber   string     `gorm:"column:reference_number"`
	ProofURL          string     `gorm:"column:proof_url"`
	Notes             string     `gorm:"column:notes"`
	Status            string     `gorm:"column:status"`
	VerifiedAt        *time.Time `gorm:"column:verified_at"`
	VerifiedBy        *string    `gorm:"column:verified_by"`
	RejectionReason   string     `gorm:"column:rejection_reason"`
	CreatedAt         time.Time  `gorm:"column:created_at"`
	UpdatedAt         time.Time  `gorm:"column:updated_at"`
}

func buildSubscriptionPaymentProofURL(payment *models.SubscriptionPayment) string {
	ext := utils.GetFileExtension(payment.ProofURL)
	if ext == "" {
		ext = ".bin"
	}

	return fmt.Sprintf("/api/platform/subscription-payments/%s/file/proof%s", payment.ID.String(), ext)
}

func loadTenantForSubscriptionPayment(payment *models.SubscriptionPayment) *models.Tenant {
	if payment.Tenant != nil {
		return payment.Tenant
	}

	if payment.TenantID == "" {
		return nil
	}

	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", payment.TenantID).Error; err != nil {
		return nil
	}

	return &tenant
}

func loadTenantMapForSubscriptionPayments(payments []models.SubscriptionPayment) map[string]models.Tenant {
	tenantIDs := make([]string, 0, len(payments))
	seen := make(map[string]struct{}, len(payments))

	for _, payment := range payments {
		if payment.TenantID == "" {
			continue
		}
		if _, exists := seen[payment.TenantID]; exists {
			continue
		}
		seen[payment.TenantID] = struct{}{}
		tenantIDs = append(tenantIDs, payment.TenantID)
	}

	if len(tenantIDs) == 0 {
		return map[string]models.Tenant{}
	}

	var tenants []models.Tenant
	if err := config.DB.Where("id IN ?", tenantIDs).Find(&tenants).Error; err != nil {
		return map[string]models.Tenant{}
	}

	tenantMap := make(map[string]models.Tenant, len(tenants))
	for _, tenant := range tenants {
		tenantMap[tenant.ID.String()] = tenant
	}

	return tenantMap
}

func buildSubscriptionPaymentResponse(payment *models.SubscriptionPayment) responses.SubscriptionPaymentResponse {
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
		ProofURL:         buildSubscriptionPaymentProofURL(payment),
		Notes:            payment.Notes,
		Status:           string(payment.Status),
		VerifiedAt:       payment.VerifiedAt,
		VerifiedBy:       payment.VerifiedBy,
		RejectionReason:  payment.RejectionReason,
		CreatedAt:        payment.CreatedAt,
		UpdatedAt:        payment.UpdatedAt,
	}

	if tenant := loadTenantForSubscriptionPayment(payment); tenant != nil {
		resp.TenantName = tenant.Name
		resp.TenantEmail = tenant.Email
		resp.TenantVillageCode = tenant.VillageCode
	}

	return resp
}

func buildSubscriptionPaymentResponseFromRow(row subscriptionPaymentListRow) responses.SubscriptionPaymentResponse {
	proofPayment := models.SubscriptionPayment{
		BaseModel:        models.BaseModel{ID: row.ID, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt},
		TenantID:         row.TenantID,
		SubscriptionPlan: row.SubscriptionPlan,
		BillingPeriod:    row.BillingPeriod,
		Amount:           row.Amount,
		PaymentDate:      row.PaymentDate,
		PaymentMethod:    row.PaymentMethod,
		AccountNumber:    row.AccountNumber,
		AccountName:      row.AccountName,
		ReferenceNumber:  row.ReferenceNumber,
		ProofURL:         row.ProofURL,
		Notes:            row.Notes,
		Status:           models.SubscriptionPaymentStatus(row.Status),
		VerifiedAt:       row.VerifiedAt,
		VerifiedBy:       row.VerifiedBy,
		RejectionReason:  row.RejectionReason,
	}

	resp := buildSubscriptionPaymentResponse(&proofPayment)
	resp.TenantName = row.TenantName
	resp.TenantEmail = row.TenantEmail
	resp.TenantVillageCode = row.TenantVillageCode
	return resp
}

func buildSelectedSubscriptionPlanResponse(plan models.SubscriptionPlanDetails) responses.SubscriptionPlanResponse {
	features := []string{}
	if plan.Features != "" {
		_ = json.Unmarshal([]byte(plan.Features), &features)
	}

	return responses.SubscriptionPlanResponse{
		ID:                plan.ID,
		Plan:              string(plan.Plan),
		Name:              plan.Name,
		Description:       plan.Description,
		MonthlyPrice:      plan.MonthlyPrice,
		YearlyPrice:       plan.YearlyPrice,
		MaxUsers:          plan.MaxUsers,
		MaxCustomers:      plan.MaxCustomers,
		MaxStorageGB:      plan.MaxStorageGB,
		MaxAPICallsPerDay: plan.MaxAPICallsPerDay,
		Features:          features,
		TrialDays:         plan.TrialDays,
		DisplayOrder:      plan.DisplayOrder,
		IsActive:          plan.IsActive,
		CreatedAt:         plan.CreatedAt,
		UpdatedAt:         plan.UpdatedAt,
	}
}

// SubmitSubscriptionPayment handles tenant submission of subscription payment
func SubmitSubscriptionPayment(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
		return
	}

	var user models.User
	if err := config.DB.Select("tenant_id").First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if user.TenantID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found"})
		return
	}

	tenantID := user.TenantID.String()
	now := time.Now()

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

	var activeInvoice models.SubscriptionInvoice
	hasActiveInvoice := false
	if err := config.DB.Where("tenant_id = ? AND status IN ?", user.TenantID, []models.SubscriptionInvoiceStatus{
		models.SubscriptionInvoiceStatusPending,
		models.SubscriptionInvoiceStatusAwaitingVerification,
	}).
		Order("created_at DESC").
		First(&activeInvoice).Error; err == nil {
		hasActiveInvoice = true
		if activeInvoice.Status != models.SubscriptionInvoiceStatusPending {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice langganan ini sedang menunggu verifikasi pembayaran sebelumnya"})
			return
		}
		subscriptionPlan = activeInvoice.SubscriptionPlan
		billingPeriodInt = activeInvoice.BillingPeriod
		amountFloat = activeInvoice.Amount
	}

	// Handle file upload for proof
	file, err := c.FormFile("proof_file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Proof file is required"})
		return
	}

	uploadConfig := utils.DefaultProofUploadConfig()
	uploadConfig.UploadDir = fmt.Sprintf("storage/private/subscription-proofs/%s", tenantID)
	uploadPath, err := utils.SaveUploadedFile(file, uploadConfig)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to save file: " + err.Error()})
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

	tx := config.DB.Begin()

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment record"})
		return
	}

	if hasActiveInvoice {
		if err := tx.Model(&models.SubscriptionInvoice{}).
			Where("id = ?", activeInvoice.ID).
			Updates(map[string]interface{}{
				"status":                models.SubscriptionInvoiceStatusAwaitingVerification,
				"payment_submission_id": payment.ID,
				"payment_submitted_at":  &now,
			}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update subscription invoice"})
			return
		}
	}

	if err := tx.Model(&models.Tenant{}).Where("id = ?", tenantID).Updates(map[string]interface{}{
		"status":              string(models.TenantStatusPendingVerification),
		"subscription_status": "PENDING_VERIFICATION",
		"payment_proof_url":   uploadPath,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tenant status"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save payment submission"})
		return
	}

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

	query := config.DB.Table("subscription_payments AS sp").
		Joins("LEFT JOIN tenants AS t ON t.id = sp.tenant_id AND t.deleted_at IS NULL")

	if status != "" {
		query = query.Where("sp.status = ?", status)
	}
	if tenantID != "" {
		query = query.Where("sp.tenant_id = ?", tenantID)
	}

	var total int64
	query.Count(&total)

	var rows []subscriptionPaymentListRow
	if err := query.Select(`
		sp.id,
		sp.tenant_id,
		t.name AS tenant_name,
		t.email AS tenant_email,
		t.village_code AS tenant_village_code,
		sp.subscription_plan,
		sp.billing_period,
		sp.amount,
		sp.payment_date,
		sp.payment_method,
		sp.account_number,
		sp.account_name,
		sp.reference_number,
		sp.proof_url,
		sp.notes,
		sp.status,
		sp.verified_at,
		sp.verified_by,
		sp.rejection_reason,
		sp.created_at,
		sp.updated_at
	`).Order("sp.created_at DESC").Limit(limit).Offset(offset).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}

	var data []responses.SubscriptionPaymentResponse
	for _, row := range rows {
		data = append(data, buildSubscriptionPaymentResponseFromRow(row))
	}

	helpers.RespondPaginated(c, "Subscription payments retrieved successfully", data, page, limit, int(total))
}

// GetSubscriptionPaymentDetail gets a single payment detail
func GetSubscriptionPaymentDetail(c *gin.Context) {
	id := c.Param("id")

	var payment models.SubscriptionPayment
	if err := config.DB.Preload("Tenant").First(&payment, "id = ?", id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Payment not found", err)
		return
	}

	helpers.RespondSuccess(c, "Payment details retrieved successfully", buildSubscriptionPaymentResponse(&payment))
}

// VerifySubscriptionPayment verifies and activates tenant subscription
func VerifySubscriptionPayment(c *gin.Context) {
	id := c.Param("id")
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
		return
	}

	var req requests.VerifySubscriptionPaymentRequest
	c.ShouldBindJSON(&req)

	// Lock and update only the intended columns so the payment foreign key cannot be altered during verification.
	tx := config.DB.Begin()

	var payment models.SubscriptionPayment
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&payment, "id = ?", id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	if payment.Status != models.PaymentStatusPending {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment already processed"})
		return
	}

	originalTenantID := payment.TenantID

	var tenant models.Tenant
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&tenant, "id = ?", originalTenantID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Tenant not found"})
		return
	}

	// Update payment status
	now := time.Now()
	updates := map[string]interface{}{
		"status":      models.PaymentStatusVerified,
		"verified_at": now,
		"verified_by": userID.String(),
	}
	paymentColumns := []string{"status", "verified_at", "verified_by"}
	if req.Notes != "" {
		updates["notes"] = req.Notes
		paymentColumns = append(paymentColumns, "notes")
	}

	if err := tx.Model(&models.SubscriptionPayment{}).
		Where("id = ?", payment.ID).
		Select(paymentColumns).
		Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	if err := tx.Model(&models.SubscriptionInvoice{}).
		Where("payment_submission_id = ?", payment.ID).
		Updates(map[string]interface{}{
			"status":  models.SubscriptionInvoiceStatusPaid,
			"paid_at": &now,
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update subscription invoice"})
		return
	}

	tenantUpdates := map[string]interface{}{
		"status":              string(models.TenantStatusPendingVerification),
		"subscription_status": "VERIFIED",
		"payment_verified_at": now,
		"payment_verified_by": userID.String(),
	}

	if err := tx.Model(&models.Tenant{}).
		Where("id = ?", originalTenantID).
		Select("status", "subscription_status", "payment_verified_at", "payment_verified_by").
		Updates(tenantUpdates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tenant"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finalize verification"})
		return
	}

	// Fetch updated tenant
	config.DB.First(&tenant, "id = ?", originalTenantID)

	resp := responses.VerifyPaymentResponse{
		Success: true,
		Message: "Payment verified successfully. Tenant is ready for activation.",
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
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID format"})
		return
	}

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

	originalTenantID := payment.TenantID

	// Update payment status
	updates := map[string]interface{}{
		"status":           models.PaymentStatusRejected,
		"rejection_reason": req.Reason,
		"verified_by":      userID.String(),
		"verified_at":      time.Now(),
	}

	if err := config.DB.Model(&models.SubscriptionPayment{}).
		Where("id = ?", payment.ID).
		Select("status", "rejection_reason", "verified_by", "verified_at").
		Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject payment"})
		return
	}

	invoiceResetResult := config.DB.Model(&models.SubscriptionInvoice{}).
		Where("payment_submission_id = ?", payment.ID).
		Updates(map[string]interface{}{
			"status":                models.SubscriptionInvoiceStatusPending,
			"payment_submission_id": nil,
			"payment_submitted_at":  nil,
			"paid_at":               nil,
		})
	if invoiceResetResult.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset subscription invoice"})
		return
	}

	nextTenantStatus := string(models.TenantStatusTrial)
	nextSubscriptionStatus := "TRIAL"
	if invoiceResetResult.RowsAffected > 0 {
		nextTenantStatus = string(models.TenantStatusPendingPayment)
		nextSubscriptionStatus = "PENDING_PAYMENT"
	}

	config.DB.Model(&models.Tenant{}).Where("id = ?", originalTenantID).Updates(map[string]interface{}{
		"status":              nextTenantStatus,
		"subscription_status": nextSubscriptionStatus,
		"payment_verified_at": nil,
		"payment_verified_by": nil,
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment rejected successfully",
	})
}

func DownloadSubscriptionPaymentProof(c *gin.Context) {
	id := c.Param("id")

	var payment models.SubscriptionPayment
	if err := config.DB.First(&payment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	downloadName := "subscription-proof" + filepath.Ext(payment.ProofURL)
	if err := utils.ServeStoredFile(c, payment.ProofURL, downloadName); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment proof file not found"})
	}
}

// GetTenantSubscriptionStatus gets current tenant subscription status
func GetTenantSubscriptionStatus(c *gin.Context) {
	// Get tenant_id from context (set by JWT middleware as uuid.UUID)
	tenantIDValue, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found in token"})
		return
	}

	tenantID, ok := tenantIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid tenant ID format"})
		return
	}

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

	if tenant.SubscriptionPlan != "" {
		var selectedPlan models.SubscriptionPlanDetails
		if err := config.DB.Where("plan = ?", tenant.SubscriptionPlan).First(&selectedPlan).Error; err == nil {
			planResponse := buildSelectedSubscriptionPlanResponse(selectedPlan)
			resp.SelectedPlan = &planResponse
		}
	}

	var registrationInvoice models.SubscriptionInvoice
	if err := config.DB.Where("tenant_id = ? AND type = ?", tenantID, "registration").
		Order("created_at DESC").
		First(&registrationInvoice).Error; err == nil {
		resp.RegistrationInvoice = &responses.TenantSubscriptionInvoiceResponse{
			ID:               registrationInvoice.ID.String(),
			InvoiceNumber:    registrationInvoice.InvoiceNumber,
			Type:             registrationInvoice.Type,
			Status:           string(registrationInvoice.Status),
			SubscriptionPlan: registrationInvoice.SubscriptionPlan,
			PlanName:         registrationInvoice.PlanName,
			BillingPeriod:    registrationInvoice.BillingPeriod,
			Amount:           registrationInvoice.Amount,
			Description:      registrationInvoice.Description,
			IssuedAt:         registrationInvoice.IssuedAt,
			DueDate:          registrationInvoice.DueDate,
			PaidAt:           registrationInvoice.PaidAt,
		}
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
