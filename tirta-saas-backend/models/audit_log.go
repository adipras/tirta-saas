package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditAction represents the type of action being audited
type AuditAction string

const (
	ActionCreate            AuditAction = "CREATE"
	ActionRead              AuditAction = "READ"
	ActionUpdate            AuditAction = "UPDATE"
	ActionDelete            AuditAction = "DELETE"
	ActionLogin             AuditAction = "LOGIN"
	ActionLogout            AuditAction = "LOGOUT"
	ActionPayment           AuditAction = "PAYMENT"
	ActionInvoiceGeneration AuditAction = "INVOICE_GENERATION"
	ActionPasswordChange    AuditAction = "PASSWORD_CHANGE"
	ActionRoleChange        AuditAction = "ROLE_CHANGE"
	ActionActivation        AuditAction = "ACTIVATION"
	ActionDeactivation      AuditAction = "DEACTIVATION"
)

// AuditLevel represents the severity level of the audit event
type AuditLevel string

const (
	LevelInfo     AuditLevel = "INFO"
	LevelWarning  AuditLevel = "WARNING"
	LevelCritical AuditLevel = "CRITICAL"
)

// AuditLog represents an audit log entry
type AuditLog struct {
	ID           uuid.UUID   `gorm:"type:char(36);primary_key" json:"id"`
	TenantID     uuid.UUID   `gorm:"type:char(36);not null;index" json:"tenant_id"`
	UserID       *uuid.UUID  `gorm:"type:char(36);index" json:"user_id,omitempty"`
	CustomerID   *uuid.UUID  `gorm:"type:char(36);index" json:"customer_id,omitempty"`
	Action       AuditAction `gorm:"type:varchar(50);not null;index" json:"action"`
	Resource     string      `gorm:"type:varchar(100);not null;index" json:"resource"`
	ResourceID   *uuid.UUID  `gorm:"type:char(36);index" json:"resource_id,omitempty"`
	Level        AuditLevel  `gorm:"type:varchar(20);not null;index" json:"level"`
	Description  string      `gorm:"type:text" json:"description"`
	OldValues    *string     `gorm:"type:longtext" json:"old_values,omitempty"`
	NewValues    *string     `gorm:"type:longtext" json:"new_values,omitempty"`
	IPAddress    string      `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent    string      `gorm:"type:text" json:"user_agent"`
	Endpoint     string      `gorm:"type:varchar(255)" json:"endpoint"`
	Method       string      `gorm:"type:varchar(10)" json:"method"`
	StatusCode   int         `json:"status_code"`
	Duration     int64       `json:"duration_ms"`
	Success      bool        `gorm:"index" json:"success"`
	ErrorMessage *string     `gorm:"type:text" json:"error_message,omitempty"`
	Metadata     *string     `gorm:"type:longtext" json:"metadata,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
}

// BeforeCreate sets the ID for audit log before creation
func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}