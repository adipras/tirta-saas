package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

// InvoiceGenerationService handles invoice generation logic
type InvoiceGenerationService struct {
	numberGenerator *InvoiceNumberGenerator
}

// NewInvoiceGenerationService creates new invoice generation service
func NewInvoiceGenerationService() *InvoiceGenerationService {
	return &InvoiceGenerationService{
		numberGenerator: GetInvoiceNumberGenerator(),
	}
}

// InvoiceGenerationRequest contains parameters for invoice generation
type InvoiceGenerationRequest struct {
	TenantID    uuid.UUID
	UsageMonth  string      // Format: YYYY-MM
	CustomerIDs []uuid.UUID // Optional: specific customers, empty = all customers
	DryRun      bool        // Preview mode, don't actually create
}

// InvoiceGenerationResult contains result of invoice generation
type InvoiceGenerationResult struct {
	Success       int
	Skipped       int
	Failed        int
	TotalAmount   float64
	Invoices      []models.Invoice
	Errors        []string
	PreviewOnly   bool
}

// GenerateInvoices generates invoices for specified month and customers
func (s *InvoiceGenerationService) GenerateInvoices(req InvoiceGenerationRequest) (*InvoiceGenerationResult, error) {
	result := &InvoiceGenerationResult{
		Invoices:    []models.Invoice{},
		Errors:      []string{},
		PreviewOnly: req.DryRun,
	}

	// Get tenant settings for penalty calculation
	var tenantSettings models.TenantSettings
	err := config.DB.Where("tenant_id = ?", req.TenantID).First(&tenantSettings).Error
	if err != nil {
		// Use default settings if not found
		tenantSettings.LatePenaltyPercent = 2.0
		tenantSettings.LatePenaltyMaxCap = 100000
		tenantSettings.GracePeriodDays = 3
		tenantSettings.InvoiceDueDays = 14
	}

	// Get water usage records for the month
	usageQuery := config.DB.Where("usage_month = ? AND tenant_id = ?", req.UsageMonth, req.TenantID)
	if len(req.CustomerIDs) > 0 {
		usageQuery = usageQuery.Where("customer_id IN ?", req.CustomerIDs)
	}

	var usages []models.WaterUsage
	if err := usageQuery.Find(&usages).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch water usage: %w", err)
	}

	if len(usages) == 0 {
		return result, errors.New("no water usage records found for the specified period")
	}

	// Generate invoice numbers in batch
	invoiceNumbers, err := s.numberGenerator.GenerateInvoiceNumberBatch(req.TenantID, time.Now(), len(usages))
	if err != nil {
		return nil, fmt.Errorf("failed to generate invoice numbers: %w", err)
	}

	invoiceIndex := 0

	for _, usage := range usages {
		// Check if invoice already exists
		var existing models.Invoice
		err := config.DB.Where("customer_id = ? AND usage_month = ? AND type = ?",
			usage.CustomerID, usage.UsageMonth, "monthly").First(&existing).Error
		if err == nil {
			result.Skipped++
			result.Errors = append(result.Errors, fmt.Sprintf("Invoice already exists for customer %s", usage.CustomerID))
			continue
		}

		// Get customer details
		var customer models.Customer
		if err := config.DB.Where("id = ? AND tenant_id = ?", usage.CustomerID, req.TenantID).First(&customer).Error; err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Customer not found: %s", usage.CustomerID))
			continue
		}

		// Get subscription type
		var subType models.SubscriptionType
		if err := config.DB.Where("id = ? AND tenant_id = ?", customer.SubscriptionID, req.TenantID).First(&subType).Error; err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Subscription type not found for customer: %s", usage.CustomerID))
			continue
		}

		// Validate usage data
		if usage.UsageM3 < 0 || usage.AmountCalculated < 0 {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Invalid usage data for customer: %s", usage.CustomerID))
			continue
		}

		// Calculate price per m3
		pricePerM3 := 0.0
		if usage.UsageM3 > 0 {
			pricePerM3 = usage.AmountCalculated / usage.UsageM3
		}

		// Calculate subtotal
		waterCharge := usage.AmountCalculated
		abonemen := subType.MonthlyFee
		subTotal := waterCharge + abonemen

		// Calculate late payment penalty from previous unpaid invoices
		penaltyAmount := s.calculatePenalty(req.TenantID, usage.CustomerID, tenantSettings)

		// Calculate total
		totalAmount := subTotal + penaltyAmount

		// Validate total
		if totalAmount <= 0 || totalAmount > 999999999 {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Invalid total amount for customer: %s", usage.CustomerID))
			continue
		}

		// Calculate due date
		dueDate := time.Now().AddDate(0, 0, tenantSettings.InvoiceDueDays)

		// Create invoice
		invoice := models.Invoice{
			InvoiceNumber: invoiceNumbers[invoiceIndex],
			CustomerID:    usage.CustomerID,
			TenantID:      req.TenantID,
			UsageMonth:    usage.UsageMonth,
			UsageM3:       usage.UsageM3,
			PricePerM3:    pricePerM3,
			Abonemen:      abonemen,
			WaterCharge:   waterCharge,
			PenaltyAmount: penaltyAmount,
			SubTotal:      subTotal,
			TotalAmount:   totalAmount,
			TotalPaid:     0,
			PaymentStatus: models.PaymentStatusUnpaid,
			IsPaid:        false,
			DueDate:       &dueDate,
			Type:          "monthly",
			Notes:         fmt.Sprintf("Auto-generated invoice for %s", usage.UsageMonth),
		}

		invoiceIndex++

		if !req.DryRun {
			// Save to database
			if err := config.DB.Create(&invoice).Error; err != nil {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("Failed to create invoice for customer %s: %v", usage.CustomerID, err))
				continue
			}
		}

		result.Success++
		result.TotalAmount += totalAmount
		result.Invoices = append(result.Invoices, invoice)
	}

	return result, nil
}

// calculatePenalty calculates late payment penalty for a customer
func (s *InvoiceGenerationService) calculatePenalty(tenantID, customerID uuid.UUID, settings models.TenantSettings) float64 {
	// Find unpaid invoices past due date
	var unpaidInvoices []models.Invoice
	now := time.Now()
	gracePeriod := time.Duration(settings.GracePeriodDays) * 24 * time.Hour

	config.DB.Where("tenant_id = ? AND customer_id = ? AND payment_status != ? AND due_date < ?",
		tenantID, customerID, models.PaymentStatusPaid, now.Add(-gracePeriod)).
		Find(&unpaidInvoices)

	if len(unpaidInvoices) == 0 {
		return 0
	}

	totalPenalty := 0.0
	for _, invoice := range unpaidInvoices {
		outstanding := invoice.TotalAmount - invoice.TotalPaid
		penalty := outstanding * (settings.LatePenaltyPercent / 100.0)

		// Apply max cap
		if penalty > settings.LatePenaltyMaxCap {
			penalty = settings.LatePenaltyMaxCap
		}

		totalPenalty += penalty
	}

	return totalPenalty
}

// UpdateOverdueInvoices updates payment status of overdue invoices
func (s *InvoiceGenerationService) UpdateOverdueInvoices(tenantID uuid.UUID) error {
	now := time.Now()

	// Update invoices that are past due date and not paid
	result := config.DB.Model(&models.Invoice{}).
		Where("tenant_id = ? AND due_date < ? AND payment_status = ?", 
			tenantID, now, models.PaymentStatusUnpaid).
		Update("payment_status", models.PaymentStatusOverdue)

	if result.Error != nil {
		return result.Error
	}

	return nil
}
