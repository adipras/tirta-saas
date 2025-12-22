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
