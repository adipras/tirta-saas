package services

import (
	"fmt"
	"sync"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

// InvoiceNumberGenerator manages invoice number generation
type InvoiceNumberGenerator struct {
	mu sync.Mutex
}

var (
	invoiceNumberGenerator *InvoiceNumberGenerator
	once                   sync.Once
)

// GetInvoiceNumberGenerator returns singleton instance
func GetInvoiceNumberGenerator() *InvoiceNumberGenerator {
	once.Do(func() {
		invoiceNumberGenerator = &InvoiceNumberGenerator{}
	})
	return invoiceNumberGenerator
}

// GenerateInvoiceNumber generates unique invoice number with format: INV-YYYYMM-XXXX
// Thread-safe implementation with database counter
func (g *InvoiceNumberGenerator) GenerateInvoiceNumber(tenantID uuid.UUID, date time.Time) (string, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	// Format: INV-YYYYMM-XXXX
	yearMonth := date.Format("200601") // YYYYMM

	// Get last invoice number for this month
	var lastInvoice models.Invoice
	err := config.DB.Where("tenant_id = ? AND invoice_number LIKE ?", tenantID, fmt.Sprintf("INV-%s-%%", yearMonth)).
		Order("invoice_number DESC").
		First(&lastInvoice).Error

	sequence := 1
	if err == nil && lastInvoice.InvoiceNumber != "" {
		// Extract sequence number from last invoice
		var lastSeq int
		fmt.Sscanf(lastInvoice.InvoiceNumber, fmt.Sprintf("INV-%s-%%d", yearMonth), &lastSeq)
		sequence = lastSeq + 1
	}

	// Generate invoice number
	invoiceNumber := fmt.Sprintf("INV-%s-%04d", yearMonth, sequence)

	return invoiceNumber, nil
}

// GenerateInvoiceNumberBatch generates multiple invoice numbers in batch
// Useful for bulk generation
func (g *InvoiceNumberGenerator) GenerateInvoiceNumberBatch(tenantID uuid.UUID, date time.Time, count int) ([]string, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	yearMonth := date.Format("200601")

	// Get last invoice number
	var lastInvoice models.Invoice
	err := config.DB.Where("tenant_id = ? AND invoice_number LIKE ?", tenantID, fmt.Sprintf("INV-%s-%%", yearMonth)).
		Order("invoice_number DESC").
		First(&lastInvoice).Error

	startSequence := 1
	if err == nil && lastInvoice.InvoiceNumber != "" {
		var lastSeq int
		fmt.Sscanf(lastInvoice.InvoiceNumber, fmt.Sprintf("INV-%s-%%d", yearMonth), &lastSeq)
		startSequence = lastSeq + 1
	}

	// Generate batch of invoice numbers
	numbers := make([]string, count)
	for i := 0; i < count; i++ {
		numbers[i] = fmt.Sprintf("INV-%s-%04d", yearMonth, startSequence+i)
	}

	return numbers, nil
}

// ValidateInvoiceNumber checks if invoice number is valid format
func ValidateInvoiceNumber(invoiceNumber string) bool {
	var year, month, seq int
	n, err := fmt.Sscanf(invoiceNumber, "INV-%04d%02d-%04d", &year, &month, &seq)
	if err != nil || n != 3 {
		return false
	}
	return year >= 2024 && month >= 1 && month <= 12 && seq >= 1
}
