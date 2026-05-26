package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
	now := time.Now()

	metadataJSON := ""
	if input.Metadata != nil {
		payload, err := json.Marshal(input.Metadata)
		if err != nil {
			return err
		}
		metadataJSON = string(payload)
	}

	notification := models.NotificationLog{
		TenantID:      input.TenantID,
		RecipientType: input.RecipientType,
		RecipientID:   input.RecipientID,
		RecipientName: input.RecipientName,
		Channel:       models.ChannelInApp,
		Destination:   input.RecipientID.String(),
		Subject:       input.Subject,
		Body:          input.Body,
		Status:        "DELIVERED",
		SentAt:        &now,
		DeliveredAt:   &now,
		Metadata:      metadataJSON,
	}

	return db.Create(&notification).Error
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
