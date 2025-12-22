package responses

import (
	"time"

	"github.com/google/uuid"
)

// BulkInvoiceGenerationResponse represents bulk invoice generation result
type BulkInvoiceGenerationResponse struct {
	Status       string                    `json:"status"`
	Message      string                    `json:"message"`
	Success      int                       `json:"success"`
	Skipped      int                       `json:"skipped"`
	Failed       int                       `json:"failed"`
	TotalAmount  float64                   `json:"total_amount"`
	Invoices     []InvoicePreviewItem      `json:"invoices,omitempty"`
	Errors       []string                  `json:"errors,omitempty"`
	PreviewOnly  bool                      `json:"preview_only"`
}

// InvoicePreviewItem represents a single invoice in preview/result
type InvoicePreviewItem struct {
	InvoiceNumber string     `json:"invoice_number"`
	CustomerID    uuid.UUID  `json:"customer_id"`
	CustomerName  string     `json:"customer_name"`
	CustomerCode  string     `json:"customer_code"`
	UsageMonth    string     `json:"usage_month"`
	UsageM3       float64    `json:"usage_m3"`
	PricePerM3    float64    `json:"price_per_m3"`
	WaterCharge   float64    `json:"water_charge"`
	Abonemen      float64    `json:"abonemen"`
	PenaltyAmount float64    `json:"penalty_amount"`
	SubTotal      float64    `json:"sub_total"`
	TotalAmount   float64    `json:"total_amount"`
	DueDate       *time.Time `json:"due_date,omitempty"`
	Notes         string     `json:"notes,omitempty"`
}

// InvoicePreviewSummary represents summary of invoice preview
type InvoicePreviewSummary struct {
	TotalCustomers int     `json:"total_customers"`
	TotalUsageM3   float64 `json:"total_usage_m3"`
	TotalAmount    float64 `json:"total_amount"`
	TotalPenalty   float64 `json:"total_penalty"`
	PeriodMonth    string  `json:"period_month"`
}
