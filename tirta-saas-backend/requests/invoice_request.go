package requests

import "github.com/google/uuid"

type ManualInvoiceItemRequest struct {
	Description string  `json:"description" binding:"required"`
	Quantity    float64 `json:"quantity" binding:"required,gt=0"`
	UnitPrice   float64 `json:"unit_price" binding:"required,gte=0"`
}

type CreateInvoiceRequest struct {
	CustomerID uuid.UUID                  `json:"customer_id" binding:"required"`
	DueDate    string                     `json:"due_date" binding:"required"`
	Notes      string                     `json:"notes,omitempty"`
	Items      []ManualInvoiceItemRequest `json:"items" binding:"required,min=1,dive"`
}
