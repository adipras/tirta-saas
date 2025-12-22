package controllers

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type TenantUserController struct{}

// CreateTenantUser creates a new user for a tenant
// @Summary Create tenant user
// @Description Create a new user for a tenant (admin only)
// @Tags Tenant Users
// @Accept json
// @Produce json
// @Param request body requests.CreateTenantUserRequest true "User data"
// @Success 201 {object} responses.UserResponse
// @Failure 400,403,409 {object} responses.ErrorResponse
// @Router /api/tenant-users [post]
func (tc *TenantUserController) CreateTenantUser(c *gin.Context) {
	var req requests.CreateTenantUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role
	if !constants.IsValidRole(req.Role) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	// Get current user context
	currentUserID := c.MustGet("user_id").(uuid.UUID)
	currentRole := constants.UserRole(c.MustGet("role").(string))
	
	// Platform owners can create users for any tenant
	var tenantID *uuid.UUID
	if currentRole == constants.RolePlatformOwner {
		if req.TenantID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tenant ID required for platform owner"})
			return
		}
		tenantID = req.TenantID
	} else {
		// Tenant admins can only create users for their own tenant
		tid := c.MustGet("tenant_id").(uuid.UUID)
		tenantID = &tid
		
		// Ensure tenant admins can only create allowed roles
		allowedRoles := constants.GetTenantRoles()
		roleAllowed := false
		for _, role := range allowedRoles {
			if constants.UserRole(req.Role) == role {
				roleAllowed = true
				break
			}
		}
		if !roleAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot create user with this role"})
			return
		}
	}

	// Check if email already exists
	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		Name:        req.Name,
		Email:       req.Email,
		Password:    string(hashedPassword),
		Role:        req.Role,
		TenantID:    tenantID,
		CreatedByID: &currentUserID,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Load tenant info if exists
	if user.TenantID != nil {
		config.DB.Preload("Tenant").First(&user, user.ID)
	}

	response := responses.UserResponse{
		ID:       user.ID,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
		TenantID: user.TenantID,
	}

	c.JSON(http.StatusCreated, response)
}

// GetTenantUsers lists all users for a tenant
// @Summary List tenant users
// @Description Get all users for the current tenant or specified tenant (platform owner)
// @Tags Tenant Users
// @Accept json
// @Produce json
// @Param tenant_id query string false "Tenant ID (platform owner only)"
// @Success 200 {array} responses.UserResponse
// @Failure 400,403 {object} responses.ErrorResponse
// @Router /api/tenant-users [get]
func (tc *TenantUserController) GetTenantUsers(c *gin.Context) {
	currentRole := constants.UserRole(c.MustGet("role").(string))
	var users []models.User
	query := config.DB.Model(&models.User{})

	if currentRole == constants.RolePlatformOwner {
		// Platform owner can view users from any tenant
		tenantIDStr := c.Query("tenant_id")
		if tenantIDStr != "" {
			tenantID, err := uuid.Parse(tenantIDStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tenant ID"})
				return
			}
			query = query.Where("tenant_id = ?", tenantID)
		}
		// If no tenant_id specified, show all users
	} else {
		// Other roles can only see users from their tenant
		tenantID := c.MustGet("tenant_id").(uuid.UUID)
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var response []responses.UserResponse
	for _, user := range users {
		response = append(response, responses.UserResponse{
			ID:       user.ID,
			Name:     user.Name,
			Email:    user.Email,
			Role:     user.Role,
			TenantID: user.TenantID,
		})
	}

	c.JSON(http.StatusOK, response)
}

// UpdateTenantUser updates a tenant user's information
// @Summary Update tenant user
// @Description Update a user's name or role
// @Tags Tenant Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param request body requests.UpdateTenantUserRequest true "Update data"
// @Success 200 {object} responses.UserResponse
// @Failure 400,403,404 {object} responses.ErrorResponse
// @Router /api/tenant-users/{id} [put]
func (tc *TenantUserController) UpdateTenantUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req requests.UpdateTenantUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role if provided
	if req.Role != "" && !constants.IsValidRole(req.Role) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	currentRole := constants.UserRole(c.MustGet("role").(string))
	var user models.User

	// Find user
	if err := config.DB.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Check permissions
	if currentRole != constants.RolePlatformOwner {
		// Tenant users can only update users in their tenant
		currentTenantID := c.MustGet("tenant_id").(uuid.UUID)
		if user.TenantID == nil || *user.TenantID != currentTenantID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot update user from different tenant"})
			return
		}

		// Check if trying to set a role they cannot assign
		if req.Role != "" {
			allowedRoles := constants.GetTenantRoles()
			roleAllowed := false
			for _, role := range allowedRoles {
				if constants.UserRole(req.Role) == role {
					roleAllowed = true
					break
				}
			}
			if !roleAllowed {
				c.JSON(http.StatusForbidden, gin.H{"error": "Cannot assign this role"})
				return
			}
		}
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}

	if err := config.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	response := responses.UserResponse{
		ID:       user.ID,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
		TenantID: user.TenantID,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteTenantUser deletes a tenant user
// @Summary Delete tenant user
// @Description Soft delete a user
// @Tags Tenant Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]string
// @Failure 400,403,404 {object} responses.ErrorResponse
// @Router /api/tenant-users/{id} [delete]
func (tc *TenantUserController) DeleteTenantUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	currentRole := constants.UserRole(c.MustGet("role").(string))
	currentUserID := c.MustGet("user_id").(uuid.UUID)

	// Prevent self-deletion
	if userID == currentUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	// Check permissions
	if currentRole != constants.RolePlatformOwner {
		currentTenantID := c.MustGet("tenant_id").(uuid.UUID)
		if user.TenantID == nil || *user.TenantID != currentTenantID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete user from different tenant"})
			return
		}

		// Prevent deletion of tenant admins by non-platform owners
		if user.Role == string(constants.RoleTenantAdmin) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete tenant admin"})
			return
		}
	}

	// Soft delete
	if err := config.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetAvailableRoles returns roles that can be assigned by the current user
// @Summary Get available roles
// @Description Get list of roles that the current user can assign
// @Tags Tenant Users
// @Accept json
// @Produce json
// @Success 200 {array} map[string]string
// @Router /api/tenant-users/roles [get]
func (tc *TenantUserController) GetAvailableRoles(c *gin.Context) {
	currentRole := constants.UserRole(c.MustGet("role").(string))
	
	var roles []map[string]string
	
	if currentRole == constants.RolePlatformOwner {
		// Platform owner can assign all roles
		allRoles := []constants.UserRole{
			constants.RoleTenantAdmin,
			constants.RoleMeterReader,
			constants.RoleFinance,
			constants.RoleService,
		}
		
		for _, role := range allRoles {
			roles = append(roles, map[string]string{
				"value": string(role),
				"label": getRoleLabel(role),
			})
		}
	} else if currentRole == constants.RoleTenantAdmin {
		// Tenant admin can only assign tenant roles
		for _, role := range constants.GetTenantRoles() {
			roles = append(roles, map[string]string{
				"value": string(role),
				"label": getRoleLabel(role),
			})
		}
	}
	
	c.JSON(http.StatusOK, roles)
}

func getRoleLabel(role constants.UserRole) string {
	switch role {
	case constants.RolePlatformOwner:
		return "Platform Owner"
	case constants.RoleTenantAdmin:
		return "Tenant Admin"
	case constants.RoleMeterReader:
		return "Meter Reader (Pencatat Meteran)"
	case constants.RoleFinance:
		return "Finance Officer (Bagian Keuangan)"
	case constants.RoleService:
		return "Service Officer (Bagian Pelayanan)"
	default:
		return string(role)
	}
}