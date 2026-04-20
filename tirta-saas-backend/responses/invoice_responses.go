package responses

import (
	"github.com/google/uuid"
	"time"
)

type InvoiceResponse struct {
	ID                  uuid.UUID        `json:"id"`
	InvoiceNumber       string           `json:"invoice_number"`
	CustomerID          uuid.UUID        `json:"customer_id"`
	CustomerName        string           `json:"customer_name"`
	Customer            *CustomerSummary `json:"customer,omitempty"`
	UsageMonth          string           `json:"usage_month"`
	UsageM3             float64          `json:"usage_m3"`
	WaterCharge         float64          `json:"water_charge"`
	Abonemen            float64          `json:"abonemen"`
	PricePerM3          float64          `json:"price_per_m3"`
	SubTotal            float64          `json:"sub_total"`
	PenaltyAmount       float64          `json:"penalty_amount"`
	TotalAmount         float64          `json:"total_amount"`
	TotalPaid           float64          `json:"total_paid"`
	RemainingAmount     float64          `json:"remaining_amount"`
	StoredPenaltyAmount float64          `json:"stored_penalty_amount"`
	StoredTotalAmount   float64          `json:"stored_total_amount"`
	PenaltyDays         int              `json:"penalty_days"`
	IsPaid              bool             `json:"is_paid"`
	PaymentStatus       string           `json:"payment_status"`
	Type                string           `json:"type"`
	DueDate             *time.Time       `json:"due_date,omitempty"`
	PaidDate            *time.Time       `json:"paid_date,omitempty"`
	CreatedAt           time.Time        `json:"created_at"`
}

type CustomerSummary struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	MeterNumber string    `json:"meter_number"`
	Email       string    `json:"email"`
}

type InvoiceListResponse struct {
	Invoices []InvoiceResponse `json:"invoices"`
	Total    int               `json:"total"`
}
