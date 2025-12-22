package models

import (
	"time"

	"github.com/google/uuid"
)

// NotificationChannel represents the delivery channel for notifications
type NotificationChannel string

const (
	ChannelEmail   NotificationChannel = "EMAIL"
	ChannelSMS     NotificationChannel = "SMS"
	ChannelInApp   NotificationChannel = "IN_APP"
	ChannelWhatsApp NotificationChannel = "WHATSAPP"
)

// NotificationTemplate represents a reusable notification template
type NotificationTemplate struct {
	BaseModel
	TenantID uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`
	
	// Template Details
	Code        string              `gorm:"type:varchar(50);not null;uniqueIndex:idx_tenant_code" json:"code"`
	Name        string              `gorm:"type:varchar(100);not null" json:"name"`
	Description string              `gorm:"type:text" json:"description"`
	Channel     NotificationChannel `gorm:"type:varchar(20);not null" json:"channel"`
	
	// Template Content
	Subject     string `gorm:"type:varchar(200)" json:"subject"` // For email
	Body        string `gorm:"type:longtext;not null" json:"body"`
	HTMLBody    string `gorm:"type:longtext" json:"html_body"` // For email
	
	// Template Variables (JSON array of available variables)
	Variables string `gorm:"type:json" json:"variables"`
	
	// Configuration
	IsActive bool   `gorm:"default:true" json:"is_active"`
	Language string `gorm:"type:varchar(10);default:'id'" json:"language"`
	
	// Relations
	Tenant Tenant `gorm:"foreignKey:TenantID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

// NotificationLog represents a record of sent notifications
type NotificationLog struct {
	BaseModel
	TenantID   uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`
	TemplateID *uuid.UUID `gorm:"type:char(36);index" json:"template_id,omitempty"`
	
	// Recipient Information
	RecipientType string     `gorm:"type:varchar(20);not null" json:"recipient_type"` // USER, CUSTOMER
	RecipientID   uuid.UUID  `gorm:"type:char(36);not null;index" json:"recipient_id"`
	RecipientName string     `gorm:"type:varchar(200)" json:"recipient_name"`
	
	// Delivery Details
	Channel     NotificationChannel `gorm:"type:varchar(20);not null;index" json:"channel"`
	Destination string              `gorm:"type:varchar(255);not null" json:"destination"` // Email address, phone number, etc.
	
	// Content
	Subject string `gorm:"type:varchar(200)" json:"subject"`
	Body    string `gorm:"type:longtext;not null" json:"body"`
	
	// Status
	Status       string     `gorm:"type:varchar(20);not null;default:'PENDING';index" json:"status"` // PENDING, SENT, FAILED, DELIVERED
	SentAt       *time.Time `json:"sent_at,omitempty"`
	DeliveredAt  *time.Time `json:"delivered_at,omitempty"`
	FailedAt     *time.Time `json:"failed_at,omitempty"`
	ErrorMessage string     `gorm:"type:text" json:"error_message,omitempty"`
	
	// Retry Information
	RetryCount  int        `gorm:"default:0" json:"retry_count"`
	NextRetryAt *time.Time `json:"next_retry_at,omitempty"`
	
	// Provider Information
	Provider       string `gorm:"type:varchar(50)" json:"provider,omitempty"`
	ProviderMsgID  string `gorm:"type:varchar(255)" json:"provider_msg_id,omitempty"`
	
	// Metadata (JSON for additional info)
	Metadata string `gorm:"type:json" json:"metadata,omitempty"`
	
	// Relations
	Tenant   Tenant                `gorm:"foreignKey:TenantID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Template *NotificationTemplate `gorm:"foreignKey:TemplateID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"template,omitempty"`
}
