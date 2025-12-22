package responses

import (
	"time"
	"github.com/google/uuid"
)

type CustomerResponse struct {
	ID             uuid.UUID  `json:"id" format:"uuid" doc:"Customer unique ID" example:"123e4567-e89b-12d3-a456-426614174000"`
	MeterNumber    string     `json:"meter_number" doc:"Water meter number" example:"MTR-001"`
	Name           string     `json:"name" doc:"Customer full name" example:"John Doe"`
	Email          string     `json:"email,omitempty" format:"email" doc:"Email address" example:"john@example.com"`
	Phone          string     `json:"phone,omitempty" doc:"Phone number" example:"081234567890"`
	Address        string     `json:"address,omitempty" doc:"Full address" example:"Jl. Merdeka No. 123"`
	SubscriptionID uuid.UUID  `json:"subscription_id" format:"uuid" doc:"Subscription type ID" example:"123e4567-e89b-12d3-a456-426614174000"`
	IsActive       bool       `json:"is_active" doc:"Active status" example:"true"`
	CreatedAt      time.Time  `json:"created_at" format:"date-time" doc:"Registration date" example:"2025-01-01T00:00:00Z"`
}

type CustomerListResponse struct {
	Customers []CustomerResponse `json:"customers" doc:"List of customers"`
	Total     int                `json:"total" doc:"Total number of customers" example:"150"`
}
