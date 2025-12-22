package requests

type CreateUserWithProfileRequest struct {
	Email       string    `json:"email" binding:"required,email"`
	Password    string    `json:"password" binding:"required,min=8"`
	FullName    string    `json:"full_name" binding:"required"`
	PhoneNumber string    `json:"phone_number"`
	Address     string    `json:"address"`
	Position    string    `json:"position"`
	Department  string    `json:"department"`
	RoleIDs     []string  `json:"role_ids" binding:"required,min=1"`
}

type UpdateUserProfileRequest struct {
	FullName    string `json:"full_name" binding:"required"`
	PhoneNumber string `json:"phone_number"`
	Address     string `json:"address"`
	Position    string `json:"position"`
	Department  string `json:"department"`
	Notes       string `json:"notes"`
}

type UpdateUserPermissionsRequest struct {
	RoleIDs []string `json:"role_ids" binding:"required,min=1"`
}

type CreateRoleRequest struct {
	Name          string   `json:"name" binding:"required"`
	DisplayName   string   `json:"display_name" binding:"required"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permission_ids" binding:"required,min=1"`
}

type UpdateRoleRequest struct {
	DisplayName   string   `json:"display_name" binding:"required"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permission_ids" binding:"required,min=1"`
}
