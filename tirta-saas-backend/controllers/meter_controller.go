package controllers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/gin-gonic/gin"
)

// BulkSetInitialReading sets initial_reading on meters by meter_number (batch).
// Digunakan untuk mengisi nilai meter awal saat pertama kali import data (misal: nilai akhir Desember 2025).
//
// POST /api/customers/bulk-set-initial-reading
// Body: { "records": [{ "meter_number": "MTR-001", "initial_reading": 1250.5 }] }
func BulkSetInitialReading(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var req struct {
		Records []struct {
			MeterNumber    string  `json:"meter_number" binding:"required"`
			InitialReading float64 `json:"initial_reading" binding:"gte=0"`
		} `json:"records" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	type rowResult struct {
		Row         int    `json:"row"`
		MeterNumber string `json:"meter_number"`
		Error       string `json:"error,omitempty"`
	}

	var successCount, failedCount int
	var errs []rowResult
	startTime := time.Now()

	for i, rec := range req.Records {
		rowNum := i + 1

		// Lookup meter by meter_number scoped to tenant (via customer)
		var meter models.Meter
		err := config.DB.
			Joins("JOIN customers ON customers.id = meters.customer_id").
			Where("customers.meter_number = ? AND customers.tenant_id = ?", rec.MeterNumber, tenantID).
			Where("meters.status = 'active'").
			First(&meter).Error

		if err != nil {
			// Fallback: try by meter.meter_number directly
			err2 := config.DB.
				Where("meter_number = ? AND tenant_id = ?", rec.MeterNumber, tenantID).
				Where("status = 'active'").
				First(&meter).Error
			if err2 != nil {
				// Upsert: cari customer lalu buat meter baru jika belum ada
				var customer models.Customer
				err3 := config.DB.
					Where("meter_number = ? AND tenant_id = ?", rec.MeterNumber, tenantID).
					First(&customer).Error
				if err3 != nil {
					errs = append(errs, rowResult{Row: rowNum, MeterNumber: rec.MeterNumber, Error: "Pelanggan dengan nomor meter tersebut tidak ditemukan"})
					failedCount++
					continue
				}
				meter = models.Meter{
					TenantID:       tenantID,
					CustomerID:     customer.ID,
					MeterNumber:    rec.MeterNumber,
					InstallDate:    time.Now(),
					Status:         models.MeterStatusActive,
					InitialReading: rec.InitialReading,
				}
				if err4 := config.DB.Create(&meter).Error; err4 != nil {
					errs = append(errs, rowResult{Row: rowNum, MeterNumber: rec.MeterNumber, Error: fmt.Sprintf("Gagal membuat meter: %v", err4)})
					failedCount++
					continue
				}
				successCount++
				continue
			}
		}

		if err := config.DB.Model(&meter).Update("initial_reading", rec.InitialReading).Error; err != nil {
			errs = append(errs, rowResult{Row: rowNum, MeterNumber: rec.MeterNumber, Error: fmt.Sprintf("Gagal menyimpan: %v", err)})
			failedCount++
			continue
		}
		successCount++
	}

	duration := time.Since(startTime)

	c.JSON(http.StatusOK, gin.H{
		"success":     successCount,
		"failed":      failedCount,
		"total":       len(req.Records),
		"errors":      errs,
		"duration_ms": duration.Milliseconds(),
	})
}
