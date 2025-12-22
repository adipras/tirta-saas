package responses

import (
	"time"
	"github.com/google/uuid"
)

type WaterUsageResponse struct {
	ID               uuid.UUID `json:"id"`
	CustomerID       uuid.UUID `json:"customer_id"`
	UsageMonth       string    `json:"usage_month"`
	MeterStart       float64   `json:"meter_start"`
	MeterEnd         float64   `json:"meter_end"`
	UsageM3          float64   `json:"usage_m3"`
	AmountCalculated float64   `json:"amount_calculated"`
	CreatedAt        time.Time `json:"created_at"`
}

type WaterUsageListResponse struct {
	UsageRecords []WaterUsageResponse `json:"usage_records"`
	Total        int                  `json:"total"`
}