package requests

import "github.com/google/uuid"

// MeterInput represents one meter to be registered for a customer.
type MeterInput struct {
	MeterNumber        string    `json:"meter_number" binding:"required"`
	SubscriptionTypeID uuid.UUID `json:"subscription_type_id" binding:"required"`
	InstallDate        string    `json:"install_date" binding:"required"` // YYYY-MM-DD
	InitialReading     float64   `json:"initial_reading"`
	LocationName       string    `json:"location_name,omitempty"`
	Brand              string    `json:"brand,omitempty"`
	Model              string    `json:"model,omitempty"`
	Notes              string    `json:"notes,omitempty"`
}

// CreateCustomerRequest is the new request body for POST /api/customers.
// Meters array is mandatory — minimum 1 element.
type CreateCustomerRequest struct {
	Name           string      `json:"name" binding:"required"`
	Email          string      `json:"email,omitempty" binding:"omitempty,email"`
	Password       string      `json:"password" binding:"required,min=6"`
	Phone          string      `json:"phone,omitempty"`
	Address        string      `json:"address,omitempty"`
	ServiceAreaID  *uuid.UUID  `json:"service_area_id,omitempty"`
	ReadingRouteID *uuid.UUID  `json:"reading_route_id,omitempty"`
	Meters         []MeterInput `json:"meters" binding:"required,min=1,dive"`
}

// AddMeterRequest is the request body for POST /api/customers/:id/meters.
type AddMeterRequest struct {
	MeterNumber        string    `json:"meter_number" binding:"required"`
	SubscriptionTypeID uuid.UUID `json:"subscription_type_id" binding:"required"`
	InstallDate        string    `json:"install_date" binding:"required"` // YYYY-MM-DD
	InitialReading     float64   `json:"initial_reading"`
	LocationName       string    `json:"location_name,omitempty"`
	Brand              string    `json:"brand,omitempty"`
	Model              string    `json:"model,omitempty"`
	Notes              string    `json:"notes,omitempty"`
}

type UpdateCustomerRequest struct {
	Name           string     `json:"name" binding:"required"`
	Phone          string     `json:"phone,omitempty"`
	Address        string     `json:"address,omitempty"`
	ServiceAreaID  *uuid.UUID `json:"service_area_id,omitempty"`
	ReadingRouteID *uuid.UUID `json:"reading_route_id,omitempty"`
}
