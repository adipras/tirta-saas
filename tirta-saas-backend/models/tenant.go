package models

import "time"

// TenantStatus represents the status of a tenant
type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "ACTIVE"
	TenantStatusSuspended TenantStatus = "SUSPENDED"
	TenantStatusInactive  TenantStatus = "INACTIVE"
)

type Tenant struct {
	BaseModel
	Name        string       `gorm:"type:varchar(100);not null" json:"name"`
	VillageCode string       `gorm:"type:varchar(20);not null;unique" json:"village_code"`
	Status      TenantStatus `gorm:"type:varchar(20);default:'ACTIVE';index" json:"status"`
	
	// Contact Information
	Email       string `gorm:"type:varchar(100)" json:"email"`
	Phone       string `gorm:"type:varchar(20)" json:"phone"`
	Address     string `gorm:"type:text" json:"address"`
	
	// Subscription Information
	SubscriptionPlan   string     `gorm:"type:varchar(20)" json:"subscription_plan"`
	SubscriptionStatus string     `gorm:"type:varchar(20)" json:"subscription_status"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at,omitempty"`
	
	// Statistics (updated periodically)
	TotalUsers     int `gorm:"default:0" json:"total_users"`
	TotalCustomers int `gorm:"default:0" json:"total_customers"`
	StorageUsedGB  float64 `gorm:"type:decimal(10,2);default:0" json:"storage_used_gb"`
	
	// Suspension Information
	SuspendedAt     *time.Time `json:"suspended_at,omitempty"`
	SuspensionReason string    `gorm:"type:text" json:"suspension_reason,omitempty"`
	
	// Metadata
	Notes string `gorm:"type:text" json:"notes"`
}
