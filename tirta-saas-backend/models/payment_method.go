package models

import (
	"github.com/google/uuid"
)

type PaymentMethod struct {
	BaseModel
	TenantID    uuid.UUID `gorm:"type:char(36);not null;index:idx_tenant_payment_method" json:"tenant_id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Type        string    `gorm:"type:varchar(50);not null" json:"type"` // cash, bank_transfer, e_wallet
	Description string    `gorm:"type:text" json:"description"`
	IsActive    bool      `gorm:"default:true;not null" json:"is_active"`
	
	// Payment specific fields (JSON for flexibility)
	Configuration string `gorm:"type:json" json:"configuration"`
	
	// Display order
	DisplayOrder int `gorm:"default:0" json:"display_order"`

	// Relationships
	Tenant   Tenant    `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Payments []Payment `gorm:"foreignKey:PaymentMethodID" json:"-"`
}

type BankAccount struct {
	BaseModel
	TenantID      uuid.UUID `gorm:"type:char(36);not null;index:idx_tenant_bank_account" json:"tenant_id"`
	BankName      string    `gorm:"type:varchar(100);not null" json:"bank_name"`
	AccountNumber string    `gorm:"type:varchar(50);not null" json:"account_number"`
	AccountName   string    `gorm:"type:varchar(150);not null" json:"account_name"`
	BankBranch    string    `gorm:"type:varchar(100)" json:"bank_branch"`
	IsPrimary     bool      `gorm:"default:false;not null" json:"is_primary"`
	IsActive      bool      `gorm:"default:true;not null" json:"is_active"`
	
	// Additional info
	SwiftCode string `gorm:"type:varchar(20)" json:"swift_code"`
	Notes     string `gorm:"type:text" json:"notes"`

	// Relationships
	Tenant Tenant `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
}

// Payment method types
const (
	PaymentMethodTypeCash         = "cash"
	PaymentMethodTypeBankTransfer = "bank_transfer"
	PaymentMethodTypeEWallet      = "e_wallet"
	PaymentMethodTypeCard         = "card"
	PaymentMethodTypeQRIS         = "qris"
)
