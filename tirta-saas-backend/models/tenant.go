package models

import "time"

// TenantStatus represents the status of a tenant
type TenantStatus string

const (
	TenantStatusTrial              TenantStatus = "TRIAL"               // Trial period after registration
	TenantStatusPendingPayment     TenantStatus = "PENDING_PAYMENT"     // Waiting for subscription payment
	TenantStatusPendingVerification TenantStatus = "PENDING_VERIFICATION" // Payment made, waiting for platform owner approval
	TenantStatusActive             TenantStatus = "ACTIVE"              // Fully active tenant
	TenantStatusSuspended          TenantStatus = "SUSPENDED"           // Suspended by platform owner
	TenantStatusExpired            TenantStatus = "EXPIRED"             // Subscription expired
	TenantStatusInactive           TenantStatus = "INACTIVE"            // Deactivated
)

type Tenant struct {
	BaseModel
	Name        string       `gorm:"type:varchar(100);not null" json:"name"`
	VillageCode string       `gorm:"type:varchar(20);not null;unique" json:"village_code"`
	Status      TenantStatus `gorm:"type:varchar(30);default:'TRIAL';index" json:"status"`
	
	// Contact Information
	Email       string `gorm:"type:varchar(100)" json:"email"`
	Phone       string `gorm:"type:varchar(20)" json:"phone"`
	Address     string `gorm:"type:text" json:"address"`
	
	// Registration Information
	AdminName     string `gorm:"type:varchar(100)" json:"admin_name"` // Name of person who registered
	AdminEmail    string `gorm:"type:varchar(100)" json:"admin_email"` // Email of admin user
	AdminPhone    string `gorm:"type:varchar(20)" json:"admin_phone"`
	RegisteredAt  time.Time `gorm:"autoCreateTime" json:"registered_at"`
	
	// Trial Information
	TrialEndsAt   *time.Time `json:"trial_ends_at,omitempty"`
	
	// Subscription Information
	SubscriptionPlan   string     `gorm:"type:varchar(20)" json:"subscription_plan"`
	SubscriptionStatus string     `gorm:"type:varchar(20)" json:"subscription_status"`
	SubscriptionStartsAt *time.Time `json:"subscription_starts_at,omitempty"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at,omitempty"`
	
	// Payment Information
	PaymentProofURL string `gorm:"type:varchar(500)" json:"payment_proof_url,omitempty"` // URL to uploaded payment proof
	PaymentVerifiedAt *time.Time `json:"payment_verified_at,omitempty"`
	PaymentVerifiedBy *string `json:"payment_verified_by,omitempty"` // Platform owner who verified
	
	// Statistics (updated periodically)
	TotalUsers     int `gorm:"default:0" json:"total_users"`
	TotalCustomers int `gorm:"default:0" json:"total_customers"`
	StorageUsedGB  float64 `gorm:"type:decimal(10,2);default:0" json:"storage_used_gb"`
	
	// Approval Information
	ApprovedAt   *time.Time `json:"approved_at,omitempty"`
	ApprovedBy   *string    `json:"approved_by,omitempty"` // Platform owner who approved
	RejectedAt   *time.Time `json:"rejected_at,omitempty"`
	RejectedBy   *string    `json:"rejected_by,omitempty"`
	RejectionReason string  `gorm:"type:text" json:"rejection_reason,omitempty"`
	
	// Suspension Information
	SuspendedAt     *time.Time `json:"suspended_at,omitempty"`
	SuspensionReason string    `gorm:"type:text" json:"suspension_reason,omitempty"`
	
	// Metadata
	Notes string `gorm:"type:text" json:"notes"`
}
