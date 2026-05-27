package services

import (
	"bytes"
	"errors"
	"fmt"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
)

var (
	ErrEmailProviderNotConfigured     = errors.New("provider email SMTP belum dikonfigurasi")
	ErrNotificationChannelUnsupported = errors.New("channel notifikasi ini belum didukung untuk pengiriman nyata")
)

type SMTPConfig struct {
	Host      string
	Port      string
	Username  string
	Password  string
	FromEmail string
	FromName  string
}

type EmailMessage struct {
	To       string
	Subject  string
	TextBody string
	HTMLBody string
}

type smtpSendMailFunc func(addr string, a smtp.Auth, from string, to []string, msg []byte) error

func LoadSMTPConfigFromEnv() SMTPConfig {
	return SMTPConfig{
		Host:      strings.TrimSpace(os.Getenv("SMTP_HOST")),
		Port:      strings.TrimSpace(os.Getenv("SMTP_PORT")),
		Username:  strings.TrimSpace(os.Getenv("SMTP_USERNAME")),
		Password:  os.Getenv("SMTP_PASSWORD"),
		FromEmail: strings.TrimSpace(os.Getenv("SMTP_FROM_EMAIL")),
		FromName:  strings.TrimSpace(os.Getenv("SMTP_FROM_NAME")),
	}
}

func (cfg SMTPConfig) IsConfigured() bool {
	return cfg.Host != "" && cfg.Port != "" && cfg.FromEmail != ""
}

func DeliverNotification(channel models.NotificationChannel, destination, subject, body, htmlBody string) (string, error) {
	switch channel {
	case models.ChannelInApp:
		return "IN_APP", nil
	case models.ChannelEmail:
		if err := DeliverEmail(LoadSMTPConfigFromEnv(), EmailMessage{
			To:       destination,
			Subject:  subject,
			TextBody: body,
			HTMLBody: htmlBody,
		}); err != nil {
			return "SMTP", err
		}
		return "SMTP", nil
	default:
		return "", ErrNotificationChannelUnsupported
	}
}

func DeliverEmail(cfg SMTPConfig, message EmailMessage) error {
	return deliverEmailWithSender(cfg, message, smtp.SendMail)
}

func deliverEmailWithSender(cfg SMTPConfig, message EmailMessage, sendMail smtpSendMailFunc) error {
	if !cfg.IsConfigured() {
		return ErrEmailProviderNotConfigured
	}

	if strings.TrimSpace(message.To) == "" {
		return errors.New("tujuan email tidak boleh kosong")
	}

	if strings.TrimSpace(message.Subject) == "" {
		return errors.New("subjek email tidak boleh kosong")
	}

	emailBody := strings.TrimSpace(message.TextBody)
	if emailBody == "" && strings.TrimSpace(message.HTMLBody) == "" {
		return errors.New("isi email tidak boleh kosong")
	}

	var auth smtp.Auth
	if cfg.Username != "" || cfg.Password != "" {
		auth = smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	}

	msgBytes, err := buildEmailMessage(cfg, message)
	if err != nil {
		return err
	}

	return sendMail(netJoinHostPort(cfg.Host, cfg.Port), auth, cfg.FromEmail, []string{message.To}, msgBytes)
}

func buildEmailMessage(cfg SMTPConfig, message EmailMessage) ([]byte, error) {
	fromHeader := cfg.FromEmail
	if cfg.FromName != "" {
		fromHeader = fmt.Sprintf("%s <%s>", cfg.FromName, cfg.FromEmail)
	}

	var buffer bytes.Buffer
	buffer.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	buffer.WriteString(fmt.Sprintf("To: %s\r\n", message.To))
	buffer.WriteString(fmt.Sprintf("Subject: %s\r\n", message.Subject))
	buffer.WriteString("MIME-Version: 1.0\r\n")
	buffer.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))

	if strings.TrimSpace(message.HTMLBody) != "" {
		boundary := "tirta-saas-boundary"
		buffer.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=%q\r\n", boundary))
		buffer.WriteString("\r\n")
		buffer.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		buffer.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n\r\n")
		buffer.WriteString(defaultTextBody(message))
		buffer.WriteString("\r\n")
		buffer.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		buffer.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n")
		buffer.WriteString(strings.TrimSpace(message.HTMLBody))
		buffer.WriteString("\r\n")
		buffer.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
		return buffer.Bytes(), nil
	}

	buffer.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	buffer.WriteString("\r\n")
	buffer.WriteString(strings.TrimSpace(message.TextBody))

	return buffer.Bytes(), nil
}

func defaultTextBody(message EmailMessage) string {
	if strings.TrimSpace(message.TextBody) != "" {
		return strings.TrimSpace(message.TextBody)
	}

	return "Silakan lihat versi HTML email ini pada klien email Anda."
}

func netJoinHostPort(host, port string) string {
	return fmt.Sprintf("%s:%s", host, port)
}
