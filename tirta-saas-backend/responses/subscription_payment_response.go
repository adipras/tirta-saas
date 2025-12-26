package responses

import "time"

type SubscriptionPaymentResponse struct {
	ID               string     `json:"id"`
	TenantID         string     `json:"tenant_id"`
	TenantName       string     `json:"tenant_name,omitempty"`
	TenantEmail      string     `json:"tenant_email,omitempty"`
	SubscriptionPlan string     `json:"subscription_plan"`
	BillingPeriod    int        `json:"billing_period"`
	Amount           float64    `json:"amount"`
	PaymentDate      time.Time  `json:"payment_date"`
	PaymentMethod    string     `json:"payment_method"`
	AccountNumber    string     `json:"account_number,omitempty"`
	AccountName      string     `json:"account_name"`
	ReferenceNumber  string     `json:"reference_number,omitempty"`
	ProofURL         string     `json:"proof_url"`
	Notes            string     `json:"notes,omitempty"`
	Status           string     `json:"status"`
	VerifiedAt       *time.Time `json:"verified_at,omitempty"`
	VerifiedBy       *string    `json:"verified_by,omitempty"`
	RejectionReason  string     `json:"rejection_reason,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type SubscriptionPaymentListResponse struct {
	Data       []SubscriptionPaymentResponse `json:"data"`
	Total      int64                         `json:"total"`
	Page       int                           `json:"page"`
	Limit      int                           `json:"limit"`
	TotalPages int                           `json:"total_pages"`
}

type VerifyPaymentResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Tenant  struct {
		ID                   string     `json:"id"`
		Status               string     `json:"status"`
		SubscriptionPlan     string     `json:"subscription_plan"`
		SubscriptionStart    *time.Time `json:"subscription_start"`
		SubscriptionEnd      *time.Time `json:"subscription_end"`
	} `json:"tenant"`
}

type SubmitPaymentResponse struct {
	ID             string `json:"id"`
	ConfirmationID string `json:"confirmation_id"`
	Status         string `json:"status"`
	Message        string `json:"message"`
}

type TenantSubscriptionStatusResponse struct {
	Status            string     `json:"status"`
	SubscriptionPlan  string     `json:"subscription_plan,omitempty"`
	TrialEndDate      *time.Time `json:"trial_end_date,omitempty"`
	SubscriptionStart *time.Time `json:"subscription_start,omitempty"`
	SubscriptionEnd   *time.Time `json:"subscription_end,omitempty"`
	DaysRemaining     int        `json:"days_remaining"`
	PendingPayment    *struct {
		ID          string    `json:"id"`
		Status      string    `json:"status"`
		SubmittedAt time.Time `json:"submitted_at"`
	} `json:"pending_payment,omitempty"`
}
