package responses

import (
	"time"
	"github.com/google/uuid"
)

type InvoiceResponse struct {
	ID            uuid.UUID        `json:"id"`
	InvoiceNumber string           `json:"invoice_number"`
	CustomerID    uuid.UUID        `json:"customer_id"`
	CustomerName  string           `json:"customer_name"`
	Customer      *CustomerSummary `json:"customer,omitempty"`
	UsageMonth    string           `json:"usage_month"`
	UsageM3       float64          `json:"usage_m3"`
	Abonemen      float64          `json:"abonemen"`
	PricePerM3    float64          `json:"price_per_m3"`
	TotalAmount   float64          `json:"total_amount"`
	TotalPaid     float64          `json:"total_paid"`
	IsPaid        bool             `json:"is_paid"`
	Type          string           `json:"type"`
	DueDate       *time.Time       `json:"due_date,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
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