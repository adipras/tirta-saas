package models

import (
	"github.com/google/uuid"
)

type Customer struct {
	BaseModel

	MeterNumber    string           `gorm:"unique;not null" json:"meter_number"`
	Name           string           `gorm:"not null" json:"name"`
	Email          string           `gorm:"index" json:"email"`
	Password       string           `json:"-"`
	Address        string           `json:"address"`
	Phone          string           `json:"phone"`
	SubscriptionID uuid.UUID        `gorm:"type:char(36);not null" json:"subscription_id"`
	Subscription   SubscriptionType `gorm:"foreignKey:SubscriptionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"subscription"`
	IsActive       bool             `gorm:"default:false" json:"is_active"`
	TenantID       uuid.UUID        `gorm:"type:char(36);not null;index" json:"tenant_id"`
	
	// Additional fields for Phase 6
	ServiceAreaID  *uuid.UUID `gorm:"type:char(36);index" json:"service_area_id"`
	ServiceArea    *ServiceArea `gorm:"foreignKey:ServiceAreaID" json:"service_area,omitempty"`
	ReadingRouteID *uuid.UUID `gorm:"type:char(36);index" json:"reading_route_id"`
	ReadingRoute   *ReadingRoute `gorm:"foreignKey:ReadingRouteID" json:"reading_route,omitempty"`
	
	// Relationships
	Meters []Meter `gorm:"foreignKey:CustomerID" json:"-"`
}
