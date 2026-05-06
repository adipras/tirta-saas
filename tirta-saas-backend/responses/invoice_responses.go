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
	MeterNumber         string           `json:"meter_number,omitempty"`
	MeterStart          *float64         `json:"meter_start,omitempty"`
	MeterEnd            *float64         `json:"meter_end,omitempty"`
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
	Notes               string           `json:"notes,omitempty"`
	Items               []InvoiceItem    `json:"items,omitempty"`
	DueDate             *time.Time       `json:"due_date,omitempty"`
	PaidDate            *time.Time       `json:"paid_date,omitempty"`
	CreatedAt           time.Time        `json:"created_at"`
	Receipt             *ReceiptPayload  `json:"receipt,omitempty"`
}

// ReceiptPayload is a frozen, self-contained snapshot of billing data
// used by mobile clients to render a thermal printer receipt without
// making additional API calls.
type ReceiptPayload struct {
	InvoiceNumber string     `json:"invoice_number"`
	CustomerName  string     `json:"customer_name"`
	MeterNumber   string     `json:"meter_number"`
	Address       string     `json:"address"`
	UsageMonth    string     `json:"usage_month"`
	MeterStart    float64    `json:"meter_start"`
	MeterEnd      float64    `json:"meter_end"`
	UsageM3       float64    `json:"usage_m3"`
	WaterCharge   float64    `json:"water_charge"`
	Abonemen      float64    `json:"abonemen"`
	PenaltyAmount float64    `json:"penalty_amount"`
	TotalAmount   float64    `json:"total_amount"`
	TotalPaid     float64    `json:"total_paid"`
	DueDate       *time.Time `json:"due_date,omitempty"`
	CompanyName   string     `json:"company_name"`
	CompanyPhone  string     `json:"company_phone"`
	CompanyEmail  string     `json:"company_email"`
	FooterText    string     `json:"footer_text"`
}

type InvoiceItem struct {
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Amount      float64 `json:"amount"`
}

type InvoiceListStats struct {
	TotalInvoices     int     `json:"total_invoices"`
	PaidCount         int     `json:"paid_count"`
	UnpaidCount       int     `json:"unpaid_count"`
	PartialCount      int     `json:"partial_count"`
	OverdueCount      int     `json:"overdue_count"`
	OpenCount         int     `json:"open_count"`
	TotalAmount       float64 `json:"total_amount"`
	OutstandingAmount float64 `json:"outstanding_amount"`
}

type CustomerSummary struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	MeterNumber string    `json:"meter_number"`
	Email       string    `json:"email"`
	Address     string    `json:"address"`
}

type InvoiceListResponse struct {
	Invoices []InvoiceResponse `json:"invoices"`
	Total    int               `json:"total"`
	Stats    InvoiceListStats  `json:"stats"`
}
