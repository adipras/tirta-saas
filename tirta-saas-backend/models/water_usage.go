package models

import (
	"github.com/google/uuid"
)

type WaterUsage struct {
	CustomerID       uuid.UUID `gorm:"type:char(36);not null;index" json:"customer_id"`
	Customer         Customer  `gorm:"foreignKey:CustomerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"customer"`
	UsageMonth       string    `gorm:"type:varchar(7);not null;index" json:"usage_month"` // e.g. 2025-06
	MeterStart       float64   `json:"meter_start"`
	MeterEnd         float64   `json:"meter_end"`
	UsageM3          float64   `json:"usage_m3"`
	AmountCalculated float64   `json:"amount_calculated"` // hasil UsageM3 * tarif
	TenantID         uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`
	
	// Additional fields for Phase 6
	MeterID           *uuid.UUID        `gorm:"type:char(36);index" json:"meter_id"`
	Meter             *Meter            `gorm:"foreignKey:MeterID" json:"meter,omitempty"`
	ReadingSessionID  *uuid.UUID        `gorm:"type:char(36);index" json:"reading_session_id"`
	ReadingSession    *ReadingSession   `gorm:"foreignKey:ReadingSessionID" json:"reading_session,omitempty"`
	RecordedBy        *uuid.UUID        `gorm:"type:char(36)" json:"recorded_by"`
	Recorder          *User             `gorm:"foreignKey:RecordedBy" json:"recorder,omitempty"`
	PhotoURL          string            `gorm:"type:varchar(500)" json:"photo_url"`
	ReadingMethod     string            `gorm:"type:varchar(20);default:'manual'" json:"reading_method"` // manual, automatic, estimated
	Notes             string            `gorm:"type:text" json:"notes"`
	IsAnomaly         bool              `gorm:"default:false" json:"is_anomaly"`
	AnomalyDetails    *ReadingAnomaly   `gorm:"foreignKey:WaterUsageID" json:"anomaly_details,omitempty"`

	BaseModel
}

// TableName overrides the table name for GORM
func (WaterUsage) TableName() string {
	return "water_usages"
}
