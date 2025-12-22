package responses

import (
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

type PaymentMethodResponse struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	Description   string    `json:"description"`
	Configuration string    `json:"configuration,omitempty"`
	DisplayOrder  int       `json:"display_order"`
	IsActive      bool      `json:"is_active"`
}

type BankAccountResponse struct {
	ID            uuid.UUID `json:"id"`
	BankName      string    `json:"bank_name"`
	AccountNumber string    `json:"account_number"`
	AccountName   string    `json:"account_name"`
	BankBranch    string    `json:"bank_branch,omitempty"`
	SwiftCode     string    `json:"swift_code,omitempty"`
	IsPrimary     bool      `json:"is_primary"`
	IsActive      bool      `json:"is_active"`
	Notes         string    `json:"notes,omitempty"`
}

func ToPaymentMethodResponse(pm *models.PaymentMethod) PaymentMethodResponse {
	return PaymentMethodResponse{
		ID:            pm.ID,
		Name:          pm.Name,
		Type:          pm.Type,
		Description:   pm.Description,
		Configuration: pm.Configuration,
		DisplayOrder:  pm.DisplayOrder,
		IsActive:      pm.IsActive,
	}
}

func ToBankAccountResponse(ba *models.BankAccount) BankAccountResponse {
	return BankAccountResponse{
		ID:            ba.ID,
		BankName:      ba.BankName,
		AccountNumber: ba.AccountNumber,
		AccountName:   ba.AccountName,
		BankBranch:    ba.BankBranch,
		SwiftCode:     ba.SwiftCode,
		IsPrimary:     ba.IsPrimary,
		IsActive:      ba.IsActive,
		Notes:         ba.Notes,
	}
}
