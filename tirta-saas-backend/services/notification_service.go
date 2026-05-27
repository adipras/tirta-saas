package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	NotificationTypeInvoiceIssued  = "invoice_issued"
	NotificationTypeInvoiceOverdue = "invoice_overdue"
)

type CreateInAppNotificationInput struct {
	TenantID      uuid.UUID
	RecipientType string
	RecipientID   uuid.UUID
	RecipientName string
	Subject       string
	Body          string
	Metadata      map[string]interface{}
}

func CreateInAppNotification(db *gorm.DB, input CreateInAppNotificationInput) error {
	_, err := CreateAndDeliverNotification(db, CreateNotificationLogInput{
		TenantID:      input.TenantID,
		RecipientType: input.RecipientType,
		RecipientID:   input.RecipientID,
		RecipientName: input.RecipientName,
		Channel:       models.ChannelInApp,
		Destination:   input.RecipientID.String(),
		Subject:       input.Subject,
		Body:          input.Body,
		Metadata:      input.Metadata,
	})
	return err
}

func NotifyTenantUsersByRoles(
	db *gorm.DB,
	tenantID uuid.UUID,
	roles []constants.UserRole,
	subject string,
	body string,
	metadata map[string]interface{},
) error {
	roleStrings := make([]string, 0, len(roles))
	for _, role := range roles {
		roleStrings = append(roleStrings, string(role))
	}

	var users []models.User
	if err := db.Where("tenant_id = ? AND role IN ?", tenantID, roleStrings).Find(&users).Error; err != nil {
		return err
	}

	for _, user := range users {
		if err := CreateInAppNotification(db, CreateInAppNotificationInput{
			TenantID:      tenantID,
			RecipientType: "USER",
			RecipientID:   user.ID,
			RecipientName: user.Name,
			Subject:       subject,
			Body:          body,
			Metadata:      metadata,
		}); err != nil {
			return err
		}

		if strings.TrimSpace(user.Email) == "" {
			continue
		}

		if _, err := CreateAndDeliverNotification(db, CreateNotificationLogInput{
			TenantID:      tenantID,
			RecipientType: "USER",
			RecipientID:   user.ID,
			RecipientName: user.Name,
			Channel:       models.ChannelEmail,
			Destination:   user.Email,
			Subject:       subject,
			Body:          body,
			Metadata:      metadata,
		}); err != nil {
			return err
		}
	}

	return nil
}

func BuildPaymentProofSubmittedNotification(customerName, invoiceNumber string, amount float64) (string, string) {
	return "Bukti pembayaran baru masuk", fmt.Sprintf(
		"%s mengirim bukti pembayaran untuk tagihan %s sebesar Rp%.0f dan menunggu verifikasi.",
		customerName,
		invoiceNumber,
		amount,
	)
}

func BuildPaymentProofVerifiedNotification(invoiceNumber string, amount float64) (string, string) {
	return "Pembayaran berhasil diverifikasi", fmt.Sprintf(
		"Bukti pembayaran untuk tagihan %s sebesar Rp%.0f telah diverifikasi.",
		invoiceNumber,
		amount,
	)
}

func BuildPaymentProofRejectedNotification(invoiceNumber, reason string) (string, string) {
	body := fmt.Sprintf("Bukti pembayaran untuk tagihan %s ditolak.", invoiceNumber)
	if reason != "" {
		body = fmt.Sprintf("%s Alasan: %s", body, reason)
	}

	return "Bukti pembayaran ditolak", body
}

func BuildInvoiceIssuedNotification(invoiceNumber string, dueDate time.Time, totalAmount float64) (string, string) {
	return "Tagihan baru tersedia", fmt.Sprintf(
		"Tagihan %s sebesar Rp%.0f sudah tersedia. Mohon lakukan pembayaran sebelum %s.",
		invoiceNumber,
		totalAmount,
		dueDate.Format("02 Jan 2006"),
	)
}

func BuildInvoiceOverdueNotification(invoiceNumber string, dueDate time.Time, remainingAmount float64) (string, string) {
	return "Tagihan melewati jatuh tempo", fmt.Sprintf(
		"Tagihan %s telah melewati jatuh tempo %s dan sisa tagihan saat ini sebesar Rp%.0f.",
		invoiceNumber,
		dueDate.Format("02 Jan 2006"),
		remainingAmount,
	)
}

func BuildInvoiceNotificationMetadata(invoice models.Invoice, notificationType string, amount float64) map[string]interface{} {
	metadata := map[string]interface{}{
		"invoice_id":        invoice.ID.String(),
		"invoice_number":    invoice.InvoiceNumber,
		"invoice_type":      invoice.Type,
		"notification_type": notificationType,
		"usage_month":       invoice.UsageMonth,
		"amount":            amount,
		"payment_status":    string(invoice.PaymentStatus),
	}

	if invoice.DueDate != nil {
		metadata["due_date"] = invoice.DueDate.Format(time.RFC3339)
	}

	return metadata
}

func BuildPaymentProofNotificationMetadata(paymentProof models.PaymentProof, invoice models.Invoice, notificationType string) map[string]interface{} {
	metadata := map[string]interface{}{
		"payment_proof_id":     paymentProof.ID.String(),
		"invoice_id":           invoice.ID.String(),
		"invoice_number":       invoice.InvoiceNumber,
		"customer_id":          invoice.CustomerID.String(),
		"notification_type":    notificationType,
		"payment_proof_status": string(paymentProof.Status),
		"amount":               paymentProof.Amount,
	}

	if paymentProof.RejectionReason != "" {
		metadata["rejection_reason"] = paymentProof.RejectionReason
	}

	return metadata
}
