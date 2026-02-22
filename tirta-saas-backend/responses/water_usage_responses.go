package responses

import (
	"time"
	"github.com/google/uuid"
)

type WaterUsageCustomer struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	MeterNumber string    `json:"meter_number"`
	Address     string    `json:"address"`
}

type WaterUsageResponse struct {
	ID               uuid.UUID           `json:"id"`
	CustomerID       uuid.UUID           `json:"customer_id"`
	Customer         *WaterUsageCustomer `json:"customer,omitempty"`
	UsageMonth       string              `json:"usage_month"`
	MeterStart       float64             `json:"meter_start"`
	MeterEnd         float64             `json:"meter_end"`
	UsageM3          float64             `json:"usage_m3"`
	AmountCalculated float64             `json:"amount_calculated"`
	CreatedAt        time.Time           `json:"created_at"`
}

type WaterUsageListResponse struct {
	UsageRecords []WaterUsageResponse `json:"usage_records"`
	Total        int                  `json:"total"`
}