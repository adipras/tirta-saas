package requests

import "github.com/google/uuid"

// UpdateTenantRequest represents request to update tenant information
type UpdateTenantRequest struct {
	Name             string  `json:"name" binding:"omitempty,min=3,max=100"`
	Email            string  `json:"email" binding:"omitempty,email"`
	Phone            string  `json:"phone" binding:"omitempty,max=20"`
	Address          string  `json:"address"`
	Notes            string  `json:"notes"`
	SubscriptionPlan string  `json:"subscription_plan" binding:"omitempty,oneof=BASIC PREMIUM ENTERPRISE"`
}

// SuspendTenantRequest represents request to suspend a tenant
type SuspendTenantRequest struct {
	Reason string `json:"reason" binding:"required,min=10,max=500"`
}

// CreateSubscriptionPlanRequest represents request to create a subscription plan
type CreateSubscriptionPlanRequest struct {
	Plan          string   `json:"plan" binding:"required,oneof=BASIC PREMIUM ENTERPRISE"`
	Name          string   `json:"name" binding:"required,min=3,max=50"`
	Description   string   `json:"description"`
	MonthlyPrice  float64  `json:"monthly_price" binding:"required,min=0"`
	YearlyPrice   float64  `json:"yearly_price" binding:"required,min=0"`
	MaxUsers      int      `json:"max_users" binding:"required,min=1"`
	MaxCustomers  int      `json:"max_customers" binding:"required,min=1"`
	MaxStorageGB  int      `json:"max_storage_gb" binding:"required,min=1"`
	MaxAPICallsPerDay int  `json:"max_api_calls_per_day" binding:"required,min=1"`
	Features      []string `json:"features"`
	TrialDays     int      `json:"trial_days" binding:"min=0"`
	DisplayOrder  int      `json:"display_order"`
}

// UpdateSubscriptionPlanRequest represents request to update a subscription plan
type UpdateSubscriptionPlanRequest struct {
	Name          string   `json:"name" binding:"omitempty,min=3,max=50"`
	Description   string   `json:"description"`
	MonthlyPrice  float64  `json:"monthly_price" binding:"omitempty,min=0"`
	YearlyPrice   float64  `json:"yearly_price" binding:"omitempty,min=0"`
	MaxUsers      int      `json:"max_users" binding:"omitempty,min=1"`
	MaxCustomers  int      `json:"max_customers" binding:"omitempty,min=1"`
	MaxStorageGB  int      `json:"max_storage_gb" binding:"omitempty,min=1"`
	MaxAPICallsPerDay int  `json:"max_api_calls_per_day" binding:"omitempty,min=1"`
	Features      []string `json:"features"`
	TrialDays     int      `json:"trial_days" binding:"omitempty,min=0"`
	DisplayOrder  int      `json:"display_order"`
	IsActive      *bool    `json:"is_active"`
}

// AssignSubscriptionRequest represents request to assign subscription to tenant
type AssignSubscriptionRequest struct {
	Plan         string `json:"plan" binding:"required,oneof=BASIC PREMIUM ENTERPRISE"`
	BillingCycle string `json:"billing_cycle" binding:"required,oneof=MONTHLY YEARLY"`
	StartDate    string `json:"start_date"` // ISO date format
	TrialDays    int    `json:"trial_days" binding:"min=0"`
}

// TenantSearchRequest represents search filters for tenants
type TenantSearchRequest struct {
	Search           string `form:"search"`
	Status           string `form:"status" binding:"omitempty,oneof=ACTIVE SUSPENDED INACTIVE"`
	SubscriptionPlan string `form:"subscription_plan" binding:"omitempty,oneof=BASIC PREMIUM ENTERPRISE"`
	Page             int    `form:"page" binding:"min=1"`
	PageSize         int    `form:"page_size" binding:"min=1,max=100"`
	SortBy           string `form:"sort_by" binding:"omitempty,oneof=name created_at total_customers"`
	SortOrder        string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
}

// UpdateTenantSettingsRequest represents request to update tenant settings
type UpdateTenantSettingsRequest struct {
	// Business Information
	CompanyName string `json:"company_name" binding:"omitempty,max=200"`
	Address     string `json:"address"`
	Phone       string `json:"phone" binding:"omitempty,max=20"`
	Email       string `json:"email" binding:"omitempty,email"`
	Website     string `json:"website" binding:"omitempty,url"`
	
	// Branding
	PrimaryColor   string `json:"primary_color" binding:"omitempty,hexcolor"`
	SecondaryColor string `json:"secondary_color" binding:"omitempty,hexcolor"`
	
	// Invoice Configuration
	InvoicePrefix       string `json:"invoice_prefix" binding:"omitempty,max=10"`
	InvoiceDueDays      int    `json:"invoice_due_days" binding:"omitempty,min=1,max=90"`
	InvoiceFooterText   string `json:"invoice_footer_text"`
	
	// Payment Configuration
	LatePenaltyPercent float64 `json:"late_penalty_percent" binding:"omitempty,min=0,max=100"`
	LatePenaltyMaxCap  float64 `json:"late_penalty_max_cap" binding:"omitempty,min=0"`
	GracePeriodDays    int     `json:"grace_period_days" binding:"omitempty,min=0,max=30"`
	MinimumBillAmount  float64 `json:"minimum_bill_amount" binding:"omitempty,min=0"`
	
	// Bank Account
	BankName        string `json:"bank_name"`
	BankAccountName string `json:"bank_account_name"`
	BankAccountNo   string `json:"bank_account_no"`
	
	// Operational Settings
	OperatingHours string `json:"operating_hours"`
	ServiceArea    string `json:"service_area"`
	TimeZone       string `json:"timezone"`
	Language       string `json:"language" binding:"omitempty,oneof=id en"`
}

// BulkCustomerImportRequest represents request for bulk customer import
type BulkCustomerImportRequest struct {
	SkipErrors bool `json:"skip_errors"` // Continue on errors
}

// CreateNotificationTemplateRequest represents request to create notification template
type CreateNotificationTemplateRequest struct {
	Code        string   `json:"code" binding:"required,min=3,max=50,alphanum"`
	Name        string   `json:"name" binding:"required,min=3,max=100"`
	Description string   `json:"description"`
	Channel     string   `json:"channel" binding:"required,oneof=EMAIL SMS IN_APP WHATSAPP"`
	Subject     string   `json:"subject" binding:"required_if=Channel EMAIL,max=200"`
	Body        string   `json:"body" binding:"required"`
	HTMLBody    string   `json:"html_body"`
	Variables   []string `json:"variables"`
	Language    string   `json:"language" binding:"omitempty,oneof=id en"`
}

// UpdateNotificationTemplateRequest represents request to update notification template
type UpdateNotificationTemplateRequest struct {
	Name        string   `json:"name" binding:"omitempty,min=3,max=100"`
	Description string   `json:"description"`
	Subject     string   `json:"subject" binding:"omitempty,max=200"`
	Body        string   `json:"body"`
	HTMLBody    string   `json:"html_body"`
	Variables   []string `json:"variables"`
	IsActive    *bool    `json:"is_active"`
	Language    string   `json:"language" binding:"omitempty,oneof=id en"`
}

// SendNotificationRequest represents request to send a notification
type SendNotificationRequest struct {
	TemplateCode  string                 `json:"template_code"`
	Channel       string                 `json:"channel" binding:"required,oneof=EMAIL SMS IN_APP WHATSAPP"`
	RecipientType string                 `json:"recipient_type" binding:"required,oneof=USER CUSTOMER"`
	RecipientID   uuid.UUID              `json:"recipient_id" binding:"required"`
	Variables     map[string]interface{} `json:"variables"`
	CustomSubject string                 `json:"custom_subject"`
	CustomBody    string                 `json:"custom_body"`
}
