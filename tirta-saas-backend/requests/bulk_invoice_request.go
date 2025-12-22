package requests

import "github.com/google/uuid"

// BulkInvoiceGenerationRequest represents bulk invoice generation request
type BulkInvoiceGenerationRequest struct {
	UsageMonth  string      `json:"usage_month" binding:"required" example:"2025-01"` // Format: YYYY-MM
	CustomerIDs []uuid.UUID `json:"customer_ids"`                                      // Optional: specific customers, empty = all
	Preview     bool        `json:"preview"`                                           // If true, only preview without creating
}

// InvoicePreviewRequest represents invoice preview request (alias for clarity)
type InvoicePreviewRequest struct {
	UsageMonth  string      `json:"usage_month" binding:"required" example:"2025-01"`
	CustomerIDs []uuid.UUID `json:"customer_ids"`
}
