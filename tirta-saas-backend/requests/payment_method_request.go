package requests

type CreatePaymentMethodRequest struct {
	Name          string `json:"name" binding:"required"`
	Type          string `json:"type" binding:"required,oneof=cash bank_transfer e_wallet card qris"`
	Description   string `json:"description"`
	Configuration string `json:"configuration"`
	DisplayOrder  int    `json:"display_order"`
}

type UpdatePaymentMethodRequest struct {
	Name          string `json:"name" binding:"required"`
	Description   string `json:"description"`
	Configuration string `json:"configuration"`
	DisplayOrder  int    `json:"display_order"`
	IsActive      *bool  `json:"is_active"`
}

type CreateBankAccountRequest struct {
	BankName      string `json:"bank_name" binding:"required"`
	AccountNumber string `json:"account_number" binding:"required"`
	AccountName   string `json:"account_name" binding:"required"`
	BankBranch    string `json:"bank_branch"`
	SwiftCode     string `json:"swift_code"`
	Notes         string `json:"notes"`
	IsPrimary     bool   `json:"is_primary"`
}

type UpdateBankAccountRequest struct {
	BankName      string `json:"bank_name" binding:"required"`
	AccountNumber string `json:"account_number" binding:"required"`
	AccountName   string `json:"account_name" binding:"required"`
	BankBranch    string `json:"bank_branch"`
	SwiftCode     string `json:"swift_code"`
	Notes         string `json:"notes"`
	IsActive      *bool  `json:"is_active"`
}

type CreateQRCodeRequest struct {
	Type      string `form:"type" binding:"required,oneof=QRIS DANA GOPAY OVO SHOPEEPAY"`
	IsPrimary bool   `form:"is_primary"`
	IsActive  bool   `form:"is_active"`
	Notes     string `form:"notes"`
}

type UpdateQRCodeRequest struct {
	Type      string `form:"type" binding:"required,oneof=QRIS DANA GOPAY OVO SHOPEEPAY"`
	IsPrimary bool   `form:"is_primary"`
	IsActive  *bool  `form:"is_active"`
	Notes     string `form:"notes"`
}
