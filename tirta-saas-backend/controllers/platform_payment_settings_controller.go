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
// @Description Get bank account and QR code information for platform subscription payments (public endpoint)
// @Tags Public
// @Accept json
// @Produce json
// @Success 200 {object} responses.PlatformPaymentSettingsResponse
// @Failure 500 {object} responses.ErrorResponse
// @Router /api/public/platform-payment-settings [get]
func GetPlatformPaymentSettings(c *gin.Context) {
	var bankAccounts []models.PlatformBankAccount
	config.DB.Where("is_active = ?", true).Order("is_primary DESC, bank_name ASC").Find(&bankAccounts)

	var qrCodes []models.PlatformQRCode
	config.DB.Where("is_active = ?", true).Order("is_primary DESC, created_at ASC").Find(&qrCodes)

	bankAccountInfos := make([]responses.BankAccountInfo, len(bankAccounts))
	for i, a := range bankAccounts {
		bankAccountInfos[i] = responses.BankAccountInfo{
			BankName:      a.BankName,
			AccountNumber: a.AccountNumber,
			AccountName:   a.AccountName,
		}
	}

	// Fallback ke data hardcoded jika platform belum mengisi rekening
	if len(bankAccountInfos) == 0 {
		bankAccountInfos = []responses.BankAccountInfo{
			{
				BankName:      "BCA",
				AccountNumber: "1234567890",
				AccountName:   "PT Tirta SaaS Indonesia",
			},
		}
	}

	qrCodeResponses := make([]responses.QRCodeResponse, len(qrCodes))
	for i, qr := range qrCodes {
		qrCodeResponses[i] = responses.QRCodeResponse{
			ID:        qr.ID,
			Type:      qr.Type,
			ImageURL:  qr.ImageURL,
			IsPrimary: qr.IsPrimary,
			IsActive:  qr.IsActive,
			Notes:     qr.Notes,
		}
	}

	paymentMethods := []string{"bank_transfer"}
	if len(qrCodes) > 0 {
		paymentMethods = append(paymentMethods, "e_wallet")
	}

	c.JSON(http.StatusOK, responses.PlatformPaymentSettingsResponse{
		BankAccounts:   bankAccountInfos,
		QRCodes:        qrCodeResponses,
		PaymentMethods: paymentMethods,
	})
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
