package models

// PlatformBankAccount stores bank account information owned by the platform
// for receiving subscription fee payments from tenants.
type PlatformBankAccount struct {
	BaseModel
	BankName      string `gorm:"type:varchar(100);not null" json:"bank_name"`
	AccountNumber string `gorm:"type:varchar(50);not null" json:"account_number"`
	AccountName   string `gorm:"type:varchar(150);not null" json:"account_name"`
	BankBranch    string `gorm:"type:varchar(100)" json:"bank_branch"`
	SwiftCode     string `gorm:"type:varchar(20)" json:"swift_code"`
	Notes         string `gorm:"type:text" json:"notes"`
	IsPrimary     bool   `gorm:"default:false;not null" json:"is_primary"`
	IsActive      bool   `gorm:"default:true;not null" json:"is_active"`
}

// PlatformQRCode stores QR code images owned by the platform
// for receiving subscription fee payments from tenants via QRIS/e-wallet.
type PlatformQRCode struct {
	BaseModel
	Type      string `gorm:"type:varchar(20);not null" json:"type"` // QRIS, DANA, GOPAY, OVO, SHOPEEPAY
	ImageURL  string `gorm:"type:varchar(500)" json:"image_url"`
	IsPrimary bool   `gorm:"default:false;not null" json:"is_primary"`
	IsActive  bool   `gorm:"default:true;not null" json:"is_active"`
	Notes     string `gorm:"type:text" json:"notes"`
}
