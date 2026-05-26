package services

import (
	"testing"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
)

func TestCalculateInvoiceAmountSnapshot_AppliesLateFeeWithCap(t *testing.T) {
	location := time.FixedZone("WIB", 7*60*60)
	dueDate := time.Date(2026, time.January, 10, 23, 59, 59, 0, location)
	referenceTime := time.Date(2026, time.January, 15, 9, 0, 0, 0, location)

	invoice := models.Invoice{
		Type:        string(models.InvoiceTypeMonthly),
		WaterCharge: 100000,
		Abonemen:    20000,
		DueDate:     &dueDate,
	}
	subscription := &models.SubscriptionType{
		LateFeePerDay: 10000,
		MaxLateFee:    30000,
	}
	tenantSettings := models.TenantSettings{
		TimeZone: location.String(),
	}

	snapshot := CalculateInvoiceAmountSnapshot(invoice, subscription, tenantSettings, referenceTime)

	if snapshot.SubTotal != 120000 {
		t.Fatalf("expected subtotal 120000, got %.0f", snapshot.SubTotal)
	}
	if snapshot.PenaltyDays != 5 {
		t.Fatalf("expected penalty days 5, got %d", snapshot.PenaltyDays)
	}
	if snapshot.PenaltyAmount != 30000 {
		t.Fatalf("expected capped penalty 30000, got %.0f", snapshot.PenaltyAmount)
	}
	if snapshot.TotalAmount != 150000 {
		t.Fatalf("expected total amount 150000, got %.0f", snapshot.TotalAmount)
	}
	if snapshot.RemainingAmount != 150000 {
		t.Fatalf("expected remaining amount 150000, got %.0f", snapshot.RemainingAmount)
	}
}

func TestCalculateInvoiceAmountSnapshot_UsesPaidDateForPaidInvoice(t *testing.T) {
	location := time.FixedZone("WIB", 7*60*60)
	dueDate := time.Date(2026, time.January, 10, 23, 59, 59, 0, location)
	paidDate := time.Date(2026, time.January, 12, 10, 0, 0, 0, location)
	referenceTime := time.Date(2026, time.January, 20, 8, 0, 0, 0, location)

	invoice := models.Invoice{
		Type:        string(models.InvoiceTypeMonthly),
		WaterCharge: 80000,
		Abonemen:    20000,
		TotalPaid:   120000,
		IsPaid:      true,
		DueDate:     &dueDate,
		PaidDate:    &paidDate,
	}
	subscription := &models.SubscriptionType{
		LateFeePerDay: 10000,
		MaxLateFee:    50000,
	}
	tenantSettings := models.TenantSettings{
		TimeZone: location.String(),
	}

	snapshot := CalculateInvoiceAmountSnapshot(invoice, subscription, tenantSettings, referenceTime)

	if !snapshot.ReferenceAt.Equal(paidDate) {
		t.Fatalf("expected reference date to use paid date, got %s", snapshot.ReferenceAt)
	}
	if snapshot.PenaltyDays != 2 {
		t.Fatalf("expected penalty days 2 based on paid date, got %d", snapshot.PenaltyDays)
	}
	if snapshot.TotalAmount != 120000 {
		t.Fatalf("expected total amount 120000, got %.0f", snapshot.TotalAmount)
	}
	if snapshot.RemainingAmount != 0 {
		t.Fatalf("expected remaining amount 0, got %.0f", snapshot.RemainingAmount)
	}
}

func TestCalculateInvoiceAmountSnapshot_NeverDropsBelowTotalPaid(t *testing.T) {
	invoice := models.Invoice{
		Type:      string(models.InvoiceTypeManual),
		SubTotal:  100000,
		TotalPaid: 150000,
	}

	snapshot := CalculateInvoiceAmountSnapshot(invoice, nil, models.TenantSettings{}, time.Time{})

	if snapshot.TotalAmount != 150000 {
		t.Fatalf("expected total amount floored to total paid, got %.0f", snapshot.TotalAmount)
	}
	if snapshot.RemainingAmount != 0 {
		t.Fatalf("expected remaining amount 0, got %.0f", snapshot.RemainingAmount)
	}
}

func TestDetermineInvoicePaymentStatus(t *testing.T) {
	dueDate := time.Date(2026, time.January, 10, 23, 59, 59, 0, time.UTC)

	tests := []struct {
		name     string
		invoice   models.Invoice
		snapshot InvoiceAmountSnapshot
		expected models.PaymentStatus
	}{
		{
			name: "paid when fully settled",
			invoice: models.Invoice{
				TotalPaid: 150000,
			},
			snapshot: InvoiceAmountSnapshot{
				TotalAmount:     150000,
				RemainingAmount: 0,
			},
			expected: models.PaymentStatusPaid,
		},
		{
			name: "overdue before partial when due date passed",
			invoice: models.Invoice{
				TotalPaid: 20000,
				DueDate:   &dueDate,
			},
			snapshot: InvoiceAmountSnapshot{
				PenaltyDays:     1,
				RemainingAmount: 80000,
			},
			expected: models.PaymentStatusOverdue,
		},
		{
			name: "partial when some payment exists but not overdue",
			invoice: models.Invoice{
				TotalPaid: 20000,
			},
			snapshot: InvoiceAmountSnapshot{
				RemainingAmount: 80000,
			},
			expected: models.PaymentStatusPartial,
		},
		{
			name: "unpaid when nothing has been paid",
			invoice: models.Invoice{
				TotalPaid: 0,
			},
			snapshot: InvoiceAmountSnapshot{
				RemainingAmount: 100000,
			},
			expected: models.PaymentStatusUnpaid,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status := DetermineInvoicePaymentStatus(tt.invoice, tt.snapshot)
			if status != tt.expected {
				t.Fatalf("expected status %s, got %s", tt.expected, status)
			}
		})
	}
}

func TestValidateStoredSnapshot(t *testing.T) {
	snapshot := InvoiceAmountSnapshot{
		SubTotal:        100000,
		PenaltyAmount:   5000,
		TotalAmount:     105000,
		RemainingAmount: 25000,
	}

	if err := ValidateStoredSnapshot(snapshot, 100000, 5000, 105000, 25000); err != nil {
		t.Fatalf("expected snapshot to validate, got error: %v", err)
	}

	if err := ValidateStoredSnapshot(snapshot, 100000, 0, 105000, 25000); err == nil {
		t.Fatal("expected snapshot mismatch error, got nil")
	}
}
