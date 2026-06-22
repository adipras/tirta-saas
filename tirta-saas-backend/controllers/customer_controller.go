package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
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
// @Description Create a new customer with one or more meters. Each meter gets a registration invoice.
// @Tags Customers
// @Accept json
// @Produce json
// @Param request body requests.CreateCustomerRequest true "Create customer request"
// @Security BearerAuth
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 422 {object} map[string]interface{}
// @Router /api/customers [post]
func CreateCustomer(c *gin.Context) {
	var req requests.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "message": err.Error()})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Phone = strings.TrimSpace(req.Phone)
	req.Address = strings.TrimSpace(req.Address)

	if len(req.Meters) == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "message": "Minimal 1 data meter harus diisi"})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate subscription types and meter numbers up front (outside transaction for clarity)
	subTypes := make(map[string]models.SubscriptionType)
	for i, m := range req.Meters {
		m.MeterNumber = strings.TrimSpace(m.MeterNumber)
		req.Meters[i].MeterNumber = m.MeterNumber

		var subType models.SubscriptionType
		if err := config.DB.Where("id = ? AND tenant_id = ?", m.SubscriptionTypeID, tenantID).First(&subType).Error; err != nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"success": false,
				"message": "Jenis langganan tidak ditemukan",
				"errors":  gin.H{fmt.Sprintf("meters.%d.subscription_type_id", i): []string{"Jenis langganan tidak ditemukan"}},
			})
			return
		}
		subTypes[m.SubscriptionTypeID.String()] = subType

		var existingMeter models.Meter
		if err := config.DB.Where("tenant_id = ? AND meter_number = ? AND deleted_at IS NULL", tenantID, m.MeterNumber).First(&existingMeter).Error; err == nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"success": false,
				"message": fmt.Sprintf("Nomor meter %s sudah digunakan", m.MeterNumber),
				"errors":  gin.H{fmt.Sprintf("meters.%d.meter_number", i): []string{fmt.Sprintf("Nomor meter %s sudah digunakan", m.MeterNumber)}},
			})
			return
		}
	}

	if req.Email != "" {
		var existingCustomer models.Customer
		if err := config.DB.Where("tenant_id = ? AND email = ?", tenantID, req.Email).First(&existingCustomer).Error; err == nil {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "message": "Email sudah digunakan"})
			return
		}
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
		return
	}

	tx := config.DB.Begin()

	firstSubType := subTypes[req.Meters[0].SubscriptionTypeID.String()]
	customer := models.Customer{
		Name:           req.Name,
		Email:          req.Email,
		Password:       hashedPassword,
		Phone:          req.Phone,
		Address:        req.Address,
		SubscriptionID: req.Meters[0].SubscriptionTypeID, // backward compat
		ServiceAreaID:  req.ServiceAreaID,
		ReadingRouteID: req.ReadingRouteID,
		IsActive:       false,
		TenantID:       tenantID,
	}
	_ = firstSubType // referenced via SubscriptionID above
	if err := tx.Create(&customer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan data, semua perubahan dibatalkan"})
		return
	}

	var createdMeters []models.Meter
	var createdInvoices []models.Invoice

	for _, m := range req.Meters {
		installDate, err := time.Parse("2006-01-02", m.InstallDate)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "message": "Format tanggal pasang tidak valid. Gunakan YYYY-MM-DD"})
			return
		}

		subTypeID := m.SubscriptionTypeID
		meter := models.Meter{
			TenantID:           tenantID,
			CustomerID:         customer.ID,
			MeterNumber:        m.MeterNumber,
			SubscriptionTypeID: &subTypeID,
			InstallDate:        installDate,
			InitialReading:     m.InitialReading,
			LocationName:       m.LocationName,
			Brand:              m.Brand,
			Model:              m.Model,
			Notes:              m.Notes,
			Status:             models.MeterStatusActive,
		}
		if err := tx.Create(&meter).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan data, semua perubahan dibatalkan"})
			return
		}
		createdMeters = append(createdMeters, meter)

		invoice, err := services.GenerateRegistrationInvoice(tx, tenantID, customer.ID, meter.ID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal membuat invoice registrasi: " + err.Error()})
			return
		}
		createdInvoices = append(createdInvoices, *invoice)
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan data, semua perubahan dibatalkan"})
		return
	}

	helpers.RespondCreated(c, "Pelanggan berhasil ditambahkan", gin.H{
		"customer":               mapCustomerResponse(customer),
		"meters":                 createdMeters,
		"registration_invoices":  createdInvoices,
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
	query := config.DB.Preload("Subscription").Preload("ServiceArea").Preload("ReadingRoute")

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
	// If no specific tenant (platform owner without filter), return all

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
	query := config.DB.
		Preload("Subscription").
		Preload("ServiceArea").
		Preload("ReadingRoute").
		Preload("Meters", "deleted_at IS NULL").
		Preload("Meters.SubscriptionType").
		Where("id = ?", id)

	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Attach latest reading to each meter
	type meterWithLatestReading struct {
		models.Meter
		LatestUsageMonth string  `json:"latest_usage_month,omitempty"`
		LatestMeterEnd   float64 `json:"latest_meter_end,omitempty"`
		LatestUsageM3    float64 `json:"latest_usage_m3,omitempty"`
	}
	metersWithReadings := make([]meterWithLatestReading, 0, len(customer.Meters))
	for _, meter := range customer.Meters {
		mr := meterWithLatestReading{Meter: meter}
		var lastUsage models.WaterUsage
		if err := config.DB.Select("usage_month, meter_end, usage_m3").
			Where("meter_id = ? AND deleted_at IS NULL", meter.ID).
			Order("usage_month DESC").Limit(1).First(&lastUsage).Error; err == nil {
			mr.LatestUsageMonth = lastUsage.UsageMonth
			mr.LatestMeterEnd = lastUsage.MeterEnd
			mr.LatestUsageM3 = lastUsage.UsageM3
		}
		metersWithReadings = append(metersWithReadings, mr)
	}

	c.JSON(http.StatusOK, gin.H{
		"customer": mapCustomerResponse(customer),
		"meters":   metersWithReadings,
	})
}

// AddMeterToCustomer adds a new meter to an existing customer and generates a registration invoice.
func AddMeterToCustomer(c *gin.Context) {
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

	var req requests.AddMeterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "message": err.Error()})
		return
	}
	req.MeterNumber = strings.TrimSpace(req.MeterNumber)

	// Validate customer exists in this tenant
	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	// Validate meter_number unique per tenant
	var existingMeter models.Meter
	if err := config.DB.Where("tenant_id = ? AND meter_number = ? AND deleted_at IS NULL", tenantID, req.MeterNumber).First(&existingMeter).Error; err == nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"success": false,
			"message": fmt.Sprintf("Nomor meter %s sudah digunakan", req.MeterNumber),
		})
		return
	}

	// Validate subscription type
	var subType models.SubscriptionType
	if err := config.DB.Where("id = ? AND tenant_id = ?", req.SubscriptionTypeID, tenantID).First(&subType).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "message": "Jenis langganan tidak ditemukan"})
		return
	}

	installDate, err := time.Parse("2006-01-02", req.InstallDate)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "message": "Format tanggal pasang tidak valid. Gunakan YYYY-MM-DD"})
		return
	}

	tx := config.DB.Begin()

	subTypeID := req.SubscriptionTypeID
	meter := models.Meter{
		TenantID:           tenantID,
		CustomerID:         customerID,
		MeterNumber:        req.MeterNumber,
		SubscriptionTypeID: &subTypeID,
		InstallDate:        installDate,
		InitialReading:     req.InitialReading,
		LocationName:       req.LocationName,
		Brand:              req.Brand,
		Model:              req.Model,
		Notes:              req.Notes,
		Status:             models.MeterStatusActive,
	}
	if err := tx.Create(&meter).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan data, semua perubahan dibatalkan"})
		return
	}

	invoice, err := services.GenerateRegistrationInvoice(tx, tenantID, customerID, meter.ID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal membuat invoice registrasi: " + err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan data, semua perubahan dibatalkan"})
		return
	}

	helpers.RespondCreated(c, "Meter berhasil ditambahkan. Invoice registrasi telah dibuat.", gin.H{
		"meter":                meter,
		"registration_invoice": invoice,
	})
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
	query := config.DB.Preload("Subscription").Preload("ServiceArea").Preload("ReadingRoute").Where("id = ?", id)

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
	query := config.DB.Preload("Subscription").Preload("ServiceArea").Preload("ReadingRoute").Where("id = ?", id)

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
	customer.ServiceAreaID = input.ServiceAreaID
	customer.ReadingRouteID = input.ReadingRouteID

	if err := config.DB.Model(&customer).Select("Name", "Address", "Phone", "ServiceAreaID", "ReadingRouteID").Updates(&customer).Error; err != nil {
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
