package services

import (
	"errors"
	"net/smtp"
	"strings"
	"testing"

	"github.com/adipras/tirta-saas-backend/models"
)

func TestDeliverNotification_InAppUsesInternalProvider(t *testing.T) {
	provider, err := DeliverNotification(models.ChannelInApp, "recipient-id", "Halo", "Isi", "")
	if err != nil {
		t.Fatalf("expected in-app delivery to succeed, got error: %v", err)
	}

	if provider != "IN_APP" {
		t.Fatalf("expected provider IN_APP, got %q", provider)
	}
}

func TestDeliverNotification_UnsupportedChannel(t *testing.T) {
	_, err := DeliverNotification(models.ChannelSMS, "08123", "Halo", "Isi", "")
	if !errors.Is(err, ErrNotificationChannelUnsupported) {
		t.Fatalf("expected ErrNotificationChannelUnsupported, got %v", err)
	}
}

func TestDeliverEmailWithSender_RequiresSMTPConfig(t *testing.T) {
	err := deliverEmailWithSender(SMTPConfig{}, EmailMessage{
		To:       "user@example.com",
		Subject:  "Halo",
		TextBody: "Isi email",
	}, func(string, smtp.Auth, string, []string, []byte) error {
		t.Fatal("sendMail should not be called when SMTP config is missing")
		return nil
	})
	if !errors.Is(err, ErrEmailProviderNotConfigured) {
		t.Fatalf("expected ErrEmailProviderNotConfigured, got %v", err)
	}
}

func TestDeliverEmailWithSender_BuildsMultipartEmail(t *testing.T) {
	cfg := SMTPConfig{
		Host:      "smtp.example.com",
		Port:      "587",
		Username:  "mailer",
		Password:  "secret",
		FromEmail: "noreply@example.com",
		FromName:  "Tirta SaaS",
	}

	var capturedAddr string
	var capturedFrom string
	var capturedTo []string
	var capturedMsg string

	err := deliverEmailWithSender(cfg, EmailMessage{
		To:       "user@example.com",
		Subject:  "Tagihan baru",
		TextBody: "Versi teks",
		HTMLBody: "<strong>Versi HTML</strong>",
	}, func(addr string, _ smtp.Auth, from string, to []string, msg []byte) error {
		capturedAddr = addr
		capturedFrom = from
		capturedTo = to
		capturedMsg = string(msg)
		return nil
	})
	if err != nil {
		t.Fatalf("expected email delivery to succeed, got error: %v", err)
	}

	if capturedAddr != "smtp.example.com:587" {
		t.Fatalf("expected smtp address smtp.example.com:587, got %q", capturedAddr)
	}

	if capturedFrom != "noreply@example.com" {
		t.Fatalf("expected from noreply@example.com, got %q", capturedFrom)
	}

	if len(capturedTo) != 1 || capturedTo[0] != "user@example.com" {
		t.Fatalf("unexpected recipients: %#v", capturedTo)
	}

	expectedParts := []string{
		"From: Tirta SaaS <noreply@example.com>",
		"To: user@example.com",
		"Subject: Tagihan baru",
		"Content-Type: multipart/alternative",
		"Content-Type: text/plain; charset=\"UTF-8\"",
		"Versi teks",
		"Content-Type: text/html; charset=\"UTF-8\"",
		"<strong>Versi HTML</strong>",
	}
	for _, part := range expectedParts {
		if !strings.Contains(capturedMsg, part) {
			t.Fatalf("expected email payload to contain %q, got %s", part, capturedMsg)
		}
	}
}
