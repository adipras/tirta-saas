package controllers

import (
	"net/http"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/services"
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func mapCustomerResponse(customer models.Customer) responses.CustomerResponse {
	response := responses.CustomerResponse{
		ID:             customer.ID,
		MeterNumber:    customer.MeterNumber,
		Name:           customer.Name,
		Email:          customer.Email,
		Address:        customer.Address,
		Phone:          customer.Phone,
		SubscriptionID: customer.SubscriptionID,
		ServiceAreaID:  customer.ServiceAreaID,
		ReadingRouteID: customer.ReadingRouteID,
		IsActive:       customer.IsActive,
		CreatedAt:      customer.CreatedAt,
	}

	// Populate initial_reading from active meter
	for _, m := range customer.Meters {
		if m.Status == "active" {
			response.InitialReading = m.InitialReading
			break
		}
	}

	if customer.Subscription.ID != uuid.Nil {
		response.Subscription = &responses.SubscriptionTypeResponse{
			ID:              customer.Subscription.ID,
			Name:            customer.Subscription.Name,
			Description:     customer.Subscription.Description,
			RegistrationFee: customer.Subscription.RegistrationFee,
			MonthlyFee:      customer.Subscription.MonthlyFee,
			MaintenanceFee:  customer.Subscription.MaintenanceFee,
			LateFeePerDay:   customer.Subscription.LateFeePerDay,
			MaxLateFee:      customer.Subscription.MaxLateFee,
		}
	}

	if customer.ServiceArea != nil {
		response.ServiceAreaName = customer.ServiceArea.Name
	}
	if customer.ReadingRoute != nil {
		response.ReadingRouteName = customer.ReadingRoute.Name
	}

	return response
}

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

	req.MeterNumber = strings.TrimSpace(req.MeterNumber)
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Phone = strings.TrimSpace(req.Phone)
	req.Address = strings.TrimSpace(req.Address)

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

	var existingCustomer models.Customer
	if err := config.DB.Where("tenant_id = ? AND meter_number = ?", tenantID, req.MeterNumber).First(&existingCustomer).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Nomor meter sudah digunakan"})
		return
	}

	if req.Email != "" {
		if err := config.DB.Where("tenant_id = ? AND email = ?", tenantID, req.Email).First(&existingCustomer).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Email sudah digunakan"})
			return
		}
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
		ServiceAreaID:  req.ServiceAreaID,
		ReadingRouteID: req.ReadingRouteID,
		IsActive:       false,
		TenantID:       tenantID,
	}
	if err := tx.Create(&customer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	// Generate invoice number
	invoiceNumberGen := services.GetInvoiceNumberGenerator()
	invoiceNumber, err := invoiceNumberGen.GenerateInvoiceNumber(tenantID, time.Now())
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate invoice number"})
		return
	}

	// Buat Invoice untuk biaya pendaftaran
	invoice := models.Invoice{
		InvoiceNumber: invoiceNumber,
		CustomerID:    customer.ID,
		UsageMonth:    "", // Kosong karena ini bukan invoice pemakaian
		UsageM3:       0,
		Abonemen:      0,
		PricePerM3:    0,
		TotalAmount:   subType.RegistrationFee,
		IsPaid:        false,
		TotalPaid:     0,
		Type:          "registration",
		TenantID:      tenantID,
	}
	if err := tx.Create(&invoice).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create registration invoice"})
		return
	}

	// Buat Meter aktif untuk pelanggan baru
	meter := models.Meter{
		TenantID:    tenantID,
		CustomerID:  customer.ID,
		MeterNumber: customer.MeterNumber,
		InstallDate: time.Now(),
		Status:      models.MeterStatusActive,
	}
	if err := tx.Create(&meter).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create meter record"})
		return
	}

	// Buat User account untuk pelanggan (role: customer)
	generatedPassword, err := utils.GeneratePassword(10)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate user password"})
		return
	}
	hashedUserPassword, err := utils.HashPassword(generatedPassword)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash user password"})
		return
	}
	username := customer.MeterNumber
	if customer.Email != "" {
		username = customer.Email
	}
	userEmail := customer.Email
	var userEmailPtr *string
	if userEmail != "" {
		userEmailPtr = &userEmail
	}
	customerUser := models.User{
		Name:       customer.Name,
		Username:   username,
		Email:      userEmailPtr,
		Password:   hashedUserPassword,
		Role:       string(constants.RoleCustomer),
		TenantID:   &tenantID,
		CustomerID: &customer.ID,
	}
	if err := tx.Create(&customerUser).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete customer registration"})
		return
	}

	// Respon — sertakan generated_password agar admin bisa menyampaikan ke pelanggan
	response := mapCustomerResponse(customer)
	helpers.RespondCreated(c, "Customer created successfully", gin.H{
		"customer":           response,
		"generated_password": generatedPassword,
	})
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
		helpers.RespondError(c, http.StatusBadRequest, "Invalid tenant context", err)
		return
	}

	var customers []models.Customer
	query := config.DB.Preload("Subscription").Preload("ServiceArea").Preload("ReadingRoute").Preload("Meters")

	// If has specific tenant, filter by it
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	serviceAreaID := c.Query("service_area_id")
	if serviceAreaID != "" {
		parsedID, parseErr := uuid.Parse(serviceAreaID)
		if parseErr != nil {
			helpers.RespondError(c, http.StatusBadRequest, "service_area_id tidak valid", parseErr)
			return
		}
		query = query.Where("service_area_id = ?", parsedID)
	}

	readingRouteID := c.Query("reading_route_id")
	if readingRouteID != "" {
		parsedID, parseErr := uuid.Parse(readingRouteID)
		if parseErr != nil {
			helpers.RespondError(c, http.StatusBadRequest, "reading_route_id tidak valid", parseErr)
			return
		}
		query = query.Where("reading_route_id = ?", parsedID)
	}

	// isActive filter
	if isActiveStr := c.Query("isActive"); isActiveStr != "" {
		query = query.Where("customers.is_active = ?", isActiveStr == "true")
	}

	// subscriptionTypeId filter
	if subTypeID := c.Query("subscriptionTypeId"); subTypeID != "" {
		parsedID, parseErr := uuid.Parse(subTypeID)
		if parseErr == nil {
			query = query.Where("customers.subscription_id = ?", parsedID)
		}
	}

	// search filter — match name, email, phone, or meter_number
	if search := c.Query("search"); search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"LOWER(customers.name) LIKE ? OR LOWER(customers.email) LIKE ? OR customers.phone LIKE ? OR customers.meter_number LIKE ?",
			like, like, like, like,
		)
	}

	// hasOutstandingBalance filter
	if habStr := c.Query("hasOutstandingBalance"); habStr != "" {
		outstandingStatuses := []string{"UNPAID", "OVERDUE", "PARTIAL"}
		subquery := "EXISTS (SELECT 1 FROM invoices WHERE invoices.customer_id = customers.id AND invoices.payment_status IN ? AND invoices.deleted_at IS NULL)"
		if habStr == "true" {
			query = query.Where(subquery, outstandingStatuses)
		} else {
			query = query.Where("NOT "+subquery, outstandingStatuses)
		}
	}

	if err := query.Find(&customers).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch customers", err)
		return
	}

	// Convert to response format
	customerResponses := make([]responses.CustomerResponse, len(customers))
	for i, customer := range customers {
		customerResponses[i] = mapCustomerResponse(customer)
	}

	response := responses.CustomerListResponse{
		Customers: customerResponses,
		Total:     len(customerResponses),
	}
	helpers.RespondSuccess(c, "Customers retrieved successfully", response)
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
	query := config.DB.Preload("Subscription").Preload("ServiceArea").Preload("ReadingRoute").Preload("Meters").Where("id = ?", id)

	// If has specific tenant, add tenant filter
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, mapCustomerResponse(customer))
}

// ActivateCustomer godoc
// @Summary Activate customer
// @Description Activate a customer account
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID"
// @Security BearerAuth
// @Success 200 {object} responses.CustomerResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/customers/{id}/activate [post]
func ActivateCustomer(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := c.Param("id")

	var customer models.Customer
	query := config.DB.Preload("Subscription").Preload("ServiceArea").Preload("ReadingRoute").Preload("Meters").Where("id = ?", id)

	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Update is_active to true
	if err := config.DB.Model(&customer).Update("is_active", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate customer"})
		return
	}
	customer.IsActive = true

	c.JSON(http.StatusOK, mapCustomerResponse(customer))
}

// DeactivateCustomer godoc
// @Summary Deactivate customer
// @Description Deactivate a customer account
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID"
// @Security BearerAuth
// @Success 200 {object} responses.CustomerResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/customers/{id}/deactivate [post]
func DeactivateCustomer(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id := c.Param("id")

	var customer models.Customer
	query := config.DB.Preload("Subscription").Preload("ServiceArea").Preload("ReadingRoute").Preload("Meters").Where("id = ?", id)

	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Update is_active to false
	if err := config.DB.Model(&customer).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate customer"})
		return
	}
	customer.IsActive = false

	c.JSON(http.StatusOK, mapCustomerResponse(customer))
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
	customer.ServiceAreaID = input.ServiceAreaID
	customer.ReadingRouteID = input.ReadingRouteID

	if err := config.DB.Model(&customer).Select("Name", "Address", "Phone", "SubscriptionID", "ServiceAreaID", "ReadingRouteID").Updates(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui pelanggan"})
		return
	}

	c.JSON(http.StatusOK, mapCustomerResponse(customer))
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

// ActivateCustomer godoc
// @Summary Activate customer
// @Description Activate a customer account
// @Tags Customers
// @Accept json
// @Produce json
// @Param id path string true "Customer ID"
// @Security BearerAuth
// @Success 200 {object} responses.CustomerResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/customers/{id}/activate [post]

// ResetCustomerPassword generates a new password for the customer's linked user account.
// Only accessible by tenant_admin. Returns the new plaintext password once.
// POST /api/customers/:id/reset-password
func ResetCustomerPassword(c *gin.Context) {
tenantID, err := helpers.RequireTenantID(c)
if err != nil {
c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
return
}

customerID, err := uuid.Parse(c.Param("id"))
if err != nil {
c.JSON(http.StatusBadRequest, gin.H{"error": "ID pelanggan tidak valid"})
return
}

// Pastikan customer milik tenant ini
var customer models.Customer
if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).First(&customer).Error; err != nil {
c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
return
}

// Cari User yang terhubung ke customer ini
var user models.User
if err := config.DB.Where("customer_id = ? AND tenant_id = ?", customerID, tenantID).First(&user).Error; err != nil {
c.JSON(http.StatusNotFound, gin.H{"error": "User account untuk pelanggan ini tidak ditemukan"})
return
}

newPassword, err := utils.GeneratePassword(10)
if err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate password"})
return
}
hashedPassword, err := utils.HashPassword(newPassword)
if err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hash password"})
return
}

if err := config.DB.Model(&user).Update("password", hashedPassword).Error; err != nil {
c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan password baru"})
return
}

c.JSON(http.StatusOK, gin.H{
"message":      "Password berhasil direset",
"new_password": newPassword,
})
}
