package services

import (
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/google/uuid"
)

type InvoiceAmountSnapshot struct {
	StoredPenaltyAmount float64   `json:"stored_penalty_amount"`
	StoredTotalAmount   float64   `json:"stored_total_amount"`
	SubTotal            float64   `json:"sub_total"`
	PenaltyAmount       float64   `json:"penalty_amount"`
	TotalAmount         float64   `json:"total_amount"`
	TotalPaid           float64   `json:"total_paid"`
	RemainingAmount     float64   `json:"remaining_amount"`
	PenaltyDays         int       `json:"penalty_days"`
	ReferenceAt         time.Time `json:"reference_at"`
}

func DetermineInvoicePaymentStatus(invoice models.Invoice, snapshot InvoiceAmountSnapshot) models.PaymentStatus {
	if snapshot.RemainingAmount <= 0 && invoice.TotalPaid >= snapshot.TotalAmount {
		return models.PaymentStatusPaid
	}

	if invoice.DueDate != nil && snapshot.PenaltyDays > 0 && snapshot.RemainingAmount > 0 {
		return models.PaymentStatusOverdue
	}

	if invoice.TotalPaid > 0 {
		return models.PaymentStatusPartial
	}

	return models.PaymentStatusUnpaid
}

func LoadTenantSettings(tenantID uuid.UUID) models.TenantSettings {
	var tenantSettings models.TenantSettings
	if err := config.DB.Where("tenant_id = ?", tenantID).First(&tenantSettings).Error; err != nil {
		tenantSettings = models.TenantSettings{TenantID: tenantID}
	}

	tenantSettings.ApplyBillingDefaults()

	return tenantSettings
}

func InferInvoiceSubTotal(invoice models.Invoice) float64 {
	if invoice.SubTotal > 0 {
		return invoice.SubTotal
	}

	if invoice.Type == "monthly" {
		if invoice.WaterCharge > 0 || invoice.Abonemen > 0 {
			return invoice.WaterCharge + invoice.Abonemen
		}
		if invoice.TotalAmount > invoice.PenaltyAmount {
			return invoice.TotalAmount - invoice.PenaltyAmount
		}
	}

	if invoice.TotalAmount > 0 {
		return invoice.TotalAmount - invoice.PenaltyAmount
	}

	return 0
}

func CalculateInvoiceAmountSnapshot(invoice models.Invoice, subscription *models.SubscriptionType, tenantSettings models.TenantSettings, referenceTime time.Time) InvoiceAmountSnapshot {
	referenceAt := referenceTime
	if referenceAt.IsZero() {
		referenceAt = time.Now()
	}

	location := utils.ResolveLocation(tenantSettings.TimeZone)
	referenceAt = referenceAt.In(location)
	if invoice.IsPaid && invoice.PaidDate != nil {
		referenceAt = invoice.PaidDate.In(location)
	}

	subTotal := InferInvoiceSubTotal(invoice)
	penaltyAmount := 0.0
	penaltyDays := 0

	if invoice.Type == "monthly" && invoice.DueDate != nil && subscription != nil {
		penaltyDays = utils.PenaltyDaysSinceDueDate(*invoice.DueDate, referenceAt, location)
		if penaltyDays > 0 && subscription.LateFeePerDay > 0 {
			penaltyAmount = float64(penaltyDays) * subscription.LateFeePerDay
			if subscription.MaxLateFee > 0 && penaltyAmount > subscription.MaxLateFee {
				penaltyAmount = subscription.MaxLateFee
			}
		}
	}

	totalAmount := subTotal + penaltyAmount
	if totalAmount < 0 {
		totalAmount = 0
	}
	if totalAmount < invoice.TotalPaid {
		totalAmount = invoice.TotalPaid
	}

	remainingAmount := totalAmount - invoice.TotalPaid
	if remainingAmount < 0 {
		remainingAmount = 0
	}

	return InvoiceAmountSnapshot{
		StoredPenaltyAmount: invoice.PenaltyAmount,
		StoredTotalAmount:   invoice.TotalAmount,
		SubTotal:            subTotal,
		PenaltyAmount:       penaltyAmount,
		TotalAmount:         totalAmount,
		TotalPaid:           invoice.TotalPaid,
		RemainingAmount:     remainingAmount,
		PenaltyDays:         penaltyDays,
		ReferenceAt:         referenceAt,
	}
}

func ApplyInvoiceAmountSnapshot(invoice *models.Invoice, snapshot InvoiceAmountSnapshot) {
	invoice.SubTotal = snapshot.SubTotal
	invoice.PenaltyAmount = snapshot.PenaltyAmount
	invoice.TotalAmount = snapshot.TotalAmount
}
