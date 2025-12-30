package responses

// PlatformPaymentSettingsResponse represents platform payment settings for subscription payments
type PlatformPaymentSettingsResponse struct {
	BankAccounts   []BankAccountInfo `json:"bank_accounts"`
	PaymentMethods []string          `json:"payment_methods"`
	CompanyName    string            `json:"company_name,omitempty"`
	Phone          string            `json:"phone,omitempty"`
	Email          string            `json:"email,omitempty"`
}

// BankAccountInfo represents a bank account for payments
type BankAccountInfo struct {
	BankName      string `json:"bank_name"`
	AccountNumber string `json:"account_number"`
	AccountName   string `json:"account_name"`
}
