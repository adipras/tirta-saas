package requests

import "github.com/google/uuid"

type CreateTenantUserRequest struct {
	Name     string     `json:"name" binding:"required,min=3" minLength:"3" maxLength:"100" doc:"Full name of the user" example:"Operator User"`
	Email    string     `json:"email" binding:"required,email" format:"email" doc:"Email address for login" example:"operator@kampung.com"`
	Password string     `json:"password" binding:"required,min=6" minLength:"6" maxLength:"100" doc:"Password for user account" example:"SecurePass123!"`
	Role     string     `json:"role" binding:"required" enum:"ADMIN,OPERATOR,VIEWER" doc:"User role in the system" example:"OPERATOR"`
	TenantID *uuid.UUID `json:"tenant_id,omitempty" format:"uuid" doc:"Tenant ID (only for platform owners)" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateTenantUserRequest struct {
	Name     string `json:"name,omitempty" minLength:"3" maxLength:"100" doc:"Full name of the user" example:"Updated Name"`
	Email    string `json:"email,omitempty" format:"email" doc:"Email address" example:"newemail@kampung.com"`
	Role     string `json:"role,omitempty" enum:"ADMIN,OPERATOR,VIEWER" doc:"User role" example:"ADMIN"`
	IsActive *bool  `json:"is_active,omitempty" doc:"Active status" example:"true"`
}

type ChangePasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6" minLength:"6" maxLength:"100" doc:"New password" example:"NewSecurePass123!"`
}