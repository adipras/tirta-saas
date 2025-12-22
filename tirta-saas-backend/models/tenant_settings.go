package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TenantSettings struct {
	BaseModel
	TenantID uuid.UUID `gorm:"type:char(36);not null;uniqueIndex" json:"tenant_id"`
	
	// Business Information
	CompanyName    string  `gorm:"type:varchar(200)" json:"company_name"`
	Address        string  `gorm:"type:text" json:"address"`
	Phone          string  `gorm:"type:varchar(20)" json:"phone"`
	Email          string  `gorm:"type:varchar(100)" json:"email"`
	Website        string  `gorm:"type:varchar(200)" json:"website"`
	
	// Branding
	LogoURL        string  `gorm:"type:varchar(500)" json:"logo_url"`
	PrimaryColor   string  `gorm:"type:varchar(7)" json:"primary_color"`
	SecondaryColor string  `gorm:"type:varchar(7)" json:"secondary_color"`
	
	// Invoice Configuration
	InvoicePrefix       string  `gorm:"type:varchar(10)" json:"invoice_prefix"`
	InvoiceNumberFormat string  `gorm:"type:varchar(50);default:'INV-{YEAR}{MONTH}-{NUMBER}'" json:"invoice_number_format"`
	InvoiceDueDays      int     `gorm:"default:7" json:"invoice_due_days"`
	InvoiceFooterText   string  `gorm:"type:text" json:"invoice_footer_text"`
	
	// Payment Configuration
	LatePenaltyPercent  float64 `gorm:"type:decimal(5,2);default:2.0" json:"late_penalty_percent"`
	LatePenaltyMaxCap   float64 `gorm:"type:decimal(15,2)" json:"late_penalty_max_cap"`
	GracePeriodDays     int     `gorm:"default:3" json:"grace_period_days"`
	MinimumBillAmount   float64 `gorm:"type:decimal(15,2);default:0" json:"minimum_bill_amount"`
	
	// Payment Methods (JSON array of enabled methods) - no default, set in BeforeCreate
	PaymentMethods string `gorm:"type:json" json:"payment_methods"`
	
	// Bank Account Information
	BankName        string `gorm:"type:varchar(100)" json:"bank_name"`
	BankAccountName string `gorm:"type:varchar(200)" json:"bank_account_name"`
	BankAccountNo   string `gorm:"type:varchar(50)" json:"bank_account_no"`
	
	// Operational Settings
	OperatingHours  string `gorm:"type:varchar(100)" json:"operating_hours"`
	ServiceArea     string `gorm:"type:text" json:"service_area"`
	TimeZone        string `gorm:"type:varchar(50);default:'Asia/Jakarta'" json:"timezone"`
	Language        string `gorm:"type:varchar(10);default:'id'" json:"language"`
	Currency        string `gorm:"type:varchar(3);default:'IDR'" json:"currency"`
	
	// Additional Settings (JSON for flexible configuration)
	CustomSettings string `gorm:"type:json" json:"custom_settings"`
	
	// Relations
	Tenant Tenant `gorm:"foreignKey:TenantID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
}

// BeforeCreate sets default values for JSON fields
func (ts *TenantSettings) BeforeCreate(tx *gorm.DB) error {
	// Set default payment methods if empty
	if ts.PaymentMethods == "" {
		ts.PaymentMethods = `["cash","bank_transfer"]`
	}
	
	// Set default custom settings if empty
	if ts.CustomSettings == "" {
		ts.CustomSettings = `{}`
	}
	
	return nil
}
