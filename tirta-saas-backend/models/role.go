package models

import (
	"github.com/google/uuid"
)

type Role struct {
	BaseModel
	TenantID    uuid.UUID `gorm:"type:char(36);not null;index:idx_tenant_role" json:"tenant_id"`
	Name        string    `gorm:"type:varchar(50);not null" json:"name"`
	DisplayName string    `gorm:"type:varchar(100);not null" json:"display_name"`
	Description string    `gorm:"type:text" json:"description"`
	IsSystem    bool      `gorm:"default:false;not null" json:"is_system"` // Cannot be modified/deleted
	IsActive    bool      `gorm:"default:true;not null" json:"is_active"`

	// Relationships
	Tenant      Tenant           `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Permissions []RolePermission `gorm:"foreignKey:RoleID" json:"permissions,omitempty"`
	Users       []User           `gorm:"many2many:user_roles" json:"-"`
}

type Permission struct {
	BaseModel
	Name        string `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	DisplayName string `gorm:"type:varchar(150);not null" json:"display_name"`
	Description string `gorm:"type:text" json:"description"`
	Category    string `gorm:"type:varchar(50);not null;index" json:"category"`
	IsActive    bool   `gorm:"default:true;not null" json:"is_active"`
}

type RolePermission struct {
	BaseModel
	RoleID       uuid.UUID `gorm:"type:char(36);not null;index:idx_role_permission" json:"role_id"`
	PermissionID uuid.UUID `gorm:"type:char(36);not null;index:idx_role_permission" json:"permission_id"`

	// Relationships
	Role       Role       `gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE" json:"-"`
	Permission Permission `gorm:"foreignKey:PermissionID;constraint:OnDelete:CASCADE" json:"permission"`
}

type UserRole struct {
	UserID uuid.UUID `gorm:"type:char(36);primaryKey" json:"user_id"`
	RoleID uuid.UUID `gorm:"type:char(36);primaryKey" json:"role_id"`

	// Relationships
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Role Role `gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE" json:"role"`
}

// Permission categories
const (
	PermissionCategoryCustomer     = "customer"
	PermissionCategoryInvoice      = "invoice"
	PermissionCategoryPayment      = "payment"
	PermissionCategoryWaterUsage   = "water_usage"
	PermissionCategorySubscription = "subscription"
	PermissionCategoryReport       = "report"
	PermissionCategorySettings     = "settings"
	PermissionCategoryUser         = "user"
)

// System role names
const (
	RoleAdmin    = "admin"
	RoleOperator = "operator"
	RoleFinance  = "finance"
	RoleReader   = "reader"
	RoleCollector = "collector"
)
