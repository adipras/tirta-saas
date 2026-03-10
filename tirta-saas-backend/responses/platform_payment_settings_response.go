package responses

// PlatformPaymentSettingsResponse represents platform payment settings for subscription payments
type PlatformPaymentSettingsResponse struct {
	BankAccounts   []BankAccountInfo  `json:"bank_accounts"`
	QRCodes        []QRCodeResponse   `json:"qr_codes"`
	PaymentMethods []string           `json:"payment_methods"`
}

// BankAccountInfo represents a simplified bank account for public payment info
type BankAccountInfo struct {
	BankName      string `json:"bank_name"`
	AccountNumber string `json:"account_number"`
	AccountName   string `json:"account_name"`
}
