package responses

import (
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

// TenantRegistrationResponse represents successful registration response
type TenantRegistrationResponse struct {
	Status  string                  `json:"status"`
	Message string                  `json:"message"`
	Tenant  TenantRegistrationInfo  `json:"tenant"`
}

// TenantRegistrationInfo contains tenant info after registration
type TenantRegistrationInfo struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Status       string    `json:"status"`
	TrialEndsAt  *time.Time `json:"trial_ends_at,omitempty"`
	AdminEmail   string    `json:"admin_email"`
}

// PendingTenantResponse represents a pending tenant
type PendingTenantResponse struct {
	ID              uuid.UUID  `json:"id"`
	Name            string     `json:"name"`
	VillageCode     string     `json:"village_code"`
	Email           string     `json:"email"`
	Phone           string     `json:"phone"`
	Address         string     `json:"address"`
	AdminName       string     `json:"admin_name"`
	AdminEmail      string     `json:"admin_email"`
	AdminPhone      string     `json:"admin_phone"`
	Status          string     `json:"status"`
	RegisteredAt    time.Time  `json:"registered_at"`
	TrialEndsAt     *time.Time `json:"trial_ends_at,omitempty"`
	PaymentProofURL string     `json:"payment_proof_url,omitempty"`
	TotalUsers      int        `json:"total_users"`
	TotalCustomers  int        `json:"total_customers"`
}

// PendingTenantsListResponse represents list of pending tenants
type PendingTenantsListResponse struct {
	Status  string                  `json:"status"`
	Data    []PendingTenantResponse `json:"data"`
	Total   int                     `json:"total"`
	Page    int                     `json:"page"`
	PerPage int                     `json:"per_page"`
}

// TenantActionResponse represents result of approve/reject/suspend action
type TenantActionResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Tenant  struct {
		ID     uuid.UUID          `json:"id"`
		Name   string             `json:"name"`
		Status models.TenantStatus `json:"status"`
	} `json:"tenant"`
}
