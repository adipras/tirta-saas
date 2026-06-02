package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var ErrRegistrationInvoiceExists = errors.New("invoice registrasi untuk meter ini sudah pernah dibuat")

// GenerateRegistrationInvoice creates a registration invoice for a newly installed meter.
// Must be called within a DB transaction (pass tx, not config.DB) so it can be rolled back atomically.
func GenerateRegistrationInvoice(db *gorm.DB, tenantID, customerID, meterID uuid.UUID) (*models.Invoice, error) {
	// Load meter + subscription type
	var meter models.Meter
	if err := db.Preload("SubscriptionType").Where("id = ? AND deleted_at IS NULL", meterID).First(&meter).Error; err != nil {
		return nil, fmt.Errorf("meter tidak ditemukan: %w", err)
	}

	if meter.SubscriptionType == nil {
		return nil, fmt.Errorf("jenis langganan meter tidak ditemukan")
	}

	// Load tenant settings for due date calculation
	var tenantSettings models.TenantSettings
	if err := db.Where("tenant_id = ?", tenantID).First(&tenantSettings).Error; err != nil {
		tenantSettings = models.TenantSettings{TenantID: tenantID}
	}
	tenantSettings.ApplyBillingDefaults()

	// Check for duplicate registration invoice
	var existing models.Invoice
	err := db.Where("meter_id = ? AND type = 'registration' AND deleted_at IS NULL", meterID).First(&existing).Error
	if err == nil {
		return nil, ErrRegistrationInvoiceExists
	}

	// Generate invoice number
	invoiceNumber, err := GetInvoiceNumberGenerator().GenerateInvoiceNumber(tenantID, time.Now())
	if err != nil {
		return nil, fmt.Errorf("gagal membuat nomor invoice: %w", err)
	}

	subType := meter.SubscriptionType
	registrationFee := subType.RegistrationFee
	abonemen := subType.MonthlyFee
	subTotal := registrationFee + abonemen

	dueDate := time.Now().AddDate(0, 0, tenantSettings.InvoiceDueDays)

	invoice := models.Invoice{
		InvoiceNumber: invoiceNumber,
		CustomerID:    customerID,
		TenantID:      tenantID,
		MeterID:       &meterID,
		UsageMonth:    "",
		UsageM3:       0,
		PricePerM3:    0,
		Abonemen:      abonemen,
		WaterCharge:   0,
		PenaltyAmount: 0,
		SubTotal:      subTotal,
		TotalAmount:   subTotal,
		TotalPaid:     0,
		PaymentStatus: models.PaymentStatusUnpaid,
		IsPaid:        false,
		DueDate:       &dueDate,
		Type:          string(models.InvoiceTypeRegistration),
		Notes:         fmt.Sprintf("Biaya registrasi meter %s", meter.MeterNumber),
	}

	if err := db.Create(&invoice).Error; err != nil {
		return nil, fmt.Errorf("gagal menyimpan invoice registrasi: %w", err)
	}

	return &invoice, nil
}
