package services

import (
	"fmt"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const voidedPaymentStatus = "voided"

func ResolveInvoiceSnapshotWithDB(db *gorm.DB, invoice models.Invoice, referenceTime time.Time) (InvoiceAmountSnapshot, error) {
	var customer models.Customer
	if err := db.Preload("Subscription").
		Where("id = ? AND tenant_id = ?", invoice.CustomerID, invoice.TenantID).
		First(&customer).Error; err != nil {
		return InvoiceAmountSnapshot{}, err
	}

	return CalculateInvoiceAmountSnapshot(
		invoice,
		&customer.Subscription,
		LoadTenantSettings(invoice.TenantID),
		referenceTime,
	), nil
}

func SumActiveInvoicePayments(db *gorm.DB, invoiceID uuid.UUID) (float64, error) {
	var totalPaid float64
	if err := db.Model(&models.Payment{}).
		Where("invoice_id = ? AND status != ?", invoiceID, voidedPaymentStatus).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalPaid).Error; err != nil {
		return 0, err
	}

	return totalPaid, nil
}

func LatestActiveInvoicePaymentAt(db *gorm.DB, invoiceID uuid.UUID) (*time.Time, error) {
	var payment models.Payment
	if err := db.
		Where("invoice_id = ? AND status != ?", invoiceID, voidedPaymentStatus).
		Order("paid_at desc, created_at desc").
		First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	paidAt := payment.PaidAt
	return &paidAt, nil
}

func SyncInvoicePaymentState(db *gorm.DB, invoice *models.Invoice, referenceTime time.Time) (InvoiceAmountSnapshot, error) {
	totalPaid, err := SumActiveInvoicePayments(db, invoice.ID)
	if err != nil {
		return InvoiceAmountSnapshot{}, err
	}

	invoice.TotalPaid = totalPaid

	snapshot, err := ResolveInvoiceSnapshotWithDB(db, *invoice, referenceTime)
	if err != nil {
		return InvoiceAmountSnapshot{}, err
	}

	ApplyInvoiceAmountSnapshot(invoice, snapshot)
	invoice.PaymentStatus = DetermineInvoicePaymentStatus(*invoice, snapshot)
	invoice.IsPaid = invoice.PaymentStatus == models.PaymentStatusPaid

	if invoice.IsPaid {
		paidAt, err := LatestActiveInvoicePaymentAt(db, invoice.ID)
		if err != nil {
			return InvoiceAmountSnapshot{}, err
		}
		if paidAt != nil {
			invoice.PaidDate = paidAt
		} else if !referenceTime.IsZero() {
			referenceCopy := referenceTime
			invoice.PaidDate = &referenceCopy
		}
	} else {
		invoice.PaidDate = nil
	}

	if err := db.Model(invoice).Updates(map[string]interface{}{
		"sub_total":      invoice.SubTotal,
		"penalty_amount": invoice.PenaltyAmount,
		"total_amount":   invoice.TotalAmount,
		"total_paid":     invoice.TotalPaid,
		"is_paid":        invoice.IsPaid,
		"payment_status": invoice.PaymentStatus,
		"paid_date":      invoice.PaidDate,
	}).Error; err != nil {
		return InvoiceAmountSnapshot{}, err
	}

	if invoice.Type == string(models.InvoiceTypeRegistration) {
		if err := db.Model(&models.Customer{}).
			Where("id = ? AND tenant_id = ?", invoice.CustomerID, invoice.TenantID).
			Update("is_active", invoice.IsPaid).Error; err != nil {
			return InvoiceAmountSnapshot{}, err
		}
	}

	return snapshot, nil
}

func ValidateStoredSnapshot(snapshot InvoiceAmountSnapshot, expectedSubTotal, expectedPenaltyAmount, expectedTotalAmount, expectedRemainingAmount float64) error {
	if !almostEqual(snapshot.SubTotal, expectedSubTotal) ||
		!almostEqual(snapshot.PenaltyAmount, expectedPenaltyAmount) ||
		!almostEqual(snapshot.TotalAmount, expectedTotalAmount) ||
		!almostEqual(snapshot.RemainingAmount, expectedRemainingAmount) {
		return fmt.Errorf("snapshot mismatch")
	}

	return nil
}

func almostEqual(left, right float64) bool {
	const epsilon = 0.0001
	diff := left - right
	if diff < 0 {
		diff = -diff
	}
	return diff <= epsilon
}
