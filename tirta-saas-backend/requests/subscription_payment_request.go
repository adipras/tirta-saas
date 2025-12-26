package requests

import "time"

// SubmitSubscriptionPaymentRequest represents the request to submit a subscription payment
type SubmitSubscriptionPaymentRequest struct {
	SubscriptionPlan string    `json:"subscription_plan" binding:"required,oneof=BASIC PRO ENTERPRISE"`
	BillingPeriod    int       `json:"billing_period" binding:"required,min=1,max=12"`
	Amount           float64   `json:"amount" binding:"required,gt=0"`
	PaymentDate      time.Time `json:"payment_date" binding:"required"`
	PaymentMethod    string    `json:"payment_method" binding:"required"`
	AccountNumber    string    `json:"account_number"`
	AccountName      string    `json:"account_name" binding:"required"`
	ReferenceNumber  string    `json:"reference_number"`
	Notes            string    `json:"notes"`
}

// VerifySubscriptionPaymentRequest represents the request to verify a payment
type VerifySubscriptionPaymentRequest struct {
	Notes string `json:"notes"`
}

// RejectSubscriptionPaymentRequest represents the request to reject a payment
type RejectSubscriptionPaymentRequest struct {
	Reason string `json:"reason" binding:"required"`
}
