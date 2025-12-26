package models

import "time"

// SubscriptionPaymentStatus represents the status of a subscription payment
type SubscriptionPaymentStatus string

const (
	PaymentStatusPending  SubscriptionPaymentStatus = "pending"
	PaymentStatusVerified SubscriptionPaymentStatus = "verified"
	PaymentStatusRejected SubscriptionPaymentStatus = "rejected"
)

// SubscriptionPayment stores payment submissions from tenants for subscription upgrades
type SubscriptionPayment struct {
	BaseModel
	TenantID         string    `gorm:"type:char(36);not null;index" json:"tenant_id"`
	Tenant           *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	
	// Subscription Details
	SubscriptionPlan string    `gorm:"type:varchar(50);not null" json:"subscription_plan"` // BASIC, PRO, ENTERPRISE
	BillingPeriod    int       `gorm:"not null" json:"billing_period"` // in months
	Amount           float64   `gorm:"type:decimal(15,2);not null" json:"amount"`
	
	// Payment Details
	PaymentDate      time.Time `gorm:"not null" json:"payment_date"`
	PaymentMethod    string    `gorm:"type:varchar(50);not null" json:"payment_method"`
	AccountNumber    string    `gorm:"type:varchar(100)" json:"account_number,omitempty"`
	AccountName      string    `gorm:"type:varchar(255);not null" json:"account_name"`
	ReferenceNumber  string    `gorm:"type:varchar(255)" json:"reference_number,omitempty"`
	
	// Proof Upload
	ProofURL         string    `gorm:"type:varchar(500);not null" json:"proof_url"`
	
	// Submission Notes
	Notes            string    `gorm:"type:text" json:"notes,omitempty"`
	
	// Status & Verification
	Status           SubscriptionPaymentStatus `gorm:"type:varchar(50);not null;default:'pending';index" json:"status"`
	VerifiedBy       *string   `gorm:"type:char(36)" json:"verified_by,omitempty"`
	VerifiedAt       *time.Time `json:"verified_at,omitempty"`
	RejectionReason  string    `gorm:"type:text" json:"rejection_reason,omitempty"`
}

// TableName specifies the table name for SubscriptionPayment
func (SubscriptionPayment) TableName() string {
	return "subscription_payments"
}
