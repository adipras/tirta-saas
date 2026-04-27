package models

import (
	"time"

	"github.com/google/uuid"
)

// PaymentProofStatus represents payment proof verification status
type PaymentProofStatus string

const (
	PaymentProofStatusPending  PaymentProofStatus = "PENDING"
	PaymentProofStatusVerified PaymentProofStatus = "VERIFIED"
	PaymentProofStatusRejected PaymentProofStatus = "REJECTED"
)

// PaymentProof represents customer-submitted payment proof for invoice
type PaymentProof struct {
	BaseModel

	// Relations
	TenantID   uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`
	InvoiceID  uuid.UUID `gorm:"type:char(36);not null;index" json:"invoice_id"`
	Invoice    Invoice   `gorm:"foreignKey:InvoiceID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"invoice"`
	CustomerID uuid.UUID `gorm:"type:char(36);not null;index" json:"customer_id"`
	Customer   Customer  `gorm:"foreignKey:CustomerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"customer"`

	// Payment Details
	Amount          float64   `gorm:"not null" json:"amount"`
	PaymentDate     time.Time `gorm:"not null;index" json:"payment_date"`
	PaymentMethod   string    `gorm:"type:varchar(50);not null" json:"payment_method"` // bank_transfer, e_wallet, cash
	AccountName     string    `gorm:"type:varchar(100);not null" json:"account_name"`
	AccountNumber   string    `gorm:"type:varchar(100)" json:"account_number"`
	ReferenceNumber string    `gorm:"type:varchar(100)" json:"reference_number"`
	ProofImageURL   string    `gorm:"type:varchar(500);not null" json:"proof_image_url"`
	Notes           string    `gorm:"type:text" json:"notes"`

	// Frozen amount snapshot at customer submission time
	SnapshotSubTotal        float64   `gorm:"default:0" json:"snapshot_sub_total"`
	SnapshotPenaltyAmount   float64   `gorm:"default:0" json:"snapshot_penalty_amount"`
	SnapshotTotalAmount     float64   `gorm:"default:0" json:"snapshot_total_amount"`
	SnapshotRemainingAmount float64   `gorm:"default:0" json:"snapshot_remaining_amount"`
	SnapshotCapturedAt      time.Time `gorm:"index" json:"snapshot_captured_at"`

	// Verification Status
	Status          PaymentProofStatus `gorm:"type:varchar(20);default:'PENDING';index" json:"status"`
	SubmittedAt     time.Time          `gorm:"autoCreateTime" json:"submitted_at"`
	VerifiedBy      *uuid.UUID         `gorm:"type:char(36)" json:"verified_by,omitempty"`
	VerifiedAt      *time.Time         `json:"verified_at,omitempty"`
	RejectionReason string             `gorm:"type:text" json:"rejection_reason,omitempty"`
}
