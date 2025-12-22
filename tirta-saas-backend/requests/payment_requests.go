package requests

import "github.com/google/uuid"

type CreatePaymentRequest struct {
	InvoiceID     uuid.UUID `json:"invoice_id" binding:"required" format:"uuid" doc:"Invoice ID to pay" example:"123e4567-e89b-12d3-a456-426614174000"`
	Amount        float64   `json:"amount" binding:"required" minimum:"0" doc:"Payment amount in IDR" example:"150000"`
	PaymentMethod string    `json:"payment_method" binding:"omitempty" enum:"CASH,BANK_TRANSFER,E_WALLET,CREDIT_CARD" doc:"Method of payment" example:"CASH"`
	PaymentDate   string    `json:"payment_date,omitempty" format:"date" doc:"Payment date (ISO format)" example:"2025-01-15"`
	Notes         string    `json:"notes,omitempty" maxLength:"500" doc:"Additional notes for this payment" example:"Paid in full"`
}
