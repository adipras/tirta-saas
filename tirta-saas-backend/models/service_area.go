package models

import (
	"github.com/google/uuid"
)

type ServiceArea struct {
	BaseModel
	TenantID    uuid.UUID `gorm:"type:char(36);not null;index:idx_tenant_service_area" json:"tenant_id"`
	Code        string    `gorm:"type:varchar(20);not null" json:"code"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Type        string    `gorm:"type:varchar(20);not null" json:"type"` // RT, RW, Blok, Zone
	ParentID    *uuid.UUID `gorm:"type:char(36);index" json:"parent_id"`
	Description string    `gorm:"type:text" json:"description"`
	IsActive    bool      `gorm:"default:true;not null" json:"is_active"`

	// Additional information
	Population    int    `gorm:"default:0" json:"population"`
	CustomerCount int    `gorm:"default:0" json:"customer_count"`
	CoverageArea  string `gorm:"type:varchar(200)" json:"coverage_area"`

	// Relationships
	Tenant    Tenant         `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Parent    *ServiceArea   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children  []ServiceArea  `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Customers []Customer     `gorm:"foreignKey:ServiceAreaID" json:"-"`
}

// Service area types
const (
	ServiceAreaTypeRT   = "RT"
	ServiceAreaTypeRW   = "RW"
	ServiceAreaTypeBlok = "Blok"
	ServiceAreaTypeZone = "Zone"
)
