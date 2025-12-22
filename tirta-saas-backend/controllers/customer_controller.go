package controllers

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
)

// CreateCustomer godoc
// @Summary Create new customer
// @Description Create a new customer with subscription
// @Tags Customers
// @Accept json
// @Produce json
// @Param request body requests.CreateCustomerRequest true "Create customer request"
// @Security BearerAuth
// @Success 201 {object} responses.CustomerResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/customers [post]
func CreateCustomer(c *gin.Context) {
	var req requests.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ambil SubscriptionType
	var subType models.SubscriptionType
	if err := config.DB.Where("id = ? AND tenant_id = ?", req.SubscriptionID, tenantID).First(&subType).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Subscription type not found"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Begin transaction for customer creation and invoice generation
	tx := config.DB.Begin()
	
	// Buat Customer
	customer := models.Customer{
		MeterNumber:    req.MeterNumber,
		Name:           req.Name,
		Email:          req.Email,
		Password:       hashedPassword,
		Phone:          req.Phone,
		Address:        req.Address,
		SubscriptionID: req.SubscriptionID,
		IsActive:       false,
		TenantID:       tenantID,
	}
	if err := tx.Create(&customer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	// Buat Invoice untuk biaya pendaftaran
	invoice := models.Invoice{
		CustomerID:  customer.ID,
		UsageMonth:  "", // Kosong karena ini bukan invoice pemakaian
		UsageM3:     0,
		Abonemen:    0,
		PricePerM3:  0,
		TotalAmount: subType.RegistrationFee,
		IsPaid:      false,
		TotalPaid:   0,
		Type:        "registration",
		TenantID:    tenantID,
	}
	if err := tx.Create(&invoice).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create registration invoice"})
		return
	}
	
	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete customer registration"})
		return
	}

	// Respon
	response := responses.CustomerResponse{
		ID:             customer.ID,
		MeterNumber:    customer.MeterNumber,
		Name:           customer.Name,
		Email:          customer.Email,
		Address:        customer.Address,
		Phone:          customer.Phone,
		SubscriptionID: customer.SubscriptionID,
		IsActive:       customer.IsActive,
	}
	c.JSON(http.StatusCreated, response)
}

// GetCustomers godoc
// @Summary List customers
// @Description Get list of all customers for the tenant
// @Tags Customers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} responses.CustomerResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/customers [get]
func GetCustomers(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customers []models.Customer
	query := config.DB.Preload("Subscription")
	
	// If has specific tenant, filter by it
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	// If no specific tenant (platform owner without filter), return all

	if err := query.Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
		return
	}

	// Convert to response format
	customerResponses := make([]responses.CustomerResponse, len(customers))
	for i, customer := range customers {
		customerResponses[i] = responses.CustomerResponse{
			ID:             customer.ID,
			MeterNumber:    customer.MeterNumber,
			Name:           customer.Name,
			Email:          customer.Email,
			Address:        customer.Address,
			Phone:          customer.Phone,
			SubscriptionID: customer.SubscriptionID,
			IsActive:       customer.IsActive,
		}
	}

	response := responses.CustomerListResponse{
		Customers: customerResponses,
		Total:     len(customerResponses),
	}
	c.JSON(http.StatusOK, response)
}

// GetCustomer godoc
// @Summary Get customer by ID
// @Description Get detailed information of a specific customer
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID"
// @Security BearerAuth
// @Success 200 {object} responses.CustomerResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/customers/{id} [get]
func GetCustomer(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := c.Param("id")
	
	var customer models.Customer
	query := config.DB.Preload("Subscription").Where("id = ?", id)
	
	// If has specific tenant, add tenant filter
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if err := query.First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}
	
	response := responses.CustomerResponse{
		ID:             customer.ID,
		MeterNumber:    customer.MeterNumber,
		Name:           customer.Name,
		Email:          customer.Email,
		Address:        customer.Address,
		Phone:          customer.Phone,
		SubscriptionID: customer.SubscriptionID,
		IsActive:       customer.IsActive,
	}
	c.JSON(http.StatusOK, response)
}

// UpdateCustomer godoc
// @Summary Update customer
// @Description Update customer information
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID"
// @Param request body requests.UpdateCustomerRequest true "Update customer request"
// @Security BearerAuth
// @Success 200 {object} responses.CustomerResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/customers/{id} [put]
func UpdateCustomer(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := c.Param("id")

	var customer models.Customer
	query := config.DB.Where("id = ?", id)
	
	// If has specific tenant, add tenant filter
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if err := query.First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	var input requests.UpdateCustomerRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customer.Name = input.Name
	customer.Address = input.Address
	customer.Phone = input.Phone
	customer.SubscriptionID = input.SubscriptionID

	if err := config.DB.Save(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui pelanggan"})
		return
	}

	response := responses.CustomerResponse{
		ID:             customer.ID,
		MeterNumber:    customer.MeterNumber,
		Name:           customer.Name,
		Email:          customer.Email,
		Address:        customer.Address,
		Phone:          customer.Phone,
		SubscriptionID: customer.SubscriptionID,
		IsActive:       customer.IsActive,
	}
	c.JSON(http.StatusOK, response)
}

// DeleteCustomer godoc
// @Summary Delete customer
// @Description Delete a customer by ID
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID"
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/customers/{id} [delete]
func DeleteCustomer(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := c.Param("id")

	query := config.DB.Where("id = ?", id)
	
	// If has specific tenant, add tenant filter
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.Delete(&models.Customer{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus pelanggan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pelanggan berhasil dihapus"})
}
