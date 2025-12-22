package responses

import "time"

// AuthResponse represents authentication response
type AuthResponse struct {
	Token        string    `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string    `json:"refresh_token,omitempty" example:"refresh_token_here"`
	ExpiresAt    time.Time `json:"expires_at" example:"2024-12-31T23:59:59Z"`
	User         UserBasicInfo `json:"user"`
}

// UserBasicInfo represents basic user information in auth response
type UserBasicInfo struct {
	ID       uint   `json:"id" example:"1"`
	Name     string `json:"name" example:"John Doe"`
	Email    string `json:"email" example:"john@example.com"`
	Role     string `json:"role" example:"tenant_admin"`
	TenantID *uint  `json:"tenant_id,omitempty" example:"1"`
}

// HealthResponse represents health check response
type HealthResponse struct {
	Status  string `json:"status" example:"healthy"`
	Message string `json:"message" example:"API is running"`
	Version string `json:"version,omitempty" example:"1.0.0"`
}

// TenantResponse represents tenant information
type TenantResponse struct {
	ID              uint   `json:"id" example:"1"`
	Name            string `json:"name" example:"PDAM Jakarta"`
	Subdomain       string `json:"subdomain" example:"jakarta"`
	ContactEmail    string `json:"contact_email" example:"admin@pdamjakarta.com"`
	ContactPhone    string `json:"contact_phone" example:"+62812345678"`
	Status          string `json:"status" example:"active"`
	SubscriptionPlan string `json:"subscription_plan,omitempty" example:"premium"`
	CreatedAt       string `json:"created_at" example:"2024-01-15T10:00:00Z"`
}

// WaterRateResponse represents water tariff information
type WaterRateResponse struct {
	ID               uint    `json:"id" example:"1"`
	TenantID         uint    `json:"tenant_id" example:"1"`
	CategoryID       uint    `json:"category_id" example:"1"`
	CategoryName     string  `json:"category_name" example:"Residential"`
	MinUsage         float64 `json:"min_usage" example:"0"`
	MaxUsage         float64 `json:"max_usage" example:"10"`
	PricePerCubicM   float64 `json:"price_per_cubic_m" example:"5000"`
	EffectiveDate    string  `json:"effective_date" example:"2024-01-01"`
	IsActive         bool    `json:"is_active" example:"true"`
}

// BulkInvoiceResponse represents bulk invoice generation response
type BulkInvoiceResponse struct {
	Total     int    `json:"total" example:"150"`
	Success   int    `json:"success" example:"148"`
	Failed    int    `json:"failed" example:"2"`
	Message   string `json:"message" example:"Invoice generation completed"`
}

// GenerateInvoicesRequest represents request to generate invoices
type GenerateInvoicesRequest struct {
	Month int `json:"month" example:"12"`
	Year  int `json:"year" example:"2024"`
}
