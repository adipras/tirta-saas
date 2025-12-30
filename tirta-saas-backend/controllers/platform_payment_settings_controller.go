package controllers

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetPlatformPaymentSettings godoc
// @Summary Get platform payment settings for subscription payments
// @Description Get bank account and payment method information for platform subscription payments (public endpoint)
// @Tags Public
// @Accept json
// @Produce json
// @Success 200 {object} responses.PlatformPaymentSettingsResponse
// @Failure 500 {object} responses.ErrorResponse
// @Router /api/public/platform-payment-settings [get]
func GetPlatformPaymentSettings(c *gin.Context) {
	// Platform owner tenant ID - this should be a known constant or environment variable
	// For now, we'll get the first tenant with platform_owner role
	var platformTenant models.Tenant
	
	// Try to find platform owner tenant (you might want to use a specific ID or flag)
	if err := config.DB.Where("status = ?", "ACTIVE").Order("created_at ASC").First(&platformTenant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Platform payment settings not configured",
			Error:   "Platform tenant not found",
		})
		return
	}
	
	// Get tenant settings
	var settings models.TenantSettings
	if err := config.DB.Where("tenant_id = ?", platformTenant.ID).First(&settings).Error; err != nil {
		// Return default/hardcoded settings if not found
		c.JSON(http.StatusOK, responses.PlatformPaymentSettingsResponse{
			BankAccounts: []responses.BankAccountInfo{
				{
					BankName:      "BCA",
					AccountNumber: "1234567890",
					AccountName:   "PT Tirta SaaS Indonesia",
				},
			},
			PaymentMethods: []string{"bank_transfer", "e_wallet"},
		})
		return
	}
	
	// Build response
	bankAccounts := []responses.BankAccountInfo{}
	if settings.BankName != "" && settings.BankAccountNo != "" {
		bankAccounts = append(bankAccounts, responses.BankAccountInfo{
			BankName:      settings.BankName,
			AccountNumber: settings.BankAccountNo,
			AccountName:   settings.BankAccountName,
		})
	}
	
	// If no bank accounts, return default
	if len(bankAccounts) == 0 {
		bankAccounts = []responses.BankAccountInfo{
			{
				BankName:      "BCA",
				AccountNumber: "1234567890",
				AccountName:   "PT Tirta SaaS Indonesia",
			},
		}
	}
	
	paymentMethods := []string{"bank_transfer", "e_wallet", "other"}
	
	response := responses.PlatformPaymentSettingsResponse{
		BankAccounts:   bankAccounts,
		PaymentMethods: paymentMethods,
		CompanyName:    settings.CompanyName,
		Phone:          settings.Phone,
		Email:          settings.Email,
	}
	
	c.JSON(http.StatusOK, response)
}

// For platform owner to manage platform payment settings
// GetPlatformOwnSettings gets the platform owner's payment settings
func GetPlatformOwnSettings(c *gin.Context) {
	// Get tenant ID from JWT context
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, responses.ErrorResponse{
			Status:  "error",
			Message: "Unauthorized",
			Error:   "Tenant ID not found in context",
		})
		return
	}
	
	var settings models.TenantSettings
	if err := config.DB.Where("tenant_id = ?", tenantID.(uuid.UUID)).First(&settings).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Settings not found",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Platform settings retrieved",
		Data:    settings,
	})
}

// UpdatePlatformOwnSettings updates platform owner's payment settings
func UpdatePlatformOwnSettings(c *gin.Context) {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, responses.ErrorResponse{
			Status:  "error",
			Message: "Unauthorized",
		})
		return
	}
	
	var settings models.TenantSettings
	if err := config.DB.Where("tenant_id = ?", tenantID.(uuid.UUID)).First(&settings).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Settings not found",
			Error:   err.Error(),
		})
		return
	}
	
	var req struct {
		BankName        string `json:"bank_name"`
		BankAccountName string `json:"bank_account_name"`
		BankAccountNo   string `json:"bank_account_no"`
		CompanyName     string `json:"company_name"`
		Phone           string `json:"phone"`
		Email           string `json:"email"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request",
			Error:   err.Error(),
		})
		return
	}
	
	// Update settings
	updates := map[string]interface{}{}
	if req.BankName != "" {
		updates["bank_name"] = req.BankName
	}
	if req.BankAccountName != "" {
		updates["bank_account_name"] = req.BankAccountName
	}
	if req.BankAccountNo != "" {
		updates["bank_account_no"] = req.BankAccountNo
	}
	if req.CompanyName != "" {
		updates["company_name"] = req.CompanyName
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	
	if err := config.DB.Model(&settings).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to update settings",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Platform settings updated",
		Data:    settings,
	})
}
