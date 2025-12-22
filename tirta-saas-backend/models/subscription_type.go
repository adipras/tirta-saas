package models

import (
	"github.com/google/uuid"
)

type SubscriptionType struct {
	BaseModel

	Name            string    `gorm:"type:varchar(100);not null" json:"name"`
	Description     string    `gorm:"type:text" json:"description"`
	RegistrationFee float64   `json:"registration_fee"` // Biaya awal
	MonthlyFee      float64   `json:"monthly_fee"`      // Abonemen
	MaintenanceFee  float64   `json:"maintenance_fee"`  // Opsional
	LateFeePerDay   float64   `json:"late_fee_per_day"` // Denda
	MaxLateFee      float64   `json:"max_late_fee"`     // Batas maksimal denda
	TenantID        uuid.UUID `gorm:"type:char(36);index" json:"tenant_id"`
}
