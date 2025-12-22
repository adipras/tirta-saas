package requests

// LoginRequest represents login credentials
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"admin@example.com"`
	Password string `json:"password" binding:"required,min=8" example:"password123"`
}

// CreateTenantRequest represents request to create a new tenant
type CreateTenantRequest struct {
	Name          string `json:"name" binding:"required" example:"PDAM Jakarta"`
	Subdomain     string `json:"subdomain" binding:"required" example:"jakarta"`
	ContactEmail  string `json:"contact_email" binding:"required,email" example:"admin@pdamjakarta.com"`
	ContactPhone  string `json:"contact_phone" binding:"required" example:"+62812345678"`
	Address       string `json:"address" example:"Jl. Sudirman No. 123"`
	AdminName     string `json:"admin_name" binding:"required" example:"John Doe"`
	AdminEmail    string `json:"admin_email" binding:"required,email" example:"john@pdamjakarta.com"`
	AdminPassword string `json:"admin_password" binding:"required,min=8" example:"securepass123"`
}

// CreateWaterRateRequest represents request to create water tariff
type CreateWaterRateRequest struct {
	CategoryID     uint    `json:"category_id" binding:"required" example:"1"`
	MinUsage       float64 `json:"min_usage" binding:"required" example:"0"`
	MaxUsage       float64 `json:"max_usage" example:"10"`
	PricePerCubicM float64 `json:"price_per_cubic_m" binding:"required" example:"5000"`
	EffectiveDate  string  `json:"effective_date" binding:"required" example:"2024-01-01"`
}

// GenerateInvoicesRequest represents request to generate invoices
type GenerateInvoicesRequest struct {
	Month int `json:"month" binding:"required,min=1,max=12" example:"12"`
	Year  int `json:"year" binding:"required,min=2020" example:"2024"`
}
