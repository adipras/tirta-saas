package helpers

import (
	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

// CreateRegistrationInvoice membuat invoice untuk pendaftaran pelanggan baru
func CreateRegistrationInvoice(customerID, tenantID uuid.UUID, amount float64) (*models.Invoice, error) {
	invoice := models.Invoice{
		CustomerID:  customerID,
		TenantID:    tenantID,
		Type:        "registration",
		Abonemen:    0,
		PricePerM3:  0,
		UsageM3:     0,
		UsageMonth:  "-", // tidak relevan untuk registration
		TotalAmount: amount,
		IsPaid:      false,
		TotalPaid:   0,
	}

	if err := config.DB.Create(&invoice).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}
