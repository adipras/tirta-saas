package controllers

import (
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserManagementController struct {
	DB *gorm.DB
}

func NewUserManagementController(db *gorm.DB) *UserManagementController {
	return &UserManagementController{DB: db}
}

// CreateUserWithProfile creates a new user with profile and roles
func (ctrl *UserManagementController) CreateUserWithProfile(c *gin.Context) {
	var req requests.CreateUserWithProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := c.GetString("tenant_id")

	// Check if email already exists
	var existingUser models.User
	if err := ctrl.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Parse role IDs
	roleIDs := make([]uuid.UUID, len(req.RoleIDs))
	for i, roleID := range req.RoleIDs {
		parsedID, err := uuid.Parse(roleID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
			return
		}
		roleIDs[i] = parsedID
	}

	// Verify roles exist
	var roles []models.Role
	if err := ctrl.DB.Where("id IN ? AND tenant_id = ?", roleIDs, tenantID).Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch roles"})
		return
	}
	if len(roles) != len(roleIDs) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "One or more roles not found"})
		return
	}

	// Start transaction
	tx := ctrl.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create user
	tenantUUID, _ := uuid.Parse(tenantID)
	user := models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		TenantID: &tenantUUID,
	}
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Create user profile
	profile := models.UserProfile{
		UserID:      user.ID,
		FullName:    req.FullName,
		PhoneNumber: req.PhoneNumber,
		Address:     req.Address,
		Position:    req.Position,
		Department:  req.Department,
	}
	if err := tx.Create(&profile).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user profile"})
		return
	}

	// Assign roles
	for _, role := range roles {
		userRole := models.UserRole{
			UserID: user.ID,
			RoleID: role.ID,
		}
		if err := tx.Create(&userRole).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign roles"})
			return
		}
	}

	tx.Commit()

	// Fetch created user with profile and roles
	ctrl.DB.Preload("Profile").First(&user, user.ID)
	
	response := responses.ToUserWithProfileResponse(&user, &profile, roles)
	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "data": response})
}

// GetUserProfile gets user profile details
func (ctrl *UserManagementController) GetUserProfile(c *gin.Context) {
	userID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedUserID, tenantID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var profile models.UserProfile
	ctrl.DB.Where("user_id = ?", parsedUserID).First(&profile)

	var userRoles []models.UserRole
	ctrl.DB.Where("user_id = ?", parsedUserID).Find(&userRoles)
	
	roleIDs := make([]uuid.UUID, len(userRoles))
	for i, ur := range userRoles {
		roleIDs[i] = ur.RoleID
	}

	var roles []models.Role
	ctrl.DB.Preload("Permissions.Permission").Where("id IN ?", roleIDs).Find(&roles)

	response := responses.ToUserWithProfileResponse(&user, &profile, roles)
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// UpdateUserProfile updates user profile
func (ctrl *UserManagementController) UpdateUserProfile(c *gin.Context) {
	userID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req requests.UpdateUserProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify user exists
	var user models.User
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedUserID, tenantID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update or create profile
	var profile models.UserProfile
	result := ctrl.DB.Where("user_id = ?", parsedUserID).First(&profile)
	
	if result.Error == gorm.ErrRecordNotFound {
		profile = models.UserProfile{
			UserID:      parsedUserID,
			FullName:    req.FullName,
			PhoneNumber: req.PhoneNumber,
			Address:     req.Address,
			Position:    req.Position,
			Department:  req.Department,
			Notes:       req.Notes,
		}
		if err := ctrl.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile"})
			return
		}
	} else {
		profile.FullName = req.FullName
		profile.PhoneNumber = req.PhoneNumber
		profile.Address = req.Address
		profile.Position = req.Position
		profile.Department = req.Department
		profile.Notes = req.Notes
		
		if err := ctrl.DB.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully", "data": profile})
}

// SuspendUser suspends a user account
func (ctrl *UserManagementController) SuspendUser(c *gin.Context) {
	userID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedUserID, tenantID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Invalidate all sessions
	ctrl.DB.Model(&models.UserSession{}).Where("user_id = ?", parsedUserID).Update("is_active", false)

	c.JSON(http.StatusOK, gin.H{"message": "User suspended successfully"})
}

// GetUserActivity gets user activity log
func (ctrl *UserManagementController) GetUserActivity(c *gin.Context) {
	userID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify user exists
	var user models.User
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedUserID, tenantID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var activities []models.UserActivity
	ctrl.DB.Where("user_id = ?", parsedUserID).Order("created_at DESC").Limit(100).Find(&activities)

	activityResponses := make([]responses.UserActivityResponse, len(activities))
	for i, activity := range activities {
		activityResponses[i] = responses.UserActivityResponse{
			ID:          activity.ID,
			Action:      activity.Action,
			Category:    activity.Category,
			Description: activity.Description,
			IPAddress:   activity.IPAddress,
			CreatedAt:   activity.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": activityResponses})
}

// LogoutAllSessions logs out user from all devices
func (ctrl *UserManagementController) LogoutAllSessions(c *gin.Context) {
	userID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify user exists
	var user models.User
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedUserID, tenantID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Invalidate all sessions
	result := ctrl.DB.Model(&models.UserSession{}).
		Where("user_id = ? AND is_active = ?", parsedUserID, true).
		Updates(map[string]interface{}{
			"is_active": false,
			"updated_at": time.Now(),
		})

	c.JSON(http.StatusOK, gin.H{
		"message": "All sessions logged out successfully",
		"count": result.RowsAffected,
	})
}
