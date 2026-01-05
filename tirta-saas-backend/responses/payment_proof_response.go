package responses

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

// PaymentProofResponse for payment proof submission
type PaymentProofResponse struct {
	ID              uuid.UUID          `json:"id"`
	InvoiceID       uuid.UUID          `json:"invoice_id"`
	InvoiceNumber   string             `json:"invoice_number"`
	CustomerID      uuid.UUID          `json:"customer_id"`
	CustomerName    string             `json:"customer_name"`
	TenantID        uuid.UUID          `json:"tenant_id"`
	Amount          float64            `json:"amount"`
	PaymentDate     time.Time          `json:"payment_date"`
	PaymentMethod   string             `json:"payment_method"`
	AccountName     string             `json:"account_name"`
	AccountNumber   string             `json:"account_number,omitempty"`
	ReferenceNumber string             `json:"reference_number,omitempty"`
	ProofImageURL   string             `json:"proof_image_url"`
	Notes           string             `json:"notes,omitempty"`
	Status          PaymentProofStatus `json:"status"`
	SubmittedAt     time.Time          `json:"submitted_at"`
	VerifiedBy      *uuid.UUID         `json:"verified_by,omitempty"`
	VerifiedAt      *time.Time         `json:"verified_at,omitempty"`
	RejectionReason string             `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
}

// PaymentProofListResponse for listing payment proofs
type PaymentProofListResponse struct {
	PaymentProofs []PaymentProofResponse `json:"payment_proofs"`
	Total         int64                  `json:"total"`
	Page          int                    `json:"page"`
	PerPage       int                    `json:"per_page"`
}
