package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SetInitialReading sets the initial_reading on the active meter of a specific customer.
// PATCH /api/customers/:id/initial-reading
func SetInitialReading(c *gin.Context) {
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

	var req struct {
		InitialReading float64 `json:"initial_reading" binding:"gte=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	var meter models.Meter
	err = config.DB.Where("customer_id = ? AND status = 'active'", customerID).First(&meter).Error
	if err != nil {
		meter = models.Meter{
			TenantID:    tenantID,
			CustomerID:  customerID,
			MeterNumber: customer.MeterNumber,
			InstallDate: time.Now(),
			Status:      models.MeterStatusActive,
		}
		if err := config.DB.Create(&meter).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal membuat meter: %v", err)})
			return
		}
	}

	if err := config.DB.Model(&meter).Update("initial_reading", req.InitialReading).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan initial reading"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Initial reading berhasil disimpan",
		"meter_number":    meter.MeterNumber,
		"initial_reading": req.InitialReading,
	})
}

// GetCustomerMeters returns all meters belonging to a customer.
// GET /api/customers/:id/meters
func GetCustomerMeters(c *gin.Context) {
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

	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	var meters []models.Meter
	if err := config.DB.
		Where("customer_id = ? AND tenant_id = ?", customerID, tenantID).
		Preload("SubscriptionType").
		Order("created_at ASC").
		Find(&meters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat data meter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": meters, "message": "Data meter berhasil dimuat"})
}

// AddCustomerMeter adds a new meter (subscription) for a customer.
// POST /api/customers/:id/meters
func AddCustomerMeter(c *gin.Context) {
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

	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	var req struct {
		MeterNumber        string  `json:"meter_number" binding:"required"`
		SubscriptionTypeID string  `json:"subscription_type_id" binding:"required"`
		Brand              string  `json:"brand"`
		Model              string  `json:"model"`
		InstallDate        string  `json:"install_date"`
		InitialReading     float64 `json:"initial_reading"`
		Notes              string  `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subscriptionTypeID, err := uuid.Parse(req.SubscriptionTypeID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "subscription_type_id tidak valid"})
		return
	}

	installDate := time.Now()
	if req.InstallDate != "" {
		if parsed, err := time.Parse("2006-01-02", req.InstallDate); err == nil {
			installDate = parsed
		}
	}

	meter := models.Meter{
		TenantID:           tenantID,
		CustomerID:         customerID,
		MeterNumber:        req.MeterNumber,
		SubscriptionTypeID: &subscriptionTypeID,
		Brand:              req.Brand,
		Model:              req.Model,
		InstallDate:        installDate,
		InitialReading:     req.InitialReading,
		Status:             models.MeterStatusActive,
		Notes:              req.Notes,
	}

	if err := config.DB.Create(&meter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal menambahkan meter: %v", err)})
		return
	}

	config.DB.Preload("SubscriptionType").First(&meter, meter.ID)
	c.JSON(http.StatusCreated, gin.H{"data": meter, "message": "Meter berhasil ditambahkan"})
}

// UpdateCustomerMeter updates meter data.
// PATCH /api/customers/:id/meters/:mid
func UpdateCustomerMeter(c *gin.Context) {
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

	meterID, err := uuid.Parse(c.Param("mid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID meter tidak valid"})
		return
	}

	var meter models.Meter
	if err := config.DB.Where("id = ? AND customer_id = ? AND tenant_id = ?", meterID, customerID, tenantID).First(&meter).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meter tidak ditemukan"})
		return
	}

	var req struct {
		MeterNumber        *string `json:"meter_number"`
		SubscriptionTypeID *string `json:"subscription_type_id"`
		Brand              *string `json:"brand"`
		Model              *string `json:"model"`
		InstallDate        *string `json:"install_date"`
		Status             *string `json:"status"`
		Notes              *string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.MeterNumber != nil {
		updates["meter_number"] = *req.MeterNumber
	}
	if req.SubscriptionTypeID != nil {
		subID, err := uuid.Parse(*req.SubscriptionTypeID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "subscription_type_id tidak valid"})
			return
		}
		updates["subscription_type_id"] = subID
	}
	if req.Brand != nil {
		updates["brand"] = *req.Brand
	}
	if req.Model != nil {
		updates["model"] = *req.Model
	}
	if req.InstallDate != nil {
		if parsed, err := time.Parse("2006-01-02", *req.InstallDate); err == nil {
			updates["install_date"] = parsed
		}
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	if err := config.DB.Model(&meter).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui meter"})
		return
	}

	config.DB.Preload("SubscriptionType").First(&meter, meter.ID)
	c.JSON(http.StatusOK, gin.H{"data": meter, "message": "Meter berhasil diperbarui"})
}

// DeleteCustomerMeter removes a meter (only if no usage data is linked).
// DELETE /api/customers/:id/meters/:mid
func DeleteCustomerMeter(c *gin.Context) {
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

	meterID, err := uuid.Parse(c.Param("mid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID meter tidak valid"})
		return
	}

	var meter models.Meter
	if err := config.DB.Where("id = ? AND customer_id = ? AND tenant_id = ?", meterID, customerID, tenantID).First(&meter).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meter tidak ditemukan"})
		return
	}

	var usageCount int64
	config.DB.Model(&models.WaterUsage{}).Where("meter_id = ?", meterID).Count(&usageCount)
	if usageCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Meter tidak dapat dihapus karena masih memiliki data pemakaian. Nonaktifkan meter terlebih dahulu."})
		return
	}

	if err := config.DB.Delete(&meter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus meter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Meter berhasil dihapus"})
}

// SetMeterInitialReading sets the initial reading for a specific meter.
// PATCH /api/customers/:id/meters/:mid/initial-reading
func SetMeterInitialReading(c *gin.Context) {
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

	meterID, err := uuid.Parse(c.Param("mid"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID meter tidak valid"})
		return
	}

	var req struct {
		InitialReading float64 `json:"initial_reading" binding:"gte=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var meter models.Meter
	if err := config.DB.Where("id = ? AND customer_id = ? AND tenant_id = ?", meterID, customerID, tenantID).First(&meter).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meter tidak ditemukan"})
		return
	}

	if err := config.DB.Model(&meter).Update("initial_reading", req.InitialReading).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan initial reading"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Initial reading berhasil disimpan",
		"meter_number":    meter.MeterNumber,
		"initial_reading": req.InitialReading,
	})
}
