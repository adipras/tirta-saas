package models

import (
	"github.com/google/uuid"
)

type User struct {
	BaseModel

	Name     string `json:"name"`
	Email    string `gorm:"unique" json:"email"`
	Password string `json:"-"`
	Role     string `gorm:"type:varchar(50);not null" json:"role"`
	
	// Platform owner users don't belong to a specific tenant
	TenantID *uuid.UUID `gorm:"type:char(36)" json:"tenant_id"`
	Tenant   *Tenant    `gorm:"foreignKey:TenantID" json:"-"`
	
	// Track who created this user (for audit)
	CreatedByID *uuid.UUID `gorm:"type:char(36)" json:"created_by_id,omitempty"`
	CreatedBy   *User      `gorm:"foreignKey:CreatedByID" json:"-"`
}
