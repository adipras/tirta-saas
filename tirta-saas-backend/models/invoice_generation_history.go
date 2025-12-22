package models

import (
	"time"

	"github.com/google/uuid"
)

// InvoiceGenerationHistory tracks invoice generation runs
type InvoiceGenerationHistory struct {
	BaseModel
	
	TenantID     uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`
	Tenant       Tenant    `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	
	GeneratedFor string    `gorm:"type:varchar(7);not null" json:"generated_for"` // YYYY-MM
	GeneratedAt  time.Time `gorm:"not null" json:"generated_at"`
	
	SuccessCount int `gorm:"default:0" json:"success_count"`
	SkippedCount int `gorm:"default:0" json:"skipped_count"`
	FailedCount  int `gorm:"default:0" json:"failed_count"`
	
	Status       string `gorm:"type:varchar(20);default:'success'" json:"status"` // success, failed, partial
	ErrorMessage string `gorm:"type:text" json:"error_message,omitempty"`
	
	// Execution details
	ExecutionTimeMs int    `gorm:"default:0" json:"execution_time_ms"`
	TriggerType     string `gorm:"type:varchar(20)" json:"trigger_type"` // scheduled, manual
	TriggeredBy     *uuid.UUID `gorm:"type:char(36)" json:"triggered_by,omitempty"` // User ID if manual
}
