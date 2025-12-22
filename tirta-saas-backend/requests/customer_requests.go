package requests

import "github.com/google/uuid"

type CreateCustomerRequest struct {
	MeterNumber    string    `json:"meter_number" binding:"required" minLength:"3" maxLength:"20" doc:"Unique water meter number" example:"MTR-001"`
	Name           string    `json:"name" binding:"required" minLength:"3" maxLength:"100" doc:"Full name of the customer" example:"John Doe"`
	Email          string    `json:"email" binding:"required,email" format:"email" doc:"Email address for login and notifications" example:"john.doe@example.com"`
	Password       string    `json:"password" binding:"required,min=6" minLength:"6" maxLength:"100" doc:"Password for customer account (min 6 characters)" example:"SecurePass123!"`
	SubscriptionID uuid.UUID `json:"subscription_id" binding:"required" format:"uuid" doc:"ID of the subscription type/plan" example:"123e4567-e89b-12d3-a456-426614174000"`
	Phone          string    `json:"phone,omitempty" pattern:"^[0-9+\\-\\s()]{10,20}$" doc:"Phone number for contact" example:"081234567890"`
	Address        string    `json:"address,omitempty" maxLength:"500" doc:"Full address of the customer" example:"Jl. Merdeka No. 123, Jakarta"`
}

type UpdateCustomerRequest struct {
	Name           string    `json:"name" binding:"required" minLength:"3" maxLength:"100" doc:"Full name of the customer" example:"John Doe Updated"`
	SubscriptionID uuid.UUID `json:"subscription_id" binding:"required" format:"uuid" doc:"ID of the subscription type/plan" example:"123e4567-e89b-12d3-a456-426614174000"`
	Phone          string    `json:"phone,omitempty" pattern:"^[0-9+\\-\\s()]{10,20}$" doc:"Phone number for contact" example:"081234567890"`
	Address        string    `json:"address,omitempty" maxLength:"500" doc:"Full address of the customer" example:"Jl. Merdeka No. 123, Jakarta Selatan"`
}
