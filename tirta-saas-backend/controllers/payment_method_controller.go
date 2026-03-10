package controllers

import (
	"fmt"
	"net/http"

	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentMethodController struct {
	DB *gorm.DB
}

func NewPaymentMethodController(db *gorm.DB) *PaymentMethodController {
	return &PaymentMethodController{DB: db}
}

// CreatePaymentMethod creates a new payment method
func (ctrl *PaymentMethodController) CreatePaymentMethod(c *gin.Context) {
	var req requests.CreatePaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := c.GetString("tenant_id")
	tenantUUID, _ := uuid.Parse(tenantID)

	paymentMethod := models.PaymentMethod{
		TenantID:      tenantUUID,
		Name:          req.Name,
		Type:          req.Type,
		Description:   req.Description,
		Configuration: req.Configuration,
		DisplayOrder:  req.DisplayOrder,
		IsActive:      true,
	}

	if err := ctrl.DB.Create(&paymentMethod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment method"})
		return
	}

	response := responses.ToPaymentMethodResponse(&paymentMethod)
	c.JSON(http.StatusCreated, gin.H{"message": "Payment method created successfully", "data": response})
}

// GetPaymentMethods lists all payment methods
func (ctrl *PaymentMethodController) GetPaymentMethods(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var paymentMethods []models.PaymentMethod
	if err := ctrl.DB.Where("tenant_id = ?", tenantID).Order("display_order ASC, name ASC").Find(&paymentMethods).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payment methods"})
		return
	}

	methodResponses := make([]responses.PaymentMethodResponse, len(paymentMethods))
	for i, method := range paymentMethods {
		methodResponses[i] = responses.ToPaymentMethodResponse(&method)
	}

	c.JSON(http.StatusOK, gin.H{"data": methodResponses})
}

// UpdatePaymentMethod updates a payment method
func (ctrl *PaymentMethodController) UpdatePaymentMethod(c *gin.Context) {
	methodID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req requests.UpdatePaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(methodID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method ID"})
		return
	}

	var paymentMethod models.PaymentMethod
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&paymentMethod).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
		return
	}

	paymentMethod.Name = req.Name
	paymentMethod.Description = req.Description
	paymentMethod.Configuration = req.Configuration
	paymentMethod.DisplayOrder = req.DisplayOrder
	if req.IsActive != nil {
		paymentMethod.IsActive = *req.IsActive
	}

	if err := ctrl.DB.Save(&paymentMethod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment method"})
		return
	}

	response := responses.ToPaymentMethodResponse(&paymentMethod)
	c.JSON(http.StatusOK, gin.H{"message": "Payment method updated successfully", "data": response})
}

// TogglePaymentMethod enables/disables a payment method
func (ctrl *PaymentMethodController) TogglePaymentMethod(c *gin.Context) {
	methodID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedID, err := uuid.Parse(methodID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method ID"})
		return
	}

	var paymentMethod models.PaymentMethod
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&paymentMethod).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
		return
	}

	paymentMethod.IsActive = !paymentMethod.IsActive
	if err := ctrl.DB.Save(&paymentMethod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle payment method"})
		return
	}

	status := "disabled"
	if paymentMethod.IsActive {
		status = "enabled"
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment method " + status + " successfully", "data": paymentMethod})
}

// CreateBankAccount creates a new bank account
func (ctrl *PaymentMethodController) CreateBankAccount(c *gin.Context) {
	var req requests.CreateBankAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If set as primary, unset other primary accounts
	if req.IsPrimary {
		ctrl.DB.Model(&models.BankAccount{}).Where("tenant_id = ?", tenantUUID).Update("is_primary", false)
	}

	bankAccount := models.BankAccount{
		TenantID:      tenantUUID,
		BankName:      req.BankName,
		AccountNumber: req.AccountNumber,
		AccountName:   req.AccountName,
		BankBranch:    req.BankBranch,
		SwiftCode:     req.SwiftCode,
		Notes:         req.Notes,
		IsPrimary:     req.IsPrimary,
		IsActive:      true,
	}

	if err := ctrl.DB.Create(&bankAccount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bank account"})
		return
	}

	response := responses.ToBankAccountResponse(&bankAccount)
	c.JSON(http.StatusCreated, gin.H{"message": "Bank account created successfully", "data": response})
}

// GetBankAccounts lists all bank accounts
func (ctrl *PaymentMethodController) GetBankAccounts(c *gin.Context) {
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var bankAccounts []models.BankAccount
	if err := ctrl.DB.Where("tenant_id = ?", tenantUUID).Order("is_primary DESC, bank_name ASC").Find(&bankAccounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bank accounts"})
		return
	}

	accountResponses := make([]responses.BankAccountResponse, len(bankAccounts))
	for i, account := range bankAccounts {
		accountResponses[i] = responses.ToBankAccountResponse(&account)
	}

	c.JSON(http.StatusOK, gin.H{"data": accountResponses})
}

// UpdateBankAccount updates a bank account
func (ctrl *PaymentMethodController) UpdateBankAccount(c *gin.Context) {
	accountID := c.Param("id")
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var req requests.UpdateBankAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bank account ID"})
		return
	}

	var bankAccount models.BankAccount
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantUUID).First(&bankAccount).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bank account not found"})
		return
	}

	bankAccount.BankName = req.BankName
	bankAccount.AccountNumber = req.AccountNumber
	bankAccount.AccountName = req.AccountName
	bankAccount.BankBranch = req.BankBranch
	bankAccount.SwiftCode = req.SwiftCode
	bankAccount.Notes = req.Notes
	if req.IsActive != nil {
		bankAccount.IsActive = *req.IsActive
	}

	if err := ctrl.DB.Save(&bankAccount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bank account"})
		return
	}

	response := responses.ToBankAccountResponse(&bankAccount)
	c.JSON(http.StatusOK, gin.H{"message": "Bank account updated successfully", "data": response})
}

// SetPrimaryBankAccount sets a bank account as primary
func (ctrl *PaymentMethodController) SetPrimaryBankAccount(c *gin.Context) {
	accountID := c.Param("id")
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bank account ID"})
		return
	}

	var bankAccount models.BankAccount
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantUUID).First(&bankAccount).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bank account not found"})
		return
	}

	// Unset all primary accounts
	ctrl.DB.Model(&models.BankAccount{}).Where("tenant_id = ?", tenantUUID).Update("is_primary", false)

	// Set this account as primary
	bankAccount.IsPrimary = true
	if err := ctrl.DB.Save(&bankAccount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set primary bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Primary bank account set successfully"})
}

// DeleteBankAccount deletes a bank account
func (ctrl *PaymentMethodController) DeleteBankAccount(c *gin.Context) {
	accountID := c.Param("id")
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bank account ID"})
		return
	}

	var bankAccount models.BankAccount
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantUUID).First(&bankAccount).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bank account not found"})
		return
	}

	if err := ctrl.DB.Delete(&bankAccount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bank account deleted successfully"})
}

// GetQRCodes lists all QR codes for the tenant
func (ctrl *PaymentMethodController) GetQRCodes(c *gin.Context) {
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var qrCodes []models.QRCode
	if err := ctrl.DB.Where("tenant_id = ?", tenantUUID).Order("is_primary DESC, created_at ASC").Find(&qrCodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch QR codes"})
		return
	}

	result := make([]responses.QRCodeResponse, len(qrCodes))
	for i, qr := range qrCodes {
		result[i] = responses.ToQRCodeResponse(&qr)
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreateQRCode creates a new QR code with optional image upload
func (ctrl *PaymentMethodController) CreateQRCode(c *gin.Context) {
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var req requests.CreateQRCodeRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If set as primary, unset others
	if req.IsPrimary {
		ctrl.DB.Model(&models.QRCode{}).Where("tenant_id = ?", tenantUUID).Update("is_primary", false)
	}

	imageURL := ""
	file, fileErr := c.FormFile("image")
	if fileErr == nil {
		uploadConfig := utils.DefaultImageUploadConfig()
		uploadConfig.MaxSize = 2 * 1024 * 1024 // 2MB
		uploadConfig.UploadDir = fmt.Sprintf("uploads/tenants/%s/qr", tenantUUID.String())
		filePath, uploadErr := utils.SaveUploadedFile(file, uploadConfig)
		if uploadErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image upload failed: " + uploadErr.Error()})
			return
		}
		imageURL = filePath
	}

	qrCode := models.QRCode{
		TenantID:  tenantUUID,
		Type:      req.Type,
		ImageURL:  imageURL,
		IsPrimary: req.IsPrimary,
		IsActive:  req.IsActive,
		Notes:     req.Notes,
	}

	if err := ctrl.DB.Create(&qrCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create QR code"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "QR code created successfully", "data": responses.ToQRCodeResponse(&qrCode)})
}

// UpdateQRCode updates a QR code
func (ctrl *PaymentMethodController) UpdateQRCode(c *gin.Context) {
	qrID := c.Param("id")
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(qrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid QR code ID"})
		return
	}

	var qrCode models.QRCode
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantUUID).First(&qrCode).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "QR code not found"})
		return
	}

	var req requests.UpdateQRCodeRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Handle new image upload
	file, fileErr := c.FormFile("image")
	if fileErr == nil {
		uploadConfig := utils.DefaultImageUploadConfig()
		uploadConfig.MaxSize = 2 * 1024 * 1024
		uploadConfig.UploadDir = fmt.Sprintf("uploads/tenants/%s/qr", tenantUUID.String())
		filePath, uploadErr := utils.SaveUploadedFile(file, uploadConfig)
		if uploadErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image upload failed: " + uploadErr.Error()})
			return
		}
		// Delete old image if exists
		utils.DeleteFile(qrCode.ImageURL)
		qrCode.ImageURL = filePath
	}

	qrCode.Type = req.Type
	qrCode.IsPrimary = req.IsPrimary
	qrCode.Notes = req.Notes
	if req.IsActive != nil {
		qrCode.IsActive = *req.IsActive
	}

	if err := ctrl.DB.Save(&qrCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "QR code updated successfully", "data": responses.ToQRCodeResponse(&qrCode)})
}

// SetPrimaryQRCode sets a QR code as primary
func (ctrl *PaymentMethodController) SetPrimaryQRCode(c *gin.Context) {
	qrID := c.Param("id")
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(qrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid QR code ID"})
		return
	}

	var qrCode models.QRCode
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantUUID).First(&qrCode).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "QR code not found"})
		return
	}

	ctrl.DB.Model(&models.QRCode{}).Where("tenant_id = ?", tenantUUID).Update("is_primary", false)
	qrCode.IsPrimary = true
	if err := ctrl.DB.Save(&qrCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set primary QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Primary QR code set successfully"})
}

// DeleteQRCode deletes a QR code and its image file
func (ctrl *PaymentMethodController) DeleteQRCode(c *gin.Context) {
	qrID := c.Param("id")
	tenantUUID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(qrID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid QR code ID"})
		return
	}

	var qrCode models.QRCode
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantUUID).First(&qrCode).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "QR code not found"})
		return
	}

	// Delete image file from disk
	utils.DeleteFile(qrCode.ImageURL)

	if err := ctrl.DB.Delete(&qrCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "QR code deleted successfully"})
}
