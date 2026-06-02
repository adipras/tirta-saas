package requests

import (
	"github.com/google/uuid"
)

type CreateWaterUsageRequest struct {
	// Optional client-generated ID to enable idempotent sync
	ID         *uuid.UUID `json:"id,omitempty" format:"uuid" doc:"Optional client-generated UUID for idempotent create"`
	CustomerID uuid.UUID  `json:"customer_id" binding:"required" format:"uuid" doc:"Customer ID"`
	MeterID    *uuid.UUID `json:"meter_id,omitempty" format:"uuid" doc:"Meter ID — required for accurate meter_start resolution"`
	UsageMonth string     `json:"usage_month" binding:"required,len=7" doc:"Usage month in YYYY-MM format" example:"2025-01"`
	MeterEnd   float64    `json:"meter_end" binding:"required,gte=0" doc:"Meter end reading in m³" example:"150.5"`
	Notes      string     `json:"notes,omitempty" doc:"Additional notes for this reading"`
	IsDraft    bool       `json:"is_draft,omitempty" doc:"If true, record saved as draft"`
}

type UpdateWaterUsageRequest struct {
	MeterEnd float64 `json:"meter_end" binding:"required,gte=0" minimum:"0" doc:"Meter end reading in m³" example:"155.0"`
	Notes    string  `json:"notes,omitempty" maxLength:"500" doc:"Additional notes" example:"Corrected reading"`
}
