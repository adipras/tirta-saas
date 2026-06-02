package responses

import (
	"github.com/google/uuid"
	"time"
)

type CustomerResponse struct {
	ID               uuid.UUID                 `json:"id" format:"uuid" doc:"Customer unique ID" example:"123e4567-e89b-12d3-a456-426614174000"`
	Name             string                    `json:"name" doc:"Customer full name" example:"John Doe"`
	Email            string                    `json:"email,omitempty" format:"email" doc:"Email address" example:"john@example.com"`
	Phone            string                    `json:"phone,omitempty" doc:"Phone number" example:"081234567890"`
	Address          string                    `json:"address,omitempty" doc:"Full address" example:"Jl. Merdeka No. 123"`
	SubscriptionID   uuid.UUID                 `json:"subscription_id" format:"uuid" doc:"Subscription type ID" example:"123e4567-e89b-12d3-a456-426614174000"`
	Subscription     *SubscriptionTypeResponse `json:"subscription,omitempty" doc:"Subscription type details"`
	ServiceAreaID    *uuid.UUID                `json:"service_area_id,omitempty" format:"uuid" doc:"Service area ID"`
	ServiceAreaName  string                    `json:"service_area_name,omitempty" doc:"Service area name"`
	ReadingRouteID   *uuid.UUID                `json:"reading_route_id,omitempty" format:"uuid" doc:"Reading route ID"`
	ReadingRouteName string                    `json:"reading_route_name,omitempty" doc:"Reading route name"`
	IsActive         bool                      `json:"is_active" doc:"Active status" example:"true"`
	CreatedAt        time.Time                 `json:"created_at" format:"date-time" doc:"Registration date" example:"2025-01-01T00:00:00Z"`
}

type CustomerListResponse struct {
	Customers []CustomerResponse `json:"customers" doc:"List of customers"`
	Total     int                `json:"total" doc:"Total number of customers" example:"150"`
}
