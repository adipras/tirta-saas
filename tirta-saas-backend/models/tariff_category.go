package models

import (
	"github.com/google/uuid"
)

type TariffCategory struct {
	BaseModel
	TenantID    uuid.UUID `gorm:"type:char(36);not null;index:idx_tenant_tariff_category" json:"tenant_id"`
	Code        string    `gorm:"type:varchar(20);not null" json:"code"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Type        string    `gorm:"type:varchar(50);not null" json:"type"` // residential, commercial, industrial, social
	Description string    `gorm:"type:text" json:"description"`
	IsActive    bool      `gorm:"default:true;not null" json:"is_active"`
	DisplayOrder int      `gorm:"default:0" json:"display_order"`

	// Relationships
	Tenant     Tenant       `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	WaterRates []WaterRate  `gorm:"foreignKey:CategoryID" json:"-"`
}

type ProgressiveRate struct {
	BaseModel
	TenantID       uuid.UUID `gorm:"type:char(36);not null;index:idx_tenant_progressive_rate" json:"tenant_id"`
	CategoryID     uuid.UUID `gorm:"type:char(36);not null;index:idx_category_progressive_rate" json:"category_id"`
	MinVolume      float64   `gorm:"type:decimal(10,2);not null" json:"min_volume"` // m³
	MaxVolume      *float64  `gorm:"type:decimal(10,2)" json:"max_volume"` // nil = unlimited
	PricePerUnit   float64   `gorm:"type:decimal(15,2);not null" json:"price_per_unit"`
	IsActive       bool      `gorm:"default:true;not null" json:"is_active"`
	DisplayOrder   int       `gorm:"default:0" json:"display_order"`

	// Relationships
	Tenant   Tenant          `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Category TariffCategory  `gorm:"foreignKey:CategoryID;constraint:OnDelete:CASCADE" json:"category"`
}

// Tariff types
const (
	TariffTypeResidential = "residential"
	TariffTypeCommercial  = "commercial"
	TariffTypeIndustrial  = "industrial"
	TariffTypeSocial      = "social"
	TariffTypeGovernment  = "government"
)
