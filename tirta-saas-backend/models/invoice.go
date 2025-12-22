package models

import (
	"time"
	
	"github.com/google/uuid"
)

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
	InvoiceNumber string    `gorm:"type:varchar(50);unique;index" json:"invoice_number"` // INV-YYYYMM-XXXX
	
	// Customer & Tenant
	CustomerID  uuid.UUID `gorm:"type:char(36);not null" json:"customer_id"`
	Customer    Customer  `gorm:"foreignKey:CustomerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"customer"`
	TenantID    uuid.UUID `gorm:"type:char(36);index" json:"tenant_id"`
	
	// Usage Details
	UsageMonth  string    `gorm:"type:varchar(7);index" json:"usage_month"` // YYYY-MM
	UsageM3     float64   `json:"usage_m3"`
	PricePerM3  float64   `json:"price_per_m3"`
	
	// Charges
	Abonemen      float64 `json:"abonemen"`       // Monthly subscription fee
	WaterCharge   float64 `json:"water_charge"`   // Water usage charge
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
	Type  string `gorm:"type:enum('registration','monthly');not null" json:"type"`
	Notes string `gorm:"type:text" json:"notes"`
}
