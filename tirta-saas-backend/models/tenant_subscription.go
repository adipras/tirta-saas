package models

import (
	"time"

	"github.com/google/uuid"
)

// SubscriptionPlan represents the available subscription plans
type SubscriptionPlan string

const (
	PlanBasic      SubscriptionPlan = "BASIC"
	PlanPremium    SubscriptionPlan = "PREMIUM"
	PlanEnterprise SubscriptionPlan = "ENTERPRISE"
)

// BillingCycle represents the billing frequency
type BillingCycle string

const (
	CycleMonthly BillingCycle = "MONTHLY"
	CycleYearly  BillingCycle = "YEARLY"
)

// SubscriptionStatus represents the status of a subscription
type SubscriptionStatus string

const (
	StatusActive    SubscriptionStatus = "ACTIVE"
	StatusSuspended SubscriptionStatus = "SUSPENDED"
	StatusExpired   SubscriptionStatus = "EXPIRED"
	StatusCancelled SubscriptionStatus = "CANCELLED"
	StatusTrial     SubscriptionStatus = "TRIAL"
)

// TenantSubscription represents a tenant's subscription to the platform
type TenantSubscription struct {
	BaseModel
	TenantID uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`
	
	// Subscription Details
	Plan         SubscriptionPlan   `gorm:"type:varchar(20);not null" json:"plan"`
	Status       SubscriptionStatus `gorm:"type:varchar(20);not null;index" json:"status"`
	BillingCycle BillingCycle       `gorm:"type:varchar(20);not null" json:"billing_cycle"`
	
	// Pricing
	MonthlyPrice float64 `gorm:"type:decimal(15,2);not null" json:"monthly_price"`
	YearlyPrice  float64 `gorm:"type:decimal(15,2)" json:"yearly_price"`
	
	// Feature Limits
	MaxUsers          int `gorm:"default:5" json:"max_users"`
	MaxCustomers      int `gorm:"default:1000" json:"max_customers"`
	MaxStorageGB      int `gorm:"default:10" json:"max_storage_gb"`
	MaxAPICallsPerDay int `gorm:"default:10000" json:"max_api_calls_per_day"`
	
	// Feature Flags (JSON for flexible features)
	EnabledFeatures string `gorm:"type:json" json:"enabled_features"`
	
	// Billing Dates
	StartDate      time.Time  `json:"start_date"`
	EndDate        time.Time  `json:"end_date"`
	NextBillingAt  *time.Time `json:"next_billing_at,omitempty"`
	LastBilledAt   *time.Time `json:"last_billed_at,omitempty"`
	TrialEndsAt    *time.Time `json:"trial_ends_at,omitempty"`
	
	// Payment Tracking
	LastPaymentAmount float64    `gorm:"type:decimal(15,2)" json:"last_payment_amount"`
	LastPaymentDate   *time.Time `json:"last_payment_date,omitempty"`
	PaymentStatus     string     `gorm:"type:varchar(20);default:'PENDING'" json:"payment_status"`
	
	// Cancellation
	CancelledAt     *time.Time `json:"cancelled_at,omitempty"`
	CancellationReason string  `gorm:"type:text" json:"cancellation_reason,omitempty"`
	
	// Notes
	Notes string `gorm:"type:text" json:"notes"`
	
	// Relations
	Tenant Tenant `gorm:"foreignKey:TenantID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

// SubscriptionPlanDetails defines the features and limits for each plan
type SubscriptionPlanDetails struct {
	BaseModel
	Plan        SubscriptionPlan `gorm:"type:varchar(20);not null;uniqueIndex" json:"plan"`
	Name        string           `gorm:"type:varchar(50);not null" json:"name"`
	Description string           `gorm:"type:text" json:"description"`
	
	// Pricing
	MonthlyPrice float64 `gorm:"type:decimal(15,2);not null" json:"monthly_price"`
	YearlyPrice  float64 `gorm:"type:decimal(15,2);not null" json:"yearly_price"`
	
	// Default Limits
	MaxUsers          int `json:"max_users"`
	MaxCustomers      int `json:"max_customers"`
	MaxStorageGB      int `json:"max_storage_gb"`
	MaxAPICallsPerDay int `json:"max_api_calls_per_day"`
	
	// Features (JSON array)
	Features string `gorm:"type:json" json:"features"`
	
	// Display Order
	DisplayOrder int  `json:"display_order"`
	IsActive     bool `gorm:"default:true" json:"is_active"`
	
	// Trial Configuration
	TrialDays int `gorm:"default:0" json:"trial_days"`
}
