package services

import (
	"fmt"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	MeterStartSourcePreviousReading = "previous_reading"
	MeterStartSourceInitialReading  = "initial_reading"
	MeterStartSourceDefault         = "default"
)

// ResolveWaterUsageMeterStart determines the correct meter_start value for a given meter and usage month.
// Priority: (1) meter_end from previous month, (2) meter's initial_reading, (3) 0 (default).
func ResolveWaterUsageMeterStart(db *gorm.DB, meterID uuid.UUID, usageMonth string) (value float64, source string, err error) {
	// Compute previous month
	parsed, err := time.Parse("2006-01", usageMonth)
	if err != nil {
		return 0, MeterStartSourceDefault, fmt.Errorf("format bulan tidak valid: %w", err)
	}
	prevMonth := parsed.AddDate(0, -1, 0).Format("2006-01")

	// Priority 1: meter_end from previous month's reading
	var prevUsage models.WaterUsage
	err = db.Select("meter_end").
		Where("meter_id = ? AND usage_month = ? AND meter_end IS NOT NULL AND deleted_at IS NULL", meterID, prevMonth).
		First(&prevUsage).Error
	if err == nil {
		return prevUsage.MeterEnd, MeterStartSourcePreviousReading, nil
	}

	// Priority 2: initial_reading from the meter itself
	var meter models.Meter
	err = db.Select("initial_reading").
		Where("id = ? AND deleted_at IS NULL", meterID).
		First(&meter).Error
	if err == nil && meter.InitialReading > 0 {
		return meter.InitialReading, MeterStartSourceInitialReading, nil
	}

	// Priority 3: default
	return 0, MeterStartSourceDefault, nil
}

// MeterStartSourceDescription returns a human-readable description for a meter_start_source value.
func MeterStartSourceDescription(source string, prevMonth string) string {
	switch source {
	case MeterStartSourcePreviousReading:
		return fmt.Sprintf("Dari bacaan bulan lalu (%s)", prevMonth)
	case MeterStartSourceInitialReading:
		return "Dari angka awal meter"
	default:
		return "Default: 0.00"
	}
}
