package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
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
	Success     int
	Skipped     int
	Failed      int
	TotalAmount float64
	Invoices    []models.Invoice
	Errors      []string
	PreviewOnly bool
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
		tenantSettings = models.TenantSettings{TenantID: req.TenantID}
	}
	tenantSettings.ApplyBillingDefaults()
	location := utils.ResolveLocation(tenantSettings.TimeZone)

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

		// Calculate subtotal from usage charge plus all fixed subscription fees
		waterCharge := usage.AmountCalculated
		abonemen := subType.MonthlyFee + subType.MaintenanceFee
		subTotal := waterCharge + abonemen

		// Penalty now stays attached to the source overdue invoice and is calculated dynamically on read/pay.
		penaltyAmount := 0.0
		totalAmount := subTotal

		// Validate total
		if totalAmount <= 0 || totalAmount > 999999999 {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Invalid total amount for customer: %s", usage.CustomerID))
			continue
		}

		// Calculate due date
		dueDate, err := utils.DueDateFromUsageMonth(usage.UsageMonth, tenantSettings.InvoiceDueDay, location)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("Failed to calculate due date for customer %s: %v", usage.CustomerID, err))
			continue
		}

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
			tx := config.DB.Begin()

			if err := tx.Create(&invoice).Error; err != nil {
				tx.Rollback()
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("Failed to create invoice for customer %s: %v", usage.CustomerID, err))
				continue
			}

			if invoice.DueDate != nil {
				subject, body := BuildInvoiceIssuedNotification(invoice.InvoiceNumber, *invoice.DueDate, totalAmount)
				metadata := BuildInvoiceNotificationMetadata(invoice, NotificationTypeInvoiceIssued, totalAmount)
				if err := CreateInAppNotification(tx, CreateInAppNotificationInput{
					TenantID:      req.TenantID,
					RecipientType: "CUSTOMER",
					RecipientID:   customer.ID,
					RecipientName: customer.Name,
					Subject:       subject,
					Body:          body,
					Metadata:      metadata,
				}); err != nil {
					tx.Rollback()
					result.Failed++
					result.Errors = append(result.Errors, fmt.Sprintf("Failed to create invoice notification for customer %s: %v", usage.CustomerID, err))
					continue
				}

				if customer.Email != "" {
					if _, err := CreateAndDeliverNotification(tx, CreateNotificationLogInput{
						TenantID:      req.TenantID,
						RecipientType: "CUSTOMER",
						RecipientID:   customer.ID,
						RecipientName: customer.Name,
						Channel:       models.ChannelEmail,
						Destination:   customer.Email,
						Subject:       subject,
						Body:          body,
						Metadata:      metadata,
					}); err != nil {
						tx.Rollback()
						result.Failed++
						result.Errors = append(result.Errors, fmt.Sprintf("Failed to log email invoice notification for customer %s: %v", usage.CustomerID, err))
						continue
					}
				}
			}

			if err := tx.Commit().Error; err != nil {
				result.Failed++
				result.Errors = append(result.Errors, fmt.Sprintf("Failed to commit invoice generation for customer %s: %v", usage.CustomerID, err))
				continue
			}
		}

		result.Success++
		result.TotalAmount += totalAmount
		result.Invoices = append(result.Invoices, invoice)
	}

	return result, nil
}

// UpdateOverdueInvoices updates payment status of overdue invoices
func (s *InvoiceGenerationService) UpdateOverdueInvoices(tenantID uuid.UUID) error {
	now := time.Now()

	var invoices []models.Invoice
	if err := config.DB.
		Preload("Customer").
		Where("tenant_id = ? AND due_date < ? AND payment_status IN ?",
			tenantID, now, []models.PaymentStatus{models.PaymentStatusUnpaid, models.PaymentStatusPartial}).
		Find(&invoices).Error; err != nil {
		return err
	}

	for _, invoice := range invoices {
		tx := config.DB.Begin()
		previousStatus := invoice.PaymentStatus

		snapshot, err := SyncInvoicePaymentState(tx, &invoice, now)
		if err != nil {
			tx.Rollback()
			return err
		}

		if previousStatus != invoice.PaymentStatus && invoice.PaymentStatus == models.PaymentStatusOverdue && invoice.DueDate != nil {
			subject, body := BuildInvoiceOverdueNotification(invoice.InvoiceNumber, *invoice.DueDate, snapshot.RemainingAmount)
			metadata := BuildInvoiceNotificationMetadata(invoice, NotificationTypeInvoiceOverdue, snapshot.RemainingAmount)
			if err := CreateInAppNotification(tx, CreateInAppNotificationInput{
				TenantID:      tenantID,
				RecipientType: "CUSTOMER",
				RecipientID:   invoice.CustomerID,
				RecipientName: invoice.Customer.Name,
				Subject:       subject,
				Body:          body,
				Metadata:      metadata,
			}); err != nil {
				tx.Rollback()
				return err
			}

			if invoice.Customer.Email != "" {
				if _, err := CreateAndDeliverNotification(tx, CreateNotificationLogInput{
					TenantID:      tenantID,
					RecipientType: "CUSTOMER",
					RecipientID:   invoice.CustomerID,
					RecipientName: invoice.Customer.Name,
					Channel:       models.ChannelEmail,
					Destination:   invoice.Customer.Email,
					Subject:       subject,
					Body:          body,
					Metadata:      metadata,
				}); err != nil {
					tx.Rollback()
					return err
				}
			}
		}

		if err := tx.Commit().Error; err != nil {
			return err
		}
	}

	return nil
}
