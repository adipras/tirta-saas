package controllers

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
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

	tenantID := c.GetString("tenant_id")
	tenantUUID, _ := uuid.Parse(tenantID)

	// If set as primary, unset other primary accounts
	if req.IsPrimary {
		ctrl.DB.Model(&models.BankAccount{}).Where("tenant_id = ?", tenantID).Update("is_primary", false)
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
	tenantID := c.GetString("tenant_id")

	var bankAccounts []models.BankAccount
	if err := ctrl.DB.Where("tenant_id = ?", tenantID).Order("is_primary DESC, bank_name ASC").Find(&bankAccounts).Error; err != nil {
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
	tenantID := c.GetString("tenant_id")

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
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&bankAccount).Error; err != nil {
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
	tenantID := c.GetString("tenant_id")

	parsedID, err := uuid.Parse(accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bank account ID"})
		return
	}

	var bankAccount models.BankAccount
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&bankAccount).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bank account not found"})
		return
	}

	// Unset all primary accounts
	ctrl.DB.Model(&models.BankAccount{}).Where("tenant_id = ?", tenantID).Update("is_primary", false)

	// Set this account as primary
	bankAccount.IsPrimary = true
	if err := ctrl.DB.Save(&bankAccount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set primary bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Primary bank account set successfully"})
}
