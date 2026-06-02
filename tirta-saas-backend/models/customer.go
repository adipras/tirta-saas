package models

import (
	"github.com/google/uuid"
)

type Customer struct {
	BaseModel

	Name           string           `gorm:"not null" json:"name"`
	Email          string           `gorm:"index" json:"email"`
	Password       string           `json:"-"`
	Address        string           `json:"address"`
	Phone          string           `json:"phone"`
	// Deprecated: filled from meters[0] for backward compat; will be removed after full migration
	SubscriptionID uuid.UUID        `gorm:"type:char(36);not null" json:"subscription_id"`
	Subscription   SubscriptionType `gorm:"foreignKey:SubscriptionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"subscription"`
	IsActive       bool             `gorm:"default:false" json:"is_active"`
	TenantID       uuid.UUID        `gorm:"type:char(36);not null;index" json:"tenant_id"`

	ServiceAreaID  *uuid.UUID   `gorm:"type:char(36);index" json:"service_area_id"`
	ServiceArea    *ServiceArea `gorm:"foreignKey:ServiceAreaID" json:"service_area,omitempty"`
	ReadingRouteID *uuid.UUID   `gorm:"type:char(36);index" json:"reading_route_id"`
	ReadingRoute   *ReadingRoute `gorm:"foreignKey:ReadingRouteID" json:"reading_route,omitempty"`

	Meters []Meter `gorm:"foreignKey:CustomerID" json:"meters,omitempty"`
}
