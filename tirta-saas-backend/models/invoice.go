package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type InvoiceType string

const (
	InvoiceTypeRegistration InvoiceType = "registration"
	InvoiceTypeMonthly      InvoiceType = "monthly"
	InvoiceTypeManual       InvoiceType = "manual"
)

type ManualInvoiceItem struct {
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Amount      float64 `json:"amount"`
}

// PaymentStatus represents the payment status of an invoice
type PaymentStatus string

const (
	PaymentStatusUnpaid  PaymentStatus = "UNPAID"
	PaymentStatusPartial PaymentStatus = "PARTIAL"
	PaymentStatusPaid    PaymentStatus = "PAID"
	PaymentStatusOverdue PaymentStatus = "OVERDUE"
)

type Invoice struct {
	BaseModel

	// Invoice Identity
	InvoiceNumber string `gorm:"type:varchar(50);unique;index" json:"invoice_number"` // INV-YYYYMM-XXXX

	// Customer & Tenant
	CustomerID uuid.UUID `gorm:"type:char(36);not null" json:"customer_id"`
	Customer   Customer  `gorm:"foreignKey:CustomerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"customer"`
	MeterID    *uuid.UUID `gorm:"type:char(36);index" json:"meter_id"`
	Meter      *Meter    `gorm:"foreignKey:MeterID" json:"meter,omitempty"`
	TenantID   uuid.UUID `gorm:"type:char(36);index" json:"tenant_id"`

	// Usage Details
	UsageMonth string  `gorm:"type:varchar(7);index" json:"usage_month"` // YYYY-MM
	UsageM3    float64 `json:"usage_m3"`
	PricePerM3 float64 `json:"price_per_m3"`

	// Charges
	Abonemen      float64 `json:"abonemen"`                        // Monthly subscription fee
	WaterCharge   float64 `json:"water_charge"`                    // Water usage charge
	PenaltyAmount float64 `gorm:"default:0" json:"penalty_amount"` // Late payment penalty

	// Totals
	SubTotal    float64 `json:"sub_total"`    // Before penalty
	TotalAmount float64 `json:"total_amount"` // After penalty
	TotalPaid   float64 `gorm:"default:0" json:"total_paid"`

	// Payment Status
	PaymentStatus PaymentStatus `gorm:"type:varchar(20);default:'UNPAID';index" json:"payment_status"`
	IsPaid        bool          `gorm:"default:false" json:"is_paid"` // For backward compatibility

	// Dates
	DueDate  *time.Time `json:"due_date,omitempty"`
	PaidDate *time.Time `json:"paid_date,omitempty"`

	// Type & Notes
	Type        string `gorm:"type:varchar(20);not null;index" json:"type"`
	Notes       string `gorm:"type:text" json:"notes"`
	ManualItems string `gorm:"type:json" json:"manual_items,omitempty"`
}

func (i Invoice) GetManualItems() []ManualInvoiceItem {
	if i.ManualItems == "" {
		return nil
	}

	var items []ManualInvoiceItem
	if err := json.Unmarshal([]byte(i.ManualItems), &items); err != nil {
		return nil
	}

	for idx := range items {
		if items[idx].Amount <= 0 {
			items[idx].Amount = items[idx].Quantity * items[idx].UnitPrice
		}
	}

	return items
}

func (i *Invoice) SetManualItems(items []ManualInvoiceItem) error {
	if len(items) == 0 {
		i.ManualItems = ""
		return nil
	}

	payload, err := json.Marshal(items)
	if err != nil {
		return err
	}

	i.ManualItems = string(payload)
	return nil
}
