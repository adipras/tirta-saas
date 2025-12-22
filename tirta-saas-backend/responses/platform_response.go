package responses

import (
	"time"

	"github.com/google/uuid"
)

// TenantListResponse represents a tenant in list view
type TenantListResponse struct {
	ID                 uuid.UUID  `json:"id"`
	Name               string     `json:"name"`
	VillageCode        string     `json:"village_code"`
	Email              string     `json:"email"`
	Phone              string     `json:"phone"`
	Status             string     `json:"status"`
	SubscriptionPlan   string     `json:"subscription_plan"`
	SubscriptionStatus string     `json:"subscription_status"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at"`
	TotalUsers         int        `json:"total_users"`
	TotalCustomers     int        `json:"total_customers"`
	StorageUsedGB      float64    `json:"storage_used_gb"`
	CreatedAt          time.Time  `json:"created_at"`
}

// TenantDetailResponse represents detailed tenant information
type TenantDetailResponse struct {
	ID                 uuid.UUID  `json:"id"`
	Name               string     `json:"name"`
	VillageCode        string     `json:"village_code"`
	Email              string     `json:"email"`
	Phone              string     `json:"phone"`
	Address            string     `json:"address"`
	Status             string     `json:"status"`
	SubscriptionPlan   string     `json:"subscription_plan"`
	SubscriptionStatus string     `json:"subscription_status"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at"`
	TotalUsers         int        `json:"total_users"`
	TotalCustomers     int        `json:"total_customers"`
	StorageUsedGB      float64    `json:"storage_used_gb"`
	SuspendedAt        *time.Time `json:"suspended_at,omitempty"`
	SuspensionReason   string     `json:"suspension_reason,omitempty"`
	Notes              string     `json:"notes"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// TenantStatisticsResponse represents tenant usage statistics
type TenantStatisticsResponse struct {
	TenantID       uuid.UUID `json:"tenant_id"`
	TenantName     string    `json:"tenant_name"`
	
	// User Statistics
	TotalUsers     int `json:"total_users"`
	ActiveUsers    int `json:"active_users"`
	
	// Customer Statistics
	TotalCustomers   int `json:"total_customers"`
	ActiveCustomers  int `json:"active_customers"`
	InactiveCustomers int `json:"inactive_customers"`
	
	// Billing Statistics
	TotalInvoices        int     `json:"total_invoices"`
	PaidInvoices         int     `json:"paid_invoices"`
	UnpaidInvoices       int     `json:"unpaid_invoices"`
	TotalRevenue         float64 `json:"total_revenue"`
	OutstandingAmount    float64 `json:"outstanding_amount"`
	
	// Usage Statistics
	TotalWaterUsage      float64 `json:"total_water_usage_m3"`
	AverageUsagePerCustomer float64 `json:"avg_usage_per_customer_m3"`
	
	// Storage Statistics
	StorageUsedGB    float64 `json:"storage_used_gb"`
	StorageLimitGB   int     `json:"storage_limit_gb"`
	
	// API Statistics
	APICallsToday    int `json:"api_calls_today"`
	APICallsLimit    int `json:"api_calls_limit"`
	
	// Dates
	LastActivityAt   *time.Time `json:"last_activity_at"`
	StatisticsAsOf   time.Time  `json:"statistics_as_of"`
}

// SubscriptionPlanResponse represents a subscription plan
type SubscriptionPlanResponse struct {
	ID                uuid.UUID `json:"id"`
	Plan              string    `json:"plan"`
	Name              string    `json:"name"`
	Description       string    `json:"description"`
	MonthlyPrice      float64   `json:"monthly_price"`
	YearlyPrice       float64   `json:"yearly_price"`
	MaxUsers          int       `json:"max_users"`
	MaxCustomers      int       `json:"max_customers"`
	MaxStorageGB      int       `json:"max_storage_gb"`
	MaxAPICallsPerDay int       `json:"max_api_calls_per_day"`
	Features          []string  `json:"features"`
	TrialDays         int       `json:"trial_days"`
	DisplayOrder      int       `json:"display_order"`
	IsActive          bool      `json:"is_active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// TenantSubscriptionResponse represents a tenant's subscription
type TenantSubscriptionResponse struct {
	ID                uuid.UUID  `json:"id"`
	TenantID          uuid.UUID  `json:"tenant_id"`
	Plan              string     `json:"plan"`
	Status            string     `json:"status"`
	BillingCycle      string     `json:"billing_cycle"`
	MonthlyPrice      float64    `json:"monthly_price"`
	YearlyPrice       float64    `json:"yearly_price"`
	MaxUsers          int        `json:"max_users"`
	MaxCustomers      int        `json:"max_customers"`
	MaxStorageGB      int        `json:"max_storage_gb"`
	MaxAPICallsPerDay int        `json:"max_api_calls_per_day"`
	StartDate         time.Time  `json:"start_date"`
	EndDate           time.Time  `json:"end_date"`
	NextBillingAt     *time.Time `json:"next_billing_at"`
	LastBilledAt      *time.Time `json:"last_billed_at"`
	TrialEndsAt       *time.Time `json:"trial_ends_at"`
	LastPaymentAmount float64    `json:"last_payment_amount"`
	LastPaymentDate   *time.Time `json:"last_payment_date"`
	PaymentStatus     string     `json:"payment_status"`
	Notes             string     `json:"notes"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// PlatformAnalyticsOverviewResponse represents platform overview statistics
type PlatformAnalyticsOverviewResponse struct {
	// Tenant Statistics
	TotalTenants     int `json:"total_tenants"`
	ActiveTenants    int `json:"active_tenants"`
	SuspendedTenants int `json:"suspended_tenants"`
	TrialTenants     int `json:"trial_tenants"`
	
	// Revenue Statistics
	TotalRevenue       float64 `json:"total_revenue"`
	MonthlyRevenue     float64 `json:"monthly_revenue"`
	OutstandingRevenue float64 `json:"outstanding_revenue"`
	
	// Growth Statistics
	NewTenantsThisMonth    int     `json:"new_tenants_this_month"`
	ChurnedTenantsThisMonth int    `json:"churned_tenants_this_month"`
	GrowthRate             float64 `json:"growth_rate_percent"`
	
	// Usage Statistics
	TotalUsers         int     `json:"total_users"`
	TotalCustomers     int     `json:"total_customers"`
	TotalStorageUsedGB float64 `json:"total_storage_used_gb"`
	TotalAPICallsToday int     `json:"total_api_calls_today"`
	
	// System Statistics
	AverageResponseTimeMs float64   `json:"avg_response_time_ms"`
	ErrorRate             float64   `json:"error_rate_percent"`
	Uptime                float64   `json:"uptime_percent"`
	LastUpdated           time.Time `json:"last_updated"`
}

// TenantSettingsResponse represents tenant settings
type TenantSettingsResponse struct {
	ID          uuid.UUID `json:"id"`
	TenantID    uuid.UUID `json:"tenant_id"`
	
	// Business Information
	CompanyName string `json:"company_name"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Website     string `json:"website"`
	
	// Branding
	LogoURL        string `json:"logo_url"`
	PrimaryColor   string `json:"primary_color"`
	SecondaryColor string `json:"secondary_color"`
	
	// Invoice Configuration
	InvoicePrefix       string `json:"invoice_prefix"`
	InvoiceNumberFormat string `json:"invoice_number_format"`
	InvoiceDueDays      int    `json:"invoice_due_days"`
	InvoiceFooterText   string `json:"invoice_footer_text"`
	
	// Payment Configuration
	LatePenaltyPercent float64 `json:"late_penalty_percent"`
	LatePenaltyMaxCap  float64 `json:"late_penalty_max_cap"`
	GracePeriodDays    int     `json:"grace_period_days"`
	MinimumBillAmount  float64 `json:"minimum_bill_amount"`
	PaymentMethods     []string `json:"payment_methods"`
	
	// Bank Account
	BankName        string `json:"bank_name"`
	BankAccountName string `json:"bank_account_name"`
	BankAccountNo   string `json:"bank_account_no"`
	
	// Operational Settings
	OperatingHours string `json:"operating_hours"`
	ServiceArea    string `json:"service_area"`
	TimeZone       string `json:"timezone"`
	Language       string `json:"language"`
	Currency       string `json:"currency"`
	
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NotificationTemplateResponse represents a notification template
type NotificationTemplateResponse struct {
	ID          uuid.UUID `json:"id"`
	TenantID    uuid.UUID `json:"tenant_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Channel     string    `json:"channel"`
	Subject     string    `json:"subject,omitempty"`
	Body        string    `json:"body"`
	HTMLBody    string    `json:"html_body,omitempty"`
	Variables   []string  `json:"variables"`
	IsActive    bool      `json:"is_active"`
	Language    string    `json:"language"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// NotificationLogResponse represents a notification log entry
type NotificationLogResponse struct {
	ID            uuid.UUID  `json:"id"`
	TenantID      uuid.UUID  `json:"tenant_id"`
	TemplateID    *uuid.UUID `json:"template_id,omitempty"`
	RecipientType string     `json:"recipient_type"`
	RecipientID   uuid.UUID  `json:"recipient_id"`
	RecipientName string     `json:"recipient_name"`
	Channel       string     `json:"channel"`
	Destination   string     `json:"destination"`
	Subject       string     `json:"subject,omitempty"`
	Status        string     `json:"status"`
	SentAt        *time.Time `json:"sent_at,omitempty"`
	DeliveredAt   *time.Time `json:"delivered_at,omitempty"`
	FailedAt      *time.Time `json:"failed_at,omitempty"`
	ErrorMessage  string     `json:"error_message,omitempty"`
	RetryCount    int        `json:"retry_count"`
	CreatedAt     time.Time  `json:"created_at"`
}

// BulkOperationResponse represents result of bulk operation
type BulkOperationResponse struct {
	TotalRecords     int      `json:"total_records"`
	SuccessCount     int      `json:"success_count"`
	FailureCount     int      `json:"failure_count"`
	SkippedCount     int      `json:"skipped_count"`
	Errors           []string `json:"errors,omitempty"`
	ProcessedAt      time.Time `json:"processed_at"`
	DurationMs       int64    `json:"duration_ms"`
}

// TenantGrowthAnalyticsResponse represents tenant growth analytics
type TenantGrowthAnalyticsResponse struct {
	Period              string                  `json:"period"`
	TotalTenants        int                     `json:"total_tenants"`
	ActiveTenants       int                     `json:"active_tenants"`
	NewTenants          int                     `json:"new_tenants"`
	ChurnedTenants      int                     `json:"churned_tenants"`
	GrowthRate          float64                 `json:"growth_rate_percent"`
	ChurnRate           float64                 `json:"churn_rate_percent"`
	MonthlyBreakdown    []MonthlyTenantStats    `json:"monthly_breakdown"`
	TenantsByPlan       map[string]int          `json:"tenants_by_plan"`
	TenantsByStatus     map[string]int          `json:"tenants_by_status"`
}

// MonthlyTenantStats represents monthly tenant statistics
type MonthlyTenantStats struct {
	Month          string  `json:"month"`
	Year           int     `json:"year"`
	NewTenants     int     `json:"new_tenants"`
	ChurnedTenants int     `json:"churned_tenants"`
	TotalTenants   int     `json:"total_tenants"`
	GrowthRate     float64 `json:"growth_rate_percent"`
}

// RevenueAnalyticsResponse represents revenue analytics
type RevenueAnalyticsResponse struct {
	Period                  string              `json:"period"`
	TotalRevenue            float64             `json:"total_revenue"`
	MonthlyRecurringRevenue float64             `json:"monthly_recurring_revenue"`
	AverageRevenuePerTenant float64             `json:"avg_revenue_per_tenant"`
	OutstandingRevenue      float64             `json:"outstanding_revenue"`
	MonthlyBreakdown        []MonthlyRevenueStats `json:"monthly_breakdown"`
	RevenueByPlan           map[string]float64  `json:"revenue_by_plan"`
	PaymentMethodStats      map[string]int      `json:"payment_method_stats"`
}

// MonthlyRevenueStats represents monthly revenue statistics
type MonthlyRevenueStats struct {
	Month         string  `json:"month"`
	Year          int     `json:"year"`
	Revenue       float64 `json:"revenue"`
	Invoices      int     `json:"invoices"`
	PaidInvoices  int     `json:"paid_invoices"`
	GrowthRate    float64 `json:"growth_rate_percent"`
}

// UsageAnalyticsResponse represents system usage analytics
type UsageAnalyticsResponse struct {
	Period                  string                  `json:"period"`
	TotalUsers              int                     `json:"total_users"`
	ActiveUsers             int                     `json:"active_users"`
	TotalCustomers          int                     `json:"total_customers"`
	TotalWaterUsageM3       float64                 `json:"total_water_usage_m3"`
	TotalInvoices           int                     `json:"total_invoices"`
	TotalPayments           int                     `json:"total_payments"`
	StorageUsedGB           float64                 `json:"storage_used_gb"`
	APICallsTotal           int64                   `json:"api_calls_total"`
	MonthlyUsageBreakdown   []MonthlyUsageStats     `json:"monthly_usage_breakdown"`
	TopTenantsByUsage       []TenantUsageStats      `json:"top_tenants_by_usage"`
}

// MonthlyUsageStats represents monthly usage statistics
type MonthlyUsageStats struct {
	Month             string  `json:"month"`
	Year              int     `json:"year"`
	WaterUsageM3      float64 `json:"water_usage_m3"`
	InvoicesIssued    int     `json:"invoices_issued"`
	PaymentsReceived  int     `json:"payments_received"`
	APICallsCount     int64   `json:"api_calls_count"`
}

// TenantUsageStats represents tenant usage statistics
type TenantUsageStats struct {
	TenantID      uuid.UUID `json:"tenant_id"`
	TenantName    string    `json:"tenant_name"`
	Customers     int       `json:"customers"`
	WaterUsageM3  float64   `json:"water_usage_m3"`
	Revenue       float64   `json:"revenue"`
	StorageUsedGB float64   `json:"storage_used_gb"`
}

