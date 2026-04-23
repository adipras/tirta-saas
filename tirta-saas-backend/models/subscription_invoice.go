package models

import (
	"time"

	"github.com/google/uuid"
)

type SubscriptionInvoiceStatus string

const (
	SubscriptionInvoiceStatusPending              SubscriptionInvoiceStatus = "PENDING"
	SubscriptionInvoiceStatusAwaitingVerification SubscriptionInvoiceStatus = "AWAITING_VERIFICATION"
	SubscriptionInvoiceStatusPaid                 SubscriptionInvoiceStatus = "PAID"
	SubscriptionInvoiceStatusVoided               SubscriptionInvoiceStatus = "VOIDED"
)

type SubscriptionInvoice struct {
	BaseModel
	TenantID uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`

	InvoiceNumber string                    `gorm:"type:varchar(50);not null;uniqueIndex" json:"invoice_number"`
	Type          string                    `gorm:"type:varchar(30);not null;default:'registration'" json:"type"`
	Status        SubscriptionInvoiceStatus `gorm:"type:varchar(30);not null;default:'PENDING';index" json:"status"`

	SubscriptionPlan string  `gorm:"type:varchar(20);not null" json:"subscription_plan"`
	PlanName         string  `gorm:"type:varchar(100);not null" json:"plan_name"`
	BillingPeriod    int     `gorm:"not null;default:1" json:"billing_period"`
	Amount           float64 `gorm:"type:decimal(15,2);not null" json:"amount"`
	Description      string  `gorm:"type:text" json:"description"`

	IssuedAt            time.Time  `gorm:"not null" json:"issued_at"`
	DueDate             *time.Time `json:"due_date,omitempty"`
	PaymentSubmittedAt  *time.Time `json:"payment_submitted_at,omitempty"`
	PaidAt              *time.Time `json:"paid_at,omitempty"`
	PaymentSubmissionID *uuid.UUID `gorm:"type:char(36);index" json:"payment_submission_id,omitempty"`

	Notes string `gorm:"type:text" json:"notes,omitempty"`
}

func (SubscriptionInvoice) TableName() string {
	return "subscription_invoices"
}
