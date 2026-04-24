package responses

import (
	"time"

	"github.com/google/uuid"
)

type PaymentResponse struct {
	ID              uuid.UUID `json:"id"`
	InvoiceID       uuid.UUID `json:"invoice_id"`
	Amount          float64   `json:"amount"`
	PaidAt          time.Time `json:"paid_at"`
	PaymentMethod   string    `json:"payment_method,omitempty"`
	ReferenceNumber string    `json:"reference_number,omitempty"`
	Notes           string    `json:"notes,omitempty"`
	Status          string    `json:"status,omitempty"`
}
