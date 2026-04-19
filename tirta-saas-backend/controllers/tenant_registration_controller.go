package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PublicTenantRegistration handles public tenant registration (no authentication required)
// @Summary Public tenant registration
// @Description Register a new tenant organization with admin user
// @Tags Public
// @Accept json
// @Produce json
// @Param request body requests.PublicTenantRegistrationRequest true "Registration data"
// @Success 201 {object} responses.TenantRegistrationResponse
// @Failure 400 {object} responses.ErrorResponse
// @Router /api/public/register [post]
func PublicTenantRegistration(c *gin.Context) {
	var req requests.PublicTenantRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request data",
			Error:   err.Error(),
		})
		return
	}

	// Check if village code already exists
	var existingTenant models.Tenant
	if err := config.DB.Where("village_code = ?", req.VillageCode).First(&existingTenant).Error; err == nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Village code already registered",
			Error:   "This village code is already taken. Please use a unique code.",
		})
		return
	}

	// Check if admin email already exists
	var existingUser models.User
	if err := config.DB.Where("email = ?", req.AdminEmail).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Email already registered",
			Error:   "This email is already in use. Please use a different email.",
		})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.AdminPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to process registration",
			Error:   "Password hashing failed",
		})
		return
	}

	// Calculate trial end date (14 days from now)
	trialEndsAt := time.Now().AddDate(0, 0, 14)

	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create tenant with TRIAL status
	tenant := models.Tenant{
		Name:         req.OrganizationName,
		VillageCode:  req.VillageCode,
		Email:        req.Email,
		Phone:        req.Phone,
		Address:      req.Address,
		AdminName:    req.AdminName,
		AdminEmail:   req.AdminEmail,
		AdminPhone:   req.AdminPhone,
		Status:       models.TenantStatusTrial,
		RegisteredAt: time.Now(),
		TrialEndsAt:  &trialEndsAt,
	}

	if err := tx.Create(&tenant).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to create tenant",
			Error:   err.Error(),
		})
		return
	}

	// Create admin user
	tenantID := tenant.ID
	adminUser := models.User{
		Name:     req.AdminName,
		Email:    req.AdminEmail,
		Password: hashedPassword,
		Role:     string(constants.RoleTenantAdmin),
		TenantID: &tenantID,
	}

	if err := tx.Create(&adminUser).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to create admin user",
			Error:   err.Error(),
		})
		return
	}

	// Create default tenant settings
	tenantSettings := models.TenantSettings{
		BaseModel:            models.BaseModel{ID: uuid.New()}, // Explicitly generate UUID
		TenantID:             tenant.ID,
		CompanyName:          req.OrganizationName,
		Address:              req.Address,
		Phone:                req.Phone,
		Email:                req.Email,
		InvoiceGenerationDay: models.DefaultInvoiceGenerationDay,
		InvoiceDueDay:        models.DefaultInvoiceDueDay,
		InvoiceDueDays:       models.DefaultInvoiceDueDays,
		LatePenaltyPercent:   2.0,
		LatePenaltyMaxCap:    100000,
		GracePeriodDays:      models.DefaultGracePeriodDays,
		TimeZone:             "Asia/Jakarta",
		Language:             "id",
		Currency:             "IDR",
	}

	if err := tx.Create(&tenantSettings).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to create tenant settings",
			Error:   err.Error(),
		})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to complete registration",
			Error:   err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusCreated, responses.TenantRegistrationResponse{
		Status:  "success",
		Message: "Registration successful! Your trial period starts now. Please login to continue.",
		Tenant: responses.TenantRegistrationInfo{
			ID:          tenant.ID,
			Name:        tenant.Name,
			Email:       tenant.Email,
			Status:      string(tenant.Status),
			TrialEndsAt: tenant.TrialEndsAt,
			AdminEmail:  tenant.AdminEmail,
		},
	})
}

// GetPendingTenants returns list of tenants waiting for approval
// @Summary Get pending tenants
// @Description Get list of tenants awaiting platform action, primarily pending activation after payment verification
// @Tags Platform
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Filter by status (PENDING_VERIFICATION, PENDING_APPROVAL, PENDING_PAYMENT, TRIAL)"
// @Success 200 {object} responses.PendingTenantsListResponse
// @Failure 401 {object} responses.ErrorResponse
// @Router /api/platform/tenants/pending [get]
func GetPendingTenants(c *gin.Context) {
	status := c.Query("status")

	query := config.DB.Model(&models.Tenant{})

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status IN ?", []string{
			string(models.TenantStatusPendingVerification),
			string(models.TenantStatusPendingApproval),
			string(models.TenantStatusPendingPayment),
		})
	}

	var tenants []models.Tenant
	if err := query.Order("registered_at DESC").Find(&tenants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch pending tenants",
			Error:   err.Error(),
		})
		return
	}

	// Convert to response format
	pendingTenants := make([]responses.PendingTenantResponse, len(tenants))
	for i, t := range tenants {
		paymentProofURL := ""
		if t.PaymentProofURL != "" {
			paymentProofURL = fmt.Sprintf("/api/platform/tenants/%s/payment-proof/proof%s", t.ID.String(), filepath.Ext(t.PaymentProofURL))
		}

		pendingTenants[i] = responses.PendingTenantResponse{
			ID:                 t.ID,
			Name:               t.Name,
			VillageCode:        t.VillageCode,
			Email:              t.Email,
			Phone:              t.Phone,
			Address:            t.Address,
			AdminName:          t.AdminName,
			AdminEmail:         t.AdminEmail,
			AdminPhone:         t.AdminPhone,
			Status:             string(t.Status),
			SubscriptionStatus: t.SubscriptionStatus,
			RegisteredAt:       t.RegisteredAt,
			TrialEndsAt:        t.TrialEndsAt,
			PaymentProofURL:    paymentProofURL,
			PaymentVerifiedAt:  t.PaymentVerifiedAt,
			TotalUsers:         t.TotalUsers,
			TotalCustomers:     t.TotalCustomers,
		}
	}

	c.JSON(http.StatusOK, responses.PendingTenantsListResponse{
		Status:  "success",
		Data:    pendingTenants,
		Total:   len(pendingTenants),
		Page:    1,
		PerPage: len(pendingTenants),
	})
}

func DownloadTenantPaymentProof(c *gin.Context) {
	tenantID := c.Param("id")

	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
			Error:   err.Error(),
		})
		return
	}

	if tenant.PaymentProofURL == "" {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Payment proof not found",
			Error:   "",
		})
		return
	}

	downloadName := "tenant-payment-proof" + filepath.Ext(tenant.PaymentProofURL)
	if err := utils.ServeStoredFile(c, tenant.PaymentProofURL, downloadName); err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Payment proof file not found",
			Error:   err.Error(),
		})
	}
}

// ApproveTenant approves a tenant and activates their subscription
// @Summary Approve tenant
// @Description Approve a pending tenant and set to ACTIVE status
// @Tags Platform
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Tenant ID"
// @Param request body requests.TenantApprovalRequest false "Approval data"
// @Success 200 {object} responses.TenantActionResponse
// @Failure 400,404 {object} responses.ErrorResponse
// @Router /api/platform/tenants/{id}/approve [post]
func ApproveTenant(c *gin.Context) {
	tenantID := c.Param("id")

	var req requests.TenantApprovalRequest
	c.ShouldBindJSON(&req)

	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
			Error:   err.Error(),
		})
		return
	}

	// Get platform owner info from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, responses.ErrorResponse{
			Status:  "error",
			Message: "User not authenticated",
		})
		return
	}

	// Get user email from database
	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to get user info",
		})
		return
	}
	platformOwner := user.Email

	now := time.Now()

	var updates map[string]interface{}
	var responseMessage string

	// If tenant registered via subscription plan (PENDING_APPROVAL),
	// set status to PENDING_PAYMENT so they must pay the subscription invoice.
	// If tenant is pending verification, only activate after payment has been verified.
	if tenant.Status == models.TenantStatusPendingApproval {
		updates = map[string]interface{}{
			"status":      string(models.TenantStatusPendingPayment),
			"approved_at": &now,
			"approved_by": &platformOwner,
		}
		if req.SubscriptionPlan != "" {
			updates["subscription_plan"] = req.SubscriptionPlan
		}
		if req.Notes != "" {
			updates["notes"] = req.Notes
		}
		responseMessage = "Tenant disetujui. Invoice tagihan berlangganan telah dibuat. Tenant perlu melakukan konfirmasi pembayaran."
	} else if tenant.Status == models.TenantStatusPendingVerification {
		if tenant.SubscriptionStatus != "VERIFIED" || tenant.PaymentVerifiedAt == nil {
			c.JSON(http.StatusBadRequest, responses.ErrorResponse{
				Status:  "error",
				Message: "Tenant belum bisa diaktifkan karena pembayaran belum diverifikasi",
			})
			return
		}

		var verifiedPayment models.SubscriptionPayment
		err := config.DB.
			Where("tenant_id = ? AND status = ?", tenant.ID.String(), models.PaymentStatusVerified).
			Order("verified_at DESC, created_at DESC").
			First(&verifiedPayment).Error
		if err != nil && tenant.PaymentProofURL != "" {
			err = config.DB.
				Where("proof_url = ? AND status = ?", tenant.PaymentProofURL, models.PaymentStatusVerified).
				Order("verified_at DESC, created_at DESC").
				First(&verifiedPayment).Error
		}
		if err != nil {
			c.JSON(http.StatusBadRequest, responses.ErrorResponse{
				Status:  "error",
				Message: "Pembayaran terverifikasi tidak ditemukan untuk tenant ini",
			})
			return
		}

		subscriptionStarts := now
		subscriptionEnds := subscriptionStarts.AddDate(0, verifiedPayment.BillingPeriod, 0)
		updates = map[string]interface{}{
			"status":                 string(models.TenantStatusActive),
			"approved_at":            &now,
			"approved_by":            &platformOwner,
			"subscription_plan":      verifiedPayment.SubscriptionPlan,
			"subscription_starts_at": &subscriptionStarts,
			"subscription_ends_at":   &subscriptionEnds,
			"subscription_status":    "ACTIVE",
		}
		if req.Notes != "" {
			updates["notes"] = req.Notes
		}
		responseMessage = "Tenant berhasil diaktifkan setelah pembayaran terverifikasi."
	} else {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant dengan status ini tidak dapat diproses dari menu Pending",
		})
		return
	}

	if err := config.DB.Model(&tenant).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to approve tenant",
			Error:   err.Error(),
		})
		return
	}

	// Reload tenant to get updated data
	config.DB.First(&tenant, "id = ?", tenantID)

	response := responses.TenantActionResponse{
		Status:  "success",
		Message: responseMessage,
	}
	response.Tenant.ID = tenant.ID
	response.Tenant.Name = tenant.Name
	response.Tenant.Status = tenant.Status

	c.JSON(http.StatusOK, response)
}

// RejectTenant rejects a tenant registration
// @Summary Reject tenant
// @Description Reject a pending tenant
// @Tags Platform
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Tenant ID"
// @Param request body requests.TenantRejectionRequest true "Rejection reason"
// @Success 200 {object} responses.TenantActionResponse
// @Failure 400,404 {object} responses.ErrorResponse
// @Router /api/platform/tenants/{id}/reject [post]
func RejectTenant(c *gin.Context) {
	tenantID := c.Param("id")

	var req requests.TenantRejectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Rejection reason is required",
			Error:   err.Error(),
		})
		return
	}

	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
			Error:   err.Error(),
		})
		return
	}

	// Get platform owner info
	platformOwnerEmail, _ := c.Get("user_email")
	platformOwner := platformOwnerEmail.(string)

	now := time.Now()

	// Update tenant
	if err := config.DB.Model(&tenant).Updates(map[string]interface{}{
		"status":           string(models.TenantStatusInactive),
		"rejected_at":      &now,
		"rejected_by":      &platformOwner,
		"rejection_reason": req.Reason,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to reject tenant",
			Error:   err.Error(),
		})
		return
	}

	config.DB.First(&tenant, "id = ?", tenantID)

	response := responses.TenantActionResponse{
		Status:  "success",
		Message: "Tenant rejected",
	}
	response.Tenant.ID = tenant.ID
	response.Tenant.Name = tenant.Name
	response.Tenant.Status = tenant.Status

	c.JSON(http.StatusOK, response)
}

// SuspendTenant suspends an active tenant
// @Summary Suspend tenant
// @Description Suspend an active tenant
// @Tags Platform
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Tenant ID"
// @Param request body requests.TenantSuspensionRequest true "Suspension reason"
// @Success 200 {object} responses.TenantActionResponse
// @Failure 400,404 {object} responses.ErrorResponse
// @Router /api/platform/tenants/{id}/suspend [post]
func SuspendTenantByPlatform(c *gin.Context) {
	tenantID := c.Param("id")

	var req requests.TenantSuspensionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Suspension reason is required",
			Error:   err.Error(),
		})
		return
	}

	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
			Error:   err.Error(),
		})
		return
	}

	now := time.Now()

	if err := config.DB.Model(&tenant).Updates(map[string]interface{}{
		"status":            string(models.TenantStatusSuspended),
		"suspended_at":      &now,
		"suspension_reason": req.Reason,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to suspend tenant",
			Error:   err.Error(),
		})
		return
	}

	config.DB.First(&tenant, "id = ?", tenantID)

	response := responses.TenantActionResponse{
		Status:  "success",
		Message: "Tenant suspended",
	}
	response.Tenant.ID = tenant.ID
	response.Tenant.Name = tenant.Name
	response.Tenant.Status = tenant.Status

	c.JSON(http.StatusOK, response)
}

// SetupTenantRequest represents the request to create a tenant for an authenticated user
type SetupTenantRequest struct {
	// Organization Information
	OrganizationName string `json:"organization_name" binding:"required,min=3,max=100"`
	VillageCode      string `json:"village_code" binding:"required,min=3,max=20"`
	Address          string `json:"address" binding:"required"`
	Phone            string `json:"phone" binding:"required"`
	Email            string `json:"email" binding:"required,email"`

	// Admin Contact
	AdminPhone string `json:"admin_phone"`

	// Plan Selection (FEATURE-2)
	// plan_type: "trial" or "subscription"
	PlanType string `json:"plan_type" binding:"required,oneof=trial subscription"`
	// plan_id: required when plan_type = "subscription"
	PlanID string `json:"plan_id"`
}

// SetupTenant creates a tenant for an already-authenticated user who doesn't have a tenant yet.
// This is the second step after RegisterAccount.
// @Summary Setup tenant for authenticated user
// @Description Create tenant for logged-in user who hasn't set up a tenant yet
// @Tags Setup
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body SetupTenantRequest true "Tenant setup data"
// @Success 201 {object} map[string]interface{}
// @Failure 400,401,409 {object} map[string]string
// @Router /api/setup/tenant [post]
func SetupTenant(c *gin.Context) {
	var req SetupTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// JWT middleware stores user_id in Gin context as uuid.UUID
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna tidak terautentikasi"})
		return
	}

	userUUID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID tidak valid"})
		return
	}

	// Load the user
	var user models.User
	if err := config.DB.First(&user, "id = ?", userUUID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	// Prevent duplicate tenant setup
	if user.TenantID != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Akun Anda sudah memiliki tenant yang terdaftar"})
		return
	}

	// Validate village code uniqueness
	var existing models.Tenant
	if err := config.DB.Where("village_code = ?", req.VillageCode).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode desa sudah terdaftar. Gunakan kode yang unik."})
		return
	}

	// Validate subscription plan if plan_type is "subscription"
	var subscriptionPlan string
	if req.PlanType == "subscription" {
		if req.PlanID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "plan_id wajib diisi ketika memilih subscription"})
			return
		}
		var plan models.SubscriptionPlanDetails
		if err := config.DB.First(&plan, "id = ?", req.PlanID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Paket langganan tidak ditemukan"})
			return
		}
		subscriptionPlan = plan.Name
	}

	// Determine tenant status and trial date based on plan type
	var tenantStatus models.TenantStatus
	var trialEndsAt *time.Time
	switch req.PlanType {
	case "trial":
		tenantStatus = models.TenantStatusTrial
		t := time.Now().AddDate(0, 0, 14)
		trialEndsAt = &t
	case "subscription":
		tenantStatus = models.TenantStatusPendingApproval
	}

	// Start DB transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	adminPhone := req.AdminPhone
	if adminPhone == "" {
		adminPhone = req.Phone
	}

	tenant := models.Tenant{
		Name:             req.OrganizationName,
		VillageCode:      req.VillageCode,
		Email:            req.Email,
		Phone:            req.Phone,
		Address:          req.Address,
		AdminName:        user.Name,
		AdminEmail:       user.Email,
		AdminPhone:       adminPhone,
		Status:           tenantStatus,
		RegisteredAt:     time.Now(),
		TrialEndsAt:      trialEndsAt,
		SubscriptionPlan: subscriptionPlan,
	}

	if err := tx.Create(&tenant).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat tenant: " + err.Error()})
		return
	}

	// Link authenticated user to the newly created tenant
	tenantID := tenant.ID
	if err := tx.Model(&user).Updates(map[string]interface{}{
		"tenant_id": &tenantID,
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghubungkan user ke tenant"})
		return
	}

	// Create default tenant settings
	tenantSettings := models.TenantSettings{
		BaseModel:            models.BaseModel{ID: uuid.New()},
		TenantID:             tenant.ID,
		CompanyName:          req.OrganizationName,
		Address:              req.Address,
		Phone:                req.Phone,
		Email:                req.Email,
		InvoiceGenerationDay: models.DefaultInvoiceGenerationDay,
		InvoiceDueDay:        models.DefaultInvoiceDueDay,
		InvoiceDueDays:       models.DefaultInvoiceDueDays,
		LatePenaltyPercent:   2.0,
		LatePenaltyMaxCap:    100000,
		GracePeriodDays:      models.DefaultGracePeriodDays,
		TimeZone:             "Asia/Jakarta",
		Language:             "id",
		Currency:             "IDR",
	}

	if err := tx.Create(&tenantSettings).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pengaturan tenant"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyelesaikan proses setup"})
		return
	}

	// Reload user with updated tenant_id
	config.DB.First(&user, "id = ?", userUUID)

	// Issue new JWT with tenant_id populated
	newToken, err := utils.GenerateJWT(user.ID, user.TenantID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token baru"})
		return
	}

	statusMsg := "Tenant berhasil dibuat dalam mode Trial 14 hari."
	if req.PlanType == "subscription" {
		statusMsg = "Tenant berhasil didaftarkan. Menunggu approval dari admin platform."
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       statusMsg,
		"token":         newToken,
		"tenant_id":     tenant.ID,
		"tenant_status": string(tenant.Status),
		"trial_ends_at": tenant.TrialEndsAt,
	})
}
