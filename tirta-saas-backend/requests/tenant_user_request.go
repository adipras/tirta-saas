package requests

import "github.com/google/uuid"

type CreateTenantUserRequest struct {
	Name     string     `json:"name" binding:"required,min=3" minLength:"3" maxLength:"100" doc:"Full name of the user" example:"Operator User"`
	Username string     `json:"username" binding:"required,min=3" minLength:"3" maxLength:"100" doc:"Username for login" example:"operator_kampung"`
	Email    string     `json:"email,omitempty" format:"email" doc:"Optional email address for login and notifications" example:"operator@kampung.com"`
	Password string     `json:"password" binding:"required,min=6" minLength:"6" maxLength:"100" doc:"Password for user account" example:"SecurePass123!"`
	Role     string     `json:"role" binding:"required" enum:"ADMIN,OPERATOR,VIEWER" doc:"User role in the system" example:"OPERATOR"`
	TenantID *uuid.UUID `json:"tenant_id,omitempty" format:"uuid" doc:"Tenant ID (only for platform owners)" example:"123e4567-e89b-12d3-a456-426614174000"`
}

type UpdateTenantUserRequest struct {
	Name     string `json:"name,omitempty" minLength:"3" maxLength:"100" doc:"Full name of the user" example:"Updated Name"`
	Username string `json:"username,omitempty" minLength:"3" maxLength:"100" doc:"Username for login" example:"updated_name"`
	Email    string `json:"email,omitempty" format:"email" doc:"Optional email address" example:"newemail@kampung.com"`
	Role     string `json:"role,omitempty" enum:"ADMIN,OPERATOR,VIEWER" doc:"User role" example:"ADMIN"`
	IsActive *bool  `json:"is_active,omitempty" doc:"Active status" example:"true"`
}

type ChangePasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6" minLength:"6" maxLength:"100" doc:"New password" example:"NewSecurePass123!"`
}
