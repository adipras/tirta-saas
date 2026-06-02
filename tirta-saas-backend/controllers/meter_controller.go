package controllers

import (
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ResolveMeterStart resolves the meter_start value and its source for a given meter and month.
// Used by frontend and mobile before inputting meter_end so the user can see the starting value.
func ResolveMeterStart(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	meterIDStr := c.Param("id")
	meterID, err := uuid.Parse(meterIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID meter tidak valid"})
		return
	}

	month := c.Query("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}
	if _, err := time.Parse("2006-01", month); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan YYYY-MM"})
		return
	}

	// Verify meter belongs to this tenant
	var meterTenantID uuid.UUID
	row := config.DB.Raw("SELECT tenant_id FROM meters WHERE id = ? AND deleted_at IS NULL", meterID).Row()
	if err := row.Scan(&meterTenantID); err != nil || meterTenantID != tenantID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meter tidak ditemukan"})
		return
	}

	value, source, err := services.ResolveWaterUsageMeterStart(config.DB, meterID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Compute previous month for description
	parsed, _ := time.Parse("2006-01", month)
	prevMonth := parsed.AddDate(0, -1, 0).Format("2006-01")
	description := services.MeterStartSourceDescription(source, prevMonth)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"value":       value,
			"source":      source,
			"description": description,
			"month":       month,
		},
	})
}

// GetCustomerMeters returns all active meters for a customer.
// Used by frontend/mobile to populate the meter dropdown in water usage input.
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

	var meters []struct {
		ID                 uuid.UUID  `json:"id"`
		MeterNumber        string     `json:"meter_number"`
		Status             string     `json:"status"`
		SubscriptionTypeID *uuid.UUID `json:"subscription_type_id"`
		SubscriptionName   string     `json:"subscription_type_name"`
		InstallDate        string     `json:"install_date"`
		InitialReading     float64    `json:"initial_reading"`
	}

	if err := config.DB.Raw(`
		SELECT m.id, m.meter_number, m.status, m.subscription_type_id,
		       COALESCE(st.name, '') as subscription_name,
		       DATE_FORMAT(m.install_date, '%Y-%m-%d') as install_date,
		       m.initial_reading
		FROM meters m
		LEFT JOIN subscription_types st ON m.subscription_type_id = st.id
		WHERE m.customer_id = ? AND m.tenant_id = ? AND m.deleted_at IS NULL
		ORDER BY m.created_at ASC
	`, customerID, tenantID).Scan(&meters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data meter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    meters,
	})
}
