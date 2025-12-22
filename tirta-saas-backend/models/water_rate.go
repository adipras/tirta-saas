package models

import (
	"time"

	"github.com/google/uuid"
)

type WaterRate struct {
	Amount         float64          `gorm:"not null" json:"amount"`
	EffectiveDate  time.Time        `gorm:"not null" json:"effective_date"`
	Active         bool             `gorm:"default:true" json:"active"`
	SubscriptionID uuid.UUID        `gorm:"type:char(36);not null" json:"subscription_id"`
	Subscription   SubscriptionType `gorm:"foreignKey:SubscriptionID" json:"subscription"`
	TenantID       uuid.UUID        `gorm:"type:char(36);not null;index" json:"tenant_id"`
	
	// Additional fields for Phase 6
	CategoryID     *uuid.UUID      `gorm:"type:char(36);index" json:"category_id"`
	Category       *TariffCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Description    string          `gorm:"type:text" json:"description"`

	BaseModel
}
