package services

import (
	"testing"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

func TestBuildInvoiceIssuedNotification(t *testing.T) {
	dueDate := time.Date(2026, time.May, 25, 0, 0, 0, 0, time.UTC)

	subject, body := BuildInvoiceIssuedNotification("INV-001", dueDate, 150000)

	if subject != "Tagihan baru tersedia" {
		t.Fatalf("expected issued subject, got %q", subject)
	}
	if body == "" {
		t.Fatal("expected issued body to be populated")
	}
}

func TestBuildInvoiceOverdueNotification(t *testing.T) {
	dueDate := time.Date(2026, time.May, 25, 0, 0, 0, 0, time.UTC)

	subject, body := BuildInvoiceOverdueNotification("INV-002", dueDate, 175000)

	if subject != "Tagihan melewati jatuh tempo" {
		t.Fatalf("expected overdue subject, got %q", subject)
	}
	if body == "" {
		t.Fatal("expected overdue body to be populated")
	}
}

func TestBuildInvoiceNotificationMetadata(t *testing.T) {
	invoiceID := uuid.New()
	dueDate := time.Date(2026, time.May, 25, 0, 0, 0, 0, time.UTC)
	invoice := models.Invoice{
		BaseModel:     models.BaseModel{ID: invoiceID},
		InvoiceNumber: "INV-003",
		Type:          string(models.InvoiceTypeMonthly),
		UsageMonth:    "2026-05",
		PaymentStatus: models.PaymentStatusUnpaid,
		DueDate:       &dueDate,
	}

	metadata := BuildInvoiceNotificationMetadata(invoice, NotificationTypeInvoiceIssued, 200000)

	if metadata["invoice_id"] != invoiceID.String() {
		t.Fatalf("expected invoice_id metadata %s, got %v", invoiceID, metadata["invoice_id"])
	}
	if metadata["notification_type"] != NotificationTypeInvoiceIssued {
		t.Fatalf("expected notification_type %s, got %v", NotificationTypeInvoiceIssued, metadata["notification_type"])
	}
	if metadata["invoice_number"] != "INV-003" {
		t.Fatalf("expected invoice_number INV-003, got %v", metadata["invoice_number"])
	}
}
