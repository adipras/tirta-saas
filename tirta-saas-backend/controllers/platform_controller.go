package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListTenants godoc
// @Summary List all tenants
// @Description Get list of all tenants with pagination and filters (Platform Admin only)
// @Tags Platform
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Param search query string false "Search by name or email"
// @Param status query string false "Filter by status"
// @Param sort_by query string false "Sort by field" default(created_at)
// @Param sort_order query string false "Sort order (asc/desc)" default(desc)
// @Security BearerAuth
// @Success 200 {object} responses.PaginatedResponse
// @Failure 400 {object} responses.ErrorResponse
// @Failure 401 {object} responses.ErrorResponse
// @Router /api/platform/tenants [get]
func ListTenants(c *gin.Context) {
	var req requests.TenantSearchRequest
	
	// Set defaults
	if c.Query("page") == "" {
		req.Page = 1
	}
	if c.Query("page_size") == "" {
		req.PageSize = 20
	}
	if c.Query("sort_order") == "" {
		req.SortOrder = "desc"
	}
	if c.Query("sort_by") == "" {
		req.SortBy = "created_at"
	}
	
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid query parameters",
			Error:   err.Error(),
		})
		return
	}
	
	var tenants []models.Tenant
	query := config.DB.Model(&models.Tenant{})
	
	// Apply filters
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("name LIKE ? OR village_code LIKE ? OR email LIKE ?", 
			searchPattern, searchPattern, searchPattern)
	}
	
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	
	if req.SubscriptionPlan != "" {
		query = query.Where("subscription_plan = ?", req.SubscriptionPlan)
	}
	
	// Count total records
	var total int64
	query.Count(&total)
	
	// Apply sorting
	sortField := req.SortBy
	if sortField == "" {
		sortField = "created_at"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortField, req.SortOrder))
	
	// Apply pagination
	offset := (req.Page - 1) * req.PageSize
	query = query.Offset(offset).Limit(req.PageSize)
	
	if err := query.Find(&tenants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch tenants",
			Error:   err.Error(),
		})
		return
	}
	
	// Transform to response
	var tenantList []responses.TenantListResponse
	for _, tenant := range tenants {
		tenantList = append(tenantList, responses.TenantListResponse{
			ID:                 tenant.ID,
			Name:               tenant.Name,
			VillageCode:        tenant.VillageCode,
			Email:              tenant.Email,
			Phone:              tenant.Phone,
			Status:             string(tenant.Status),
			SubscriptionPlan:   tenant.SubscriptionPlan,
			SubscriptionStatus: tenant.SubscriptionStatus,
			SubscriptionEndsAt: tenant.SubscriptionEndsAt,
			TotalUsers:         tenant.TotalUsers,
			TotalCustomers:     tenant.TotalCustomers,
			StorageUsedGB:      tenant.StorageUsedGB,
			CreatedAt:          tenant.CreatedAt,
		})
	}
	
	c.JSON(http.StatusOK, responses.PaginatedResponse{
		Status:  "success",
		Message: "Tenants retrieved successfully",
		Data:    tenantList,
		Meta: responses.PaginationMeta{
			CurrentPage: req.Page,
			PageSize:    req.PageSize,
			TotalPages:  int((total + int64(req.PageSize) - 1) / int64(req.PageSize)),
			TotalItems:  int(total),
		},
	})
}

// GetTenantDetail gets detailed tenant information (Platform Owner only)
// GetTenantDetail godoc
// @Summary Get tenant detail
// @Description Get detailed information of a specific tenant
// @Tags Platform
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID"
// @Security BearerAuth
// @Success 200 {object} responses.TenantDetailResponse
// @Failure 400 {object} responses.ErrorResponse
// @Failure 404 {object} responses.ErrorResponse
// @Router /api/platform/tenants/{id} [get]
func GetTenantDetail(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid tenant ID format",
		})
		return
	}
	
	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
		})
		return
	}
	
	response := responses.TenantDetailResponse{
		ID:                 tenant.ID,
		Name:               tenant.Name,
		VillageCode:        tenant.VillageCode,
		Email:              tenant.Email,
		Phone:              tenant.Phone,
		Address:            tenant.Address,
		Status:             string(tenant.Status),
		SubscriptionPlan:   tenant.SubscriptionPlan,
		SubscriptionStatus: tenant.SubscriptionStatus,
		SubscriptionEndsAt: tenant.SubscriptionEndsAt,
		TotalUsers:         tenant.TotalUsers,
		TotalCustomers:     tenant.TotalCustomers,
		StorageUsedGB:      tenant.StorageUsedGB,
		SuspendedAt:        tenant.SuspendedAt,
		SuspensionReason:   tenant.SuspensionReason,
		Notes:              tenant.Notes,
		CreatedAt:          tenant.CreatedAt,
		UpdatedAt:          tenant.UpdatedAt,
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant details retrieved successfully",
		Data:    response,
	})
}

// UpdateTenant godoc
// @Summary Update tenant information
// @Description Update tenant details (Platform Admin only)
// @Tags Platform
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID"
// @Param request body requests.UpdateTenantRequest true "Update tenant request"
// @Security BearerAuth
// @Success 200 {object} responses.SuccessResponse
// @Failure 400 {object} responses.ErrorResponse
// @Failure 404 {object} responses.ErrorResponse
// @Router /api/platform/tenants/{id} [put]
func UpdateTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid tenant ID format",
		})
		return
	}
	
	var req requests.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
		})
		return
	}
	
	// Update fields
	if req.Name != "" {
		tenant.Name = req.Name
	}
	if req.Email != "" {
		tenant.Email = req.Email
	}
	if req.Phone != "" {
		tenant.Phone = req.Phone
	}
	if req.Address != "" {
		tenant.Address = req.Address
	}
	if req.Notes != "" {
		tenant.Notes = req.Notes
	}
	if req.SubscriptionPlan != "" {
		tenant.SubscriptionPlan = req.SubscriptionPlan
	}
	
	if err := config.DB.Save(&tenant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to update tenant",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant updated successfully",
		Data:    tenant,
	})
}

// SuspendTenant godoc
// @Summary Suspend tenant
// @Description Suspend a tenant account (Platform Admin only)
// @Tags Platform
// @Accept json
// @Produce json
// @Param id path string true "Tenant ID"
// @Security BearerAuth
// @Success 200 {object} responses.SuccessResponse
// @Failure 400 {object} responses.ErrorResponse
// @Failure 404 {object} responses.ErrorResponse
// @Router /api/platform/tenants/{id}/suspend [post]
func SuspendTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid tenant ID format",
		})
		return
	}
	
	var req requests.SuspendTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
		})
		return
	}
	
	if tenant.Status == models.TenantStatusSuspended {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant is already suspended",
		})
		return
	}
	
	now := time.Now()
	tenant.Status = models.TenantStatusSuspended
	tenant.SuspendedAt = &now
	tenant.SuspensionReason = req.Reason
	
	if err := config.DB.Save(&tenant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to suspend tenant",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant suspended successfully",
		Data:    tenant,
	})
}

// ActivateTenant activates a suspended tenant (Platform Owner only)
func ActivateTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid tenant ID format",
		})
		return
	}
	
	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
		})
		return
	}
	
	if tenant.Status == models.TenantStatusActive {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant is already active",
		})
		return
	}
	
	tenant.Status = models.TenantStatusActive
	tenant.SuspendedAt = nil
	tenant.SuspensionReason = ""
	
	if err := config.DB.Save(&tenant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to activate tenant",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant activated successfully",
		Data:    tenant,
	})
}

// DeleteTenant soft deletes a tenant (Platform Owner only)
func DeleteTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid tenant ID format",
		})
		return
	}
	
	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
		})
		return
	}
	
	// Soft delete
	if err := config.DB.Delete(&tenant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to delete tenant",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant deleted successfully",
	})
}

// GetTenantStatistics gets tenant subscription statistics (Platform Owner only)
// Returns only tenant/subscription related data, NOT operational water management data
func GetTenantStatistics(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid tenant ID format",
		})
		return
	}
	
	var tenant models.Tenant
	if err := config.DB.First(&tenant, "id = ?", tenantID).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
		})
		return
	}
	
	stats := responses.TenantStatisticsResponse{
		TenantID:   tenant.ID,
		TenantName: tenant.Name,
	}
	
	// Count users (app users, not water customers)
	var totalUsers, activeUsers int64
	config.DB.Model(&models.User{}).Where("tenant_id = ?", tenantID).Count(&totalUsers)
	config.DB.Model(&models.User{}).Where("tenant_id = ? AND is_active = ?", tenantID, true).Count(&activeUsers)
	stats.TotalUsers = int(totalUsers)
	stats.ActiveUsers = int(activeUsers)
	
	// Count customers managed by tenant (for subscription pricing calculation)
	var totalCustomers int64
	config.DB.Model(&models.Customer{}).Where("tenant_id = ?", tenantID).Count(&totalCustomers)
	stats.TotalCustomers = int(totalCustomers)
	
	// Get subscription details and limits
	var subscription models.TenantSubscription
	if err := config.DB.Where("tenant_id = ? AND status IN (?)", tenantID, []string{"ACTIVE", "TRIAL"}).First(&subscription).Error; err == nil {
		stats.StorageLimitGB = subscription.MaxStorageGB
		stats.APICallsLimit = subscription.MaxAPICallsPerDay
	}
	
	stats.StorageUsedGB = tenant.StorageUsedGB
	stats.APICallsToday = 0 // TODO: Implement from metrics
	
	// Last activity
	var lastLog models.AuditLog
	if err := config.DB.Where("tenant_id = ?", tenantID).Order("created_at DESC").First(&lastLog).Error; err == nil {
		stats.LastActivityAt = &lastLog.CreatedAt
	}
	
	stats.StatisticsAsOf = time.Now()
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant statistics retrieved successfully",
		Data:    stats,
	})
}

// GetPlatformAnalyticsOverview gets platform-wide subscription overview (Platform Owner only)
// Returns only tenant/subscription metrics, NOT operational water management data
func GetPlatformAnalyticsOverview(c *gin.Context) {
	var stats responses.PlatformAnalyticsOverviewResponse
	
	// Tenant statistics
	var totalTenants, activeTenants, suspendedTenants, trialTenants int64
	config.DB.Model(&models.Tenant{}).Count(&totalTenants)
	config.DB.Model(&models.Tenant{}).Where("status = ?", "ACTIVE").Count(&activeTenants)
	config.DB.Model(&models.Tenant{}).Where("status = ?", "SUSPENDED").Count(&suspendedTenants)
	stats.TotalTenants = int(totalTenants)
	stats.ActiveTenants = int(activeTenants)
	stats.SuspendedTenants = int(suspendedTenants)
	
	// Trial tenants (subscriptions with trial)
	config.DB.Model(&models.TenantSubscription{}).
		Where("status = ? AND trial_ends_at > ?", "TRIAL", time.Now()).Count(&trialTenants)
	stats.TrialTenants = int(trialTenants)
	
	// Subscription revenue (from platform subscriptions, not tenant's water billing)
	// Calculate MRR (Monthly Recurring Revenue)
	var mrr float64
	config.DB.Model(&models.TenantSubscription{}).
		Where("status IN (?, ?)", "ACTIVE", "TRIAL").
		Select("COALESCE(SUM(CASE WHEN billing_cycle = 'MONTHLY' THEN monthly_price ELSE yearly_price/12 END), 0)").
		Scan(&mrr)
	stats.MonthlyRevenue = mrr
	stats.TotalRevenue = mrr * 12 // Annualized
	
	// Outstanding subscription payments (not tenant's customer payments)
	var outstandingRevenue float64
	config.DB.Raw(`
		SELECT COALESCE(SUM(ts.monthly_price), 0)
		FROM tenant_subscriptions ts
		JOIN tenants t ON t.id = ts.tenant_id
		WHERE ts.status = 'ACTIVE' 
		  AND ts.payment_status = 'PENDING'
		  AND ts.next_billing_at < ?
	`, time.Now()).Scan(&outstandingRevenue)
	stats.OutstandingRevenue = outstandingRevenue
	
	// Growth statistics
	firstDayOfMonth := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.Local)
	var newTenantsThisMonth, churnedTenantsThisMonth int64
	config.DB.Model(&models.Tenant{}).Where("created_at >= ?", firstDayOfMonth).Count(&newTenantsThisMonth)
	config.DB.Model(&models.Tenant{}).Unscoped().
		Where("deleted_at >= ?", firstDayOfMonth).Count(&churnedTenantsThisMonth)
	
	stats.NewTenantsThisMonth = int(newTenantsThisMonth)
	stats.ChurnedTenantsThisMonth = int(churnedTenantsThisMonth)
	
	// Calculate growth rate
	var lastMonthTenants int64
	firstDayOfLastMonth := firstDayOfMonth.AddDate(0, -1, 0)
	config.DB.Model(&models.Tenant{}).Where("created_at >= ? AND created_at < ?", firstDayOfLastMonth, firstDayOfMonth).Count(&lastMonthTenants)
	
	if lastMonthTenants > 0 {
		stats.GrowthRate = (float64(newTenantsThisMonth) / float64(lastMonthTenants)) * 100
	}
	
	// Platform usage - app users and customers count (for subscription tier pricing)
	var totalUsers, totalCustomers int64
	config.DB.Model(&models.User{}).Count(&totalUsers)
	config.DB.Model(&models.Customer{}).Count(&totalCustomers)
	stats.TotalUsers = int(totalUsers)
	stats.TotalCustomers = int(totalCustomers)
	
	// Storage used across all tenants
	var totalStorage float64
	config.DB.Model(&models.Tenant{}).Select("COALESCE(SUM(storage_used_gb), 0)").Scan(&totalStorage)
	stats.TotalStorageUsedGB = totalStorage
	
	// System statistics - defaults for now
	stats.AverageResponseTimeMs = 150.0 // TODO: Implement from metrics
	stats.ErrorRate = 0.5                // TODO: Implement from metrics
	stats.Uptime = 99.9                  // TODO: Implement from metrics
	stats.LastUpdated = time.Now()
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Platform analytics retrieved successfully",
		Data:    stats,
	})
}

// GetTenantSettings gets tenant settings
func GetTenantSettings(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var settings models.TenantSettings
	if err := config.DB.Where("tenant_id = ?", tenantID).First(&settings).Error; err != nil {
		// If not found, return default settings
		if err.Error() == "record not found" {
			c.JSON(http.StatusOK, responses.SuccessResponse{
				Status:  "success",
				Message: "No custom settings found, using defaults",
				Data:    gin.H{"tenant_id": tenantID},
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch settings",
			Error:   err.Error(),
		})
		return
	}
	
	// Parse payment methods JSON
	var paymentMethods []string
	if settings.PaymentMethods != "" {
		json.Unmarshal([]byte(settings.PaymentMethods), &paymentMethods)
	}
	
	response := responses.TenantSettingsResponse{
		ID:                  settings.ID,
		TenantID:            settings.TenantID,
		CompanyName:         settings.CompanyName,
		Address:             settings.Address,
		Phone:               settings.Phone,
		Email:               settings.Email,
		Website:             settings.Website,
		LogoURL:             settings.LogoURL,
		PrimaryColor:        settings.PrimaryColor,
		SecondaryColor:      settings.SecondaryColor,
		InvoicePrefix:       settings.InvoicePrefix,
		InvoiceNumberFormat: settings.InvoiceNumberFormat,
		InvoiceDueDays:      settings.InvoiceDueDays,
		InvoiceFooterText:   settings.InvoiceFooterText,
		LatePenaltyPercent:  settings.LatePenaltyPercent,
		LatePenaltyMaxCap:   settings.LatePenaltyMaxCap,
		GracePeriodDays:     settings.GracePeriodDays,
		MinimumBillAmount:   settings.MinimumBillAmount,
		PaymentMethods:      paymentMethods,
		BankName:            settings.BankName,
		BankAccountName:     settings.BankAccountName,
		BankAccountNo:       settings.BankAccountNo,
		OperatingHours:      settings.OperatingHours,
		ServiceArea:         settings.ServiceArea,
		TimeZone:            settings.TimeZone,
		Language:            settings.Language,
		Currency:            settings.Currency,
		CreatedAt:           settings.CreatedAt,
		UpdatedAt:           settings.UpdatedAt,
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant settings retrieved successfully",
		Data:    response,
	})
}

// UpdateTenantSettings updates tenant settings
func UpdateTenantSettings(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var req requests.UpdateTenantSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	var settings models.TenantSettings
	err := config.DB.Where("tenant_id = ?", tenantID).First(&settings).Error
	
	// If not found, create new settings
	if err != nil {
		settings = models.TenantSettings{
			TenantID: tenantID,
		}
	}
	
	// Update fields
	if req.CompanyName != "" {
		settings.CompanyName = req.CompanyName
	}
	if req.Address != "" {
		settings.Address = req.Address
	}
	if req.Phone != "" {
		settings.Phone = req.Phone
	}
	if req.Email != "" {
		settings.Email = req.Email
	}
	if req.Website != "" {
		settings.Website = req.Website
	}
	if req.PrimaryColor != "" {
		settings.PrimaryColor = req.PrimaryColor
	}
	if req.SecondaryColor != "" {
		settings.SecondaryColor = req.SecondaryColor
	}
	if req.InvoicePrefix != "" {
		settings.InvoicePrefix = req.InvoicePrefix
	}
	if req.InvoiceDueDays > 0 {
		settings.InvoiceDueDays = req.InvoiceDueDays
	}
	if req.InvoiceFooterText != "" {
		settings.InvoiceFooterText = req.InvoiceFooterText
	}
	if req.LatePenaltyPercent >= 0 {
		settings.LatePenaltyPercent = req.LatePenaltyPercent
	}
	if req.LatePenaltyMaxCap >= 0 {
		settings.LatePenaltyMaxCap = req.LatePenaltyMaxCap
	}
	if req.GracePeriodDays >= 0 {
		settings.GracePeriodDays = req.GracePeriodDays
	}
	if req.MinimumBillAmount >= 0 {
		settings.MinimumBillAmount = req.MinimumBillAmount
	}
	if req.BankName != "" {
		settings.BankName = req.BankName
	}
	if req.BankAccountName != "" {
		settings.BankAccountName = req.BankAccountName
	}
	if req.BankAccountNo != "" {
		settings.BankAccountNo = req.BankAccountNo
	}
	if req.OperatingHours != "" {
		settings.OperatingHours = req.OperatingHours
	}
	if req.ServiceArea != "" {
		settings.ServiceArea = req.ServiceArea
	}
	if req.TimeZone != "" {
		settings.TimeZone = req.TimeZone
	}
	if req.Language != "" {
		settings.Language = req.Language
	}
	
	if err := config.DB.Save(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to update settings",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant settings updated successfully",
		Data:    settings,
	})
}

// UploadTenantLogo handles logo upload for tenant
func UploadTenantLogo(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	// Get uploaded file
	file, err := c.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "No file uploaded",
			Error:   err.Error(),
		})
		return
	}

	// Configure upload
	uploadConfig := utils.DefaultImageUploadConfig()
	uploadConfig.UploadDir = fmt.Sprintf("uploads/tenants/%s/logos", tenantID.String())

	// Save file
	filePath, err := utils.SaveUploadedFile(file, uploadConfig)
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to upload file",
			Error:   err.Error(),
		})
		return
	}

	// Get or create tenant settings
	var settings models.TenantSettings
	err = config.DB.Where("tenant_id = ?", tenantID).First(&settings).Error
	if err != nil {
		// Create new settings
		settings = models.TenantSettings{
			TenantID: tenantID,
		}
	}

	// Delete old logo if exists
	if settings.LogoURL != "" {
		utils.DeleteFile(settings.LogoURL)
	}

	// Update logo URL
	settings.LogoURL = filePath
	if err := config.DB.Save(&settings).Error; err != nil {
		// If save fails, delete uploaded file
		utils.DeleteFile(filePath)
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to update settings",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Logo uploaded successfully",
		Data: map[string]interface{}{
			"logo_url": filePath,
		},
	})
}

// GetTenantGrowthAnalytics gets tenant growth analytics (Platform Owner only)
// Focus on subscription growth, not water usage or billing
func GetTenantGrowthAnalytics(c *gin.Context) {
	// Get period parameter (default: last 6 months)
	months := 6
	if m := c.Query("months"); m != "" {
		fmt.Sscanf(m, "%d", &months)
	}
	if months <= 0 || months > 24 {
		months = 6
	}

	var analytics responses.TenantGrowthAnalyticsResponse
	analytics.Period = fmt.Sprintf("Last %d months", months)

	// Current stats
	var totalTenants, activeTenants int64
	config.DB.Model(&models.Tenant{}).Count(&totalTenants)
	config.DB.Model(&models.Tenant{}).Where("status = ?", "ACTIVE").Count(&activeTenants)
	analytics.TotalTenants = int(totalTenants)
	analytics.ActiveTenants = int(activeTenants)

	// Current month stats
	firstDayOfMonth := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.Local)
	var newTenants, churnedTenants int64
	config.DB.Model(&models.Tenant{}).Where("created_at >= ?", firstDayOfMonth).Count(&newTenants)
	config.DB.Model(&models.Tenant{}).Unscoped().Where("deleted_at >= ?", firstDayOfMonth).Count(&churnedTenants)
	analytics.NewTenants = int(newTenants)
	analytics.ChurnedTenants = int(churnedTenants)

	// Calculate rates
	if totalTenants > 0 {
		analytics.GrowthRate = (float64(newTenants) / float64(totalTenants)) * 100
		analytics.ChurnRate = (float64(churnedTenants) / float64(totalTenants)) * 100
	}

	// Monthly breakdown
	analytics.MonthlyBreakdown = []responses.MonthlyTenantStats{}
	for i := months - 1; i >= 0; i-- {
		month := time.Now().AddDate(0, -i, 0)
		firstDay := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.Local)
		lastDay := firstDay.AddDate(0, 1, 0)

		var monthNew, monthChurned, monthTotal int64
		config.DB.Model(&models.Tenant{}).Where("created_at >= ? AND created_at < ?", firstDay, lastDay).Count(&monthNew)
		config.DB.Model(&models.Tenant{}).Unscoped().Where("deleted_at >= ? AND deleted_at < ?", firstDay, lastDay).Count(&monthChurned)
		config.DB.Model(&models.Tenant{}).Where("created_at < ?", lastDay).Count(&monthTotal)

		growthRate := 0.0
		if monthTotal > 0 {
			growthRate = (float64(monthNew) / float64(monthTotal)) * 100
		}

		analytics.MonthlyBreakdown = append(analytics.MonthlyBreakdown, responses.MonthlyTenantStats{
			Month:          month.Format("January"),
			Year:           month.Year(),
			NewTenants:     int(monthNew),
			ChurnedTenants: int(monthChurned),
			TotalTenants:   int(monthTotal),
			GrowthRate:     growthRate,
		})
	}

	// Tenants by subscription plan
	analytics.TenantsByPlan = make(map[string]int)
	rows, _ := config.DB.Model(&models.Tenant{}).Select("subscription_plan, COUNT(*) as count").Group("subscription_plan").Rows()
	defer rows.Close()
	for rows.Next() {
		var plan string
		var count int
		rows.Scan(&plan, &count)
		analytics.TenantsByPlan[plan] = count
	}

	// Tenants by status
	analytics.TenantsByStatus = make(map[string]int)
	rows2, _ := config.DB.Model(&models.Tenant{}).Select("status, COUNT(*) as count").Group("status").Rows()
	defer rows2.Close()
	for rows2.Next() {
		var status string
		var count int
		rows2.Scan(&status, &count)
		analytics.TenantsByStatus[status] = count
	}

	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Tenant growth analytics retrieved successfully",
		Data:    analytics,
	})
}

// GetSubscriptionRevenueAnalytics gets subscription revenue analytics (Platform Owner only)
// This tracks platform subscription fees from tenants, NOT tenant's water billing revenue
func GetSubscriptionRevenueAnalytics(c *gin.Context) {
	// Get period parameter
	months := 6
	if m := c.Query("months"); m != "" {
		fmt.Sscanf(m, "%d", &months)
	}
	if months <= 0 || months > 24 {
		months = 6
	}

	var analytics responses.RevenueAnalyticsResponse
	analytics.Period = fmt.Sprintf("Last %d months", months)

	// MRR - Monthly Recurring Revenue from subscriptions
	var mrr float64
	config.DB.Model(&models.TenantSubscription{}).
		Where("status IN (?, ?)", "ACTIVE", "TRIAL").
		Select("COALESCE(SUM(CASE WHEN billing_cycle = 'MONTHLY' THEN monthly_price ELSE yearly_price/12 END), 0)").
		Scan(&mrr)
	analytics.MonthlyRecurringRevenue = mrr
	analytics.TotalRevenue = mrr * 12 // ARR (Annual Recurring Revenue)

	// Average revenue per tenant
	var tenantCount int64
	config.DB.Model(&models.Tenant{}).Where("status = ?", "ACTIVE").Count(&tenantCount)
	if tenantCount > 0 {
		analytics.AverageRevenuePerTenant = mrr / float64(tenantCount)
	}

	// Outstanding subscription payments
	var outstanding float64
	config.DB.Model(&models.TenantSubscription{}).
		Where("status = 'ACTIVE' AND payment_status = 'PENDING' AND next_billing_at < ?", time.Now()).
		Select("COALESCE(SUM(CASE WHEN billing_cycle = 'MONTHLY' THEN monthly_price ELSE yearly_price/12 END), 0)").
		Scan(&outstanding)
	analytics.OutstandingRevenue = outstanding

	// Monthly breakdown - subscription revenue trend
	analytics.MonthlyBreakdown = []responses.MonthlyRevenueStats{}
	for i := months - 1; i >= 0; i-- {
		month := time.Now().AddDate(0, -i, 0)
		firstDay := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.Local)
		lastDay := firstDay.AddDate(0, 1, 0)

		// Count active subscriptions in that month
		var monthMRR float64
		var activeSubscriptions int64
		config.DB.Model(&models.TenantSubscription{}).
			Where("status IN (?, ?) AND start_date <= ? AND (end_date >= ? OR end_date IS NULL)", 
				"ACTIVE", "TRIAL", lastDay, firstDay).
			Select("COALESCE(SUM(CASE WHEN billing_cycle = 'MONTHLY' THEN monthly_price ELSE yearly_price/12 END), 0)").
			Scan(&monthMRR)
		config.DB.Model(&models.TenantSubscription{}).
			Where("status IN (?, ?) AND start_date <= ? AND (end_date >= ? OR end_date IS NULL)", 
				"ACTIVE", "TRIAL", lastDay, firstDay).
			Count(&activeSubscriptions)

		// Count paid invoices
		var paidCount int64
		config.DB.Model(&models.TenantSubscription{}).
			Where("last_billed_at >= ? AND last_billed_at < ? AND payment_status = 'PAID'", firstDay, lastDay).
			Count(&paidCount)

		analytics.MonthlyBreakdown = append(analytics.MonthlyBreakdown, responses.MonthlyRevenueStats{
			Month:        month.Format("January"),
			Year:         month.Year(),
			Revenue:      monthMRR,
			Invoices:     int(activeSubscriptions),
			PaidInvoices: int(paidCount),
			GrowthRate:   0.0, // Can calculate if needed
		})
	}

	// Revenue by subscription plan
	analytics.RevenueByPlan = make(map[string]float64)
	rows, _ := config.DB.Raw(`
		SELECT plan, 
		       COALESCE(SUM(CASE WHEN billing_cycle = 'MONTHLY' THEN monthly_price ELSE yearly_price/12 END), 0) as mrr
		FROM tenant_subscriptions
		WHERE status IN ('ACTIVE', 'TRIAL')
		GROUP BY plan
	`).Rows()
	defer rows.Close()
	for rows.Next() {
		var plan string
		var revenue float64
		rows.Scan(&plan, &revenue)
		analytics.RevenueByPlan[plan] = revenue * 12 // Show as annual
	}

	// Payment method stats (subscription payments)
	analytics.PaymentMethodStats = make(map[string]int)
	rows2, _ := config.DB.Model(&models.TenantSubscription{}).
		Select("billing_cycle, COUNT(*) as count").
		Where("status IN (?, ?)", "ACTIVE", "TRIAL").
		Group("billing_cycle").Rows()
	defer rows2.Close()
	for rows2.Next() {
		var method string
		var count int
		rows2.Scan(&method, &count)
		analytics.PaymentMethodStats[method] = count
	}

	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Subscription revenue analytics retrieved successfully",
		Data:    analytics,
	})
}

// GetPlatformUsageAnalytics gets platform usage statistics (Platform Owner only)
// Shows tenant platform usage metrics for subscription tier management
func GetPlatformUsageAnalytics(c *gin.Context) {
	months := 6
	if m := c.Query("months"); m != "" {
		fmt.Sscanf(m, "%d", &months)
	}
	if months <= 0 || months > 24 {
		months = 6
	}

	var analytics responses.UsageAnalyticsResponse
	analytics.Period = fmt.Sprintf("Last %d months", months)

	// Overall app usage stats (not water usage)
	var totalUsers, activeUsers, totalCustomers int64
	config.DB.Model(&models.User{}).Count(&totalUsers)
	config.DB.Model(&models.User{}).Where("is_active = ?", true).Count(&activeUsers)
	config.DB.Model(&models.Customer{}).Count(&totalCustomers)
	analytics.TotalUsers = int(totalUsers)
	analytics.ActiveUsers = int(activeUsers)
	analytics.TotalCustomers = int(totalCustomers) // For pricing calculation

	// Storage used across platform
	var storageUsed float64
	config.DB.Model(&models.Tenant{}).Select("COALESCE(SUM(storage_used_gb), 0)").Scan(&storageUsed)
	analytics.StorageUsedGB = storageUsed

	// API calls (placeholder - would need separate tracking)
	analytics.APICallsTotal = 0

	// Monthly platform usage trend (users and customers growth)
	analytics.MonthlyUsageBreakdown = []responses.MonthlyUsageStats{}
	for i := months - 1; i >= 0; i-- {
		month := time.Now().AddDate(0, -i, 0)
		firstDay := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.Local)
		lastDay := firstDay.AddDate(0, 1, 0)

		var newUsers, newCustomers int64
		config.DB.Model(&models.User{}).Where("created_at >= ? AND created_at < ?", firstDay, lastDay).Count(&newUsers)
		config.DB.Model(&models.Customer{}).Where("created_at >= ? AND created_at < ?", firstDay, lastDay).Count(&newCustomers)

		analytics.MonthlyUsageBreakdown = append(analytics.MonthlyUsageBreakdown, responses.MonthlyUsageStats{
			Month:            month.Format("January"),
			Year:             month.Year(),
			WaterUsageM3:     0, // Not tracked at platform level
			InvoicesIssued:   int(newUsers),      // Repurposed: new app users
			PaymentsReceived: int(newCustomers),  // Repurposed: new customers managed
			APICallsCount:    0,
		})
	}

	// Top tenants by customer count (for subscription tier pricing)
	analytics.TopTenantsByUsage = []responses.TenantUsageStats{}
	rows, _ := config.DB.Raw(`
		SELECT t.id, t.name, t.total_customers, 
		       t.storage_used_gb,
		       (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count
		FROM tenants t
		WHERE t.status = 'ACTIVE'
		ORDER BY t.total_customers DESC
		LIMIT 10
	`).Rows()
	defer rows.Close()
	for rows.Next() {
		var stat responses.TenantUsageStats
		var userCount int
		rows.Scan(&stat.TenantID, &stat.TenantName, &stat.Customers, &stat.StorageUsedGB, &userCount)
		stat.WaterUsageM3 = 0 // Not relevant for platform owner
		stat.Revenue = 0      // Not relevant for platform owner
		analytics.TopTenantsByUsage = append(analytics.TopTenantsByUsage, stat)
	}

	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Platform usage analytics retrieved successfully",
		Data:    analytics,
	})
}

// ListSubscriptionPlans lists all available subscription plans
func ListSubscriptionPlans(c *gin.Context) {
	var plans []models.SubscriptionPlanDetails
	
	query := config.DB.Model(&models.SubscriptionPlanDetails{})
	
	// Only show active plans by default
	if c.Query("include_inactive") != "true" {
		query = query.Where("is_active = ?", true)
	}
	
	query = query.Order("display_order ASC, monthly_price ASC")
	
	if err := query.Find(&plans).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch subscription plans",
			Error:   err.Error(),
		})
		return
	}
	
	// Transform to response
	var planList []responses.SubscriptionPlanResponse
	for _, plan := range plans {
		var features []string
		if plan.Features != "" {
			json.Unmarshal([]byte(plan.Features), &features)
		}
		
		planList = append(planList, responses.SubscriptionPlanResponse{
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
		})
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Subscription plans retrieved successfully",
		Data:    planList,
	})
}

// CreateSubscriptionPlan creates a new subscription plan
func CreateSubscriptionPlan(c *gin.Context) {
	var req requests.CreateSubscriptionPlanRequest
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	// Check if plan already exists
	var existingPlan models.SubscriptionPlanDetails
	if err := config.DB.Where("plan = ?", req.Plan).First(&existingPlan).Error; err == nil {
		c.JSON(http.StatusConflict, responses.ErrorResponse{
			Status:  "error",
			Message: "Subscription plan already exists",
			Error:   "Plan with this code already exists",
		})
		return
	}
	
	// Convert features to JSON
	featuresJSON, _ := json.Marshal(req.Features)
	
	plan := models.SubscriptionPlanDetails{
		Plan:              models.SubscriptionPlan(req.Plan),
		Name:              req.Name,
		Description:       req.Description,
		MonthlyPrice:      req.MonthlyPrice,
		YearlyPrice:       req.YearlyPrice,
		MaxUsers:          req.MaxUsers,
		MaxCustomers:      req.MaxCustomers,
		MaxStorageGB:      req.MaxStorageGB,
		MaxAPICallsPerDay: req.MaxAPICallsPerDay,
		Features:          string(featuresJSON),
		TrialDays:         req.TrialDays,
		DisplayOrder:      req.DisplayOrder,
		IsActive:          true,
	}
	
	if err := config.DB.Create(&plan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to create subscription plan",
			Error:   err.Error(),
		})
		return
	}
	
	var features []string
	json.Unmarshal([]byte(plan.Features), &features)
	
	c.JSON(http.StatusCreated, responses.SuccessResponse{
		Status:  "success",
		Message: "Subscription plan created successfully",
		Data: responses.SubscriptionPlanResponse{
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
		},
	})
}

// UpdateSubscriptionPlan updates an existing subscription plan
func UpdateSubscriptionPlan(c *gin.Context) {
	planID := c.Param("id")
	
	var plan models.SubscriptionPlanDetails
	if err := config.DB.Where("id = ?", planID).First(&plan).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Subscription plan not found",
			Error:   err.Error(),
		})
		return
	}
	
	var req requests.UpdateSubscriptionPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	// Update fields
	if req.Name != "" {
		plan.Name = req.Name
	}
	if req.Description != "" {
		plan.Description = req.Description
	}
	if req.MonthlyPrice > 0 {
		plan.MonthlyPrice = req.MonthlyPrice
	}
	if req.YearlyPrice > 0 {
		plan.YearlyPrice = req.YearlyPrice
	}
	if req.MaxUsers > 0 {
		plan.MaxUsers = req.MaxUsers
	}
	if req.MaxCustomers > 0 {
		plan.MaxCustomers = req.MaxCustomers
	}
	if req.MaxStorageGB > 0 {
		plan.MaxStorageGB = req.MaxStorageGB
	}
	if req.MaxAPICallsPerDay > 0 {
		plan.MaxAPICallsPerDay = req.MaxAPICallsPerDay
	}
	if req.Features != nil {
		featuresJSON, _ := json.Marshal(req.Features)
		plan.Features = string(featuresJSON)
	}
	if req.TrialDays >= 0 {
		plan.TrialDays = req.TrialDays
	}
	if req.DisplayOrder > 0 {
		plan.DisplayOrder = req.DisplayOrder
	}
	if req.IsActive != nil {
		plan.IsActive = *req.IsActive
	}
	
	if err := config.DB.Save(&plan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to update subscription plan",
			Error:   err.Error(),
		})
		return
	}
	
	var features []string
	json.Unmarshal([]byte(plan.Features), &features)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Subscription plan updated successfully",
		Data: responses.SubscriptionPlanResponse{
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
		},
	})
}

// AssignSubscriptionToTenant assigns a subscription plan to a tenant
func AssignSubscriptionToTenant(c *gin.Context) {
	tenantID := c.Param("id")
	
	var tenant models.Tenant
	if err := config.DB.Where("id = ?", tenantID).First(&tenant).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
			Error:   err.Error(),
		})
		return
	}
	
	var req requests.AssignSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	// Get plan details
	var planDetails models.SubscriptionPlanDetails
	if err := config.DB.Where("plan = ? AND is_active = ?", req.Plan, true).First(&planDetails).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Subscription plan not found or inactive",
			Error:   err.Error(),
		})
		return
	}
	
	// Parse start date or use current time
	startDate := time.Now()
	if req.StartDate != "" {
		parsedDate, err := time.Parse("2006-01-02", req.StartDate)
		if err == nil {
			startDate = parsedDate
		}
	}
	
	// Calculate end date based on billing cycle
	var endDate time.Time
	if req.BillingCycle == "MONTHLY" {
		endDate = startDate.AddDate(0, 1, 0)
	} else {
		endDate = startDate.AddDate(1, 0, 0)
	}
	
	// Calculate trial end date
	var trialEndsAt *time.Time
	trialDays := req.TrialDays
	if trialDays == 0 {
		trialDays = planDetails.TrialDays
	}
	if trialDays > 0 {
		trialEnd := startDate.AddDate(0, 0, trialDays)
		trialEndsAt = &trialEnd
	}
	
	// Get or create subscription
	var subscription models.TenantSubscription
	err := config.DB.Where("tenant_id = ?", tenantID).First(&subscription).Error
	
	if err != nil {
		// Create new subscription
		subscription = models.TenantSubscription{
			TenantID:          uuid.MustParse(tenantID),
			Plan:              models.SubscriptionPlan(req.Plan),
			Status:            models.StatusTrial,
			BillingCycle:      models.BillingCycle(req.BillingCycle),
			MonthlyPrice:      planDetails.MonthlyPrice,
			YearlyPrice:       planDetails.YearlyPrice,
			MaxUsers:          planDetails.MaxUsers,
			MaxCustomers:      planDetails.MaxCustomers,
			MaxStorageGB:      planDetails.MaxStorageGB,
			MaxAPICallsPerDay: planDetails.MaxAPICallsPerDay,
			StartDate:         startDate,
			EndDate:           endDate,
			TrialEndsAt:       trialEndsAt,
			PaymentStatus:     "PENDING",
		}
		
		if trialDays == 0 {
			subscription.Status = models.StatusActive
		}
		
		if err := config.DB.Create(&subscription).Error; err != nil {
			c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
				Status:  "error",
				Message: "Failed to create subscription",
				Error:   err.Error(),
			})
			return
		}
	} else {
		// Update existing subscription
		subscription.Plan = models.SubscriptionPlan(req.Plan)
		subscription.BillingCycle = models.BillingCycle(req.BillingCycle)
		subscription.MonthlyPrice = planDetails.MonthlyPrice
		subscription.YearlyPrice = planDetails.YearlyPrice
		subscription.MaxUsers = planDetails.MaxUsers
		subscription.MaxCustomers = planDetails.MaxCustomers
		subscription.MaxStorageGB = planDetails.MaxStorageGB
		subscription.MaxAPICallsPerDay = planDetails.MaxAPICallsPerDay
		subscription.StartDate = startDate
		subscription.EndDate = endDate
		subscription.TrialEndsAt = trialEndsAt
		
		if trialDays > 0 {
			subscription.Status = models.StatusTrial
		} else if subscription.Status != models.StatusActive {
			subscription.Status = models.StatusActive
		}
		
		if err := config.DB.Save(&subscription).Error; err != nil {
			c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
				Status:  "error",
				Message: "Failed to update subscription",
				Error:   err.Error(),
			})
			return
		}
	}
	
	// Update tenant
	tenant.SubscriptionPlan = req.Plan
	tenant.SubscriptionStatus = string(subscription.Status)
	tenant.SubscriptionEndsAt = &endDate
	config.DB.Save(&tenant)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Subscription assigned successfully",
		Data: responses.TenantSubscriptionResponse{
			ID:                subscription.ID,
			TenantID:          subscription.TenantID,
			Plan:              string(subscription.Plan),
			Status:            string(subscription.Status),
			BillingCycle:      string(subscription.BillingCycle),
			MonthlyPrice:      subscription.MonthlyPrice,
			YearlyPrice:       subscription.YearlyPrice,
			MaxUsers:          subscription.MaxUsers,
			MaxCustomers:      subscription.MaxCustomers,
			MaxStorageGB:      subscription.MaxStorageGB,
			MaxAPICallsPerDay: subscription.MaxAPICallsPerDay,
			StartDate:         subscription.StartDate,
			EndDate:           subscription.EndDate,
			NextBillingAt:     subscription.NextBillingAt,
			LastBilledAt:      subscription.LastBilledAt,
			TrialEndsAt:       subscription.TrialEndsAt,
			LastPaymentAmount: subscription.LastPaymentAmount,
			LastPaymentDate:   subscription.LastPaymentDate,
			PaymentStatus:     subscription.PaymentStatus,
			Notes:             subscription.Notes,
			CreatedAt:         subscription.CreatedAt,
			UpdatedAt:         subscription.UpdatedAt,
		},
	})
}

// GetTenantBillingHistory gets the billing history for a tenant
func GetTenantBillingHistory(c *gin.Context) {
	tenantID := c.Param("id")
	
	// Verify tenant exists
	var tenant models.Tenant
	if err := config.DB.Where("id = ?", tenantID).First(&tenant).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Tenant not found",
			Error:   err.Error(),
		})
		return
	}
	
	// Get all payments for this tenant's invoices
	var payments []models.Payment
	config.DB.Joins("JOIN invoices ON invoices.id = payments.invoice_id").
		Where("invoices.tenant_id = ?", tenantID).
		Order("payments.created_at DESC").
		Limit(100).
		Find(&payments)
	
	// Get subscription history
	var subscriptions []models.TenantSubscription
	config.DB.Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&subscriptions)
	
	var totalPaid float64
	for _, payment := range payments {
		totalPaid += payment.Amount
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Billing history retrieved successfully",
		Data: map[string]interface{}{
			"tenant_id":      tenantID,
			"tenant_name":    tenant.Name,
			"payments":       payments,
			"subscriptions":  subscriptions,
			"total_paid":     totalPaid,
			"current_status": tenant.SubscriptionStatus,
		},
	})
}
