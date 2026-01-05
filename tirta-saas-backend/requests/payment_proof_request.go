package requests

import "github.com/google/uuid"

// SubmitPaymentProofRequest for customer submitting payment proof
type SubmitPaymentProofRequest struct {
	InvoiceID       uuid.UUID `json:"invoice_id" binding:"required"`
	Amount          float64   `json:"amount" binding:"required,gt=0"`
	PaymentDate     string    `json:"payment_date" binding:"required"` // YYYY-MM-DD
	PaymentMethod   string    `json:"payment_method" binding:"required"` // bank_transfer, e_wallet, cash
	AccountName     string    `json:"account_name" binding:"required"`
	AccountNumber   string    `json:"account_number"`
	ReferenceNumber string    `json:"reference_number"`
	Notes           string    `json:"notes"`
	// ProofImageURL will be set after file upload
}

// VerifyPaymentRequest for admin verifying payment
type VerifyPaymentRequest struct {
	Notes string `json:"notes"`
}

// RejectPaymentRequest for admin rejecting payment
type RejectPaymentRequest struct {
	RejectionReason string `json:"rejection_reason" binding:"required"`
}
