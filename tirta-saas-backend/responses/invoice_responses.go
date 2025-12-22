package responses

import (
	"time"
	"github.com/google/uuid"
)

type InvoiceResponse struct {
	ID          uuid.UUID `json:"id"`
	CustomerID  uuid.UUID `json:"customer_id"`
	UsageMonth  string    `json:"usage_month"`
	UsageM3     float64   `json:"usage_m3"`
	Abonemen    float64   `json:"abonemen"`
	PricePerM3  float64   `json:"price_per_m3"`
	TotalAmount float64   `json:"total_amount"`
	TotalPaid   float64   `json:"total_paid"`
	IsPaid      bool      `json:"is_paid"`
	Type        string    `json:"type"`
	CreatedAt   time.Time `json:"created_at"`
}

type InvoiceListResponse struct {
	Invoices []InvoiceResponse `json:"invoices"`
	Total    int               `json:"total"`
}