package responses

import (
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

type UserWithProfileResponse struct {
	ID          uuid.UUID             `json:"id"`
	Email       string                `json:"email"`
	CreatedAt   time.Time             `json:"created_at"`
	Profile     *UserProfileResponse  `json:"profile,omitempty"`
	Roles       []RoleResponse        `json:"roles,omitempty"`
	IsActive    bool                  `json:"is_active"`
}

type UserProfileResponse struct {
	FullName    string     `json:"full_name"`
	PhoneNumber string     `json:"phone_number,omitempty"`
	Address     string     `json:"address,omitempty"`
	AvatarURL   string     `json:"avatar_url,omitempty"`
	DateOfBirth *time.Time `json:"date_of_birth,omitempty"`
	Position    string     `json:"position,omitempty"`
	Department  string     `json:"department,omitempty"`
	Notes       string     `json:"notes,omitempty"`
}

type RoleResponse struct {
	ID          uuid.UUID            `json:"id"`
	Name        string               `json:"name"`
	DisplayName string               `json:"display_name"`
	Description string               `json:"description"`
	IsSystem    bool                 `json:"is_system"`
	IsActive    bool                 `json:"is_active"`
	Permissions []PermissionResponse `json:"permissions,omitempty"`
}

type PermissionResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
}

type UserActivityResponse struct {
	ID          uuid.UUID `json:"id"`
	Action      string    `json:"action"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	IPAddress   string    `json:"ip_address"`
	CreatedAt   time.Time `json:"created_at"`
}

type UserSessionResponse struct {
	ID        uuid.UUID `json:"id"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	ExpiresAt time.Time `json:"expires_at"`
	LastUsed  time.Time `json:"last_used"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

func ToUserWithProfileResponse(user *models.User, profile *models.UserProfile, roles []models.Role) UserWithProfileResponse {
	response := UserWithProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
		IsActive:  true,
	}

	if profile != nil {
		response.Profile = &UserProfileResponse{
			FullName:    profile.FullName,
			PhoneNumber: profile.PhoneNumber,
			Address:     profile.Address,
			AvatarURL:   profile.AvatarURL,
			DateOfBirth: profile.DateOfBirth,
			Position:    profile.Position,
			Department:  profile.Department,
			Notes:       profile.Notes,
		}
	}

	if len(roles) > 0 {
		response.Roles = make([]RoleResponse, len(roles))
		for i, role := range roles {
			response.Roles[i] = ToRoleResponse(&role)
		}
	}

	return response
}

func ToRoleResponse(role *models.Role) RoleResponse {
	response := RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		IsSystem:    role.IsSystem,
		IsActive:    role.IsActive,
	}

	if len(role.Permissions) > 0 {
		response.Permissions = make([]PermissionResponse, len(role.Permissions))
		for i, rp := range role.Permissions {
			response.Permissions[i] = PermissionResponse{
				ID:          rp.Permission.ID,
				Name:        rp.Permission.Name,
				DisplayName: rp.Permission.DisplayName,
				Description: rp.Permission.Description,
				Category:    rp.Permission.Category,
			}
		}
	}

	return response
}
