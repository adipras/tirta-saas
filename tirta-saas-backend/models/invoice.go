package models

import (
	"github.com/google/uuid"
)

type Invoice struct {
	BaseModel

	CustomerID  uuid.UUID `gorm:"type:char(36);not null" json:"customer_id"`
	Customer    Customer  `gorm:"foreignKey:CustomerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"customer"`
	UsageMonth  string    `gorm:"type:varchar(7);index" json:"usage_month"`
	UsageM3     float64   `json:"usage_m3"`
	Abonemen    float64   `json:"abonemen"`
	PricePerM3  float64   `json:"price_per_m3"`
	TotalAmount float64   `json:"total_amount"`
	IsPaid      bool      `gorm:"default:false" json:"is_paid"`
	TotalPaid   float64   `gorm:"default:0" json:"total_paid"`
	Type        string    `gorm:"type:enum('registration','monthly');not null" json:"type"`
	TenantID    uuid.UUID `gorm:"type:char(36);index" json:"tenant_id"`
}
