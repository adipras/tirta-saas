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
// Body: { "initial_reading": 1250.5 }
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

	// Pastikan customer milik tenant ini
	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	// Cari meter aktif; jika belum ada, buat baru (upsert)
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
