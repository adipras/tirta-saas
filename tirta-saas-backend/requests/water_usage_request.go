package requests

import (
	"github.com/google/uuid"
)

type CreateWaterUsageRequest struct {
	// Optional client-generated ID to enable idempotent sync
	ID         *uuid.UUID  `json:"id,omitempty" format:"uuid" doc:"Optional client-generated UUID for idempotent create"`
	CustomerID  uuid.UUID  `json:"customer_id" binding:"required" format:"uuid" doc:"Customer ID" example:"123e4567-e89b-12d3-a456-426614174000"`
	MeterID    *uuid.UUID  `json:"meter_id,omitempty" format:"uuid" doc:"Meter ID (optional, required for multi-meter customers)"`
	UsageMonth  string     `json:"usage_month" binding:"required,len=7" pattern:"^[0-9]{4}-[0-9]{2}$" doc:"Usage month in YYYY-MM format" example:"2025-01"`
	MeterEnd    float64    `json:"meter_end" binding:"required,gte=0" minimum:"0" doc:"Meter end reading in m³" example:"150.5"`
	Notes       string     `json:"notes,omitempty" maxLength:"500" doc:"Additional notes for this reading" example:"Normal monthly reading"`
	IsDraft     bool       `json:"is_draft,omitempty" doc:"If true, record saved as draft and won't affect billing until finalized"`
}

type UpdateWaterUsageRequest struct {
	MeterEnd float64 `json:"meter_end" binding:"required,gte=0" minimum:"0" doc:"Meter end reading in m³" example:"155.0"`
	Notes    string  `json:"notes,omitempty" maxLength:"500" doc:"Additional notes" example:"Corrected reading"`
}
