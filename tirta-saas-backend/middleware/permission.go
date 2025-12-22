package middleware

import (
	"net/http"
	"github.com/adipras/tirta-saas-backend/constants"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequirePermission creates middleware that checks if the user has specific permission(s)
func RequirePermission(permissions ...constants.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleInterface, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Role not found in context"})
			c.Abort()
			return
		}

		role := constants.UserRole(roleInterface.(string))

		// Check if user has at least one of the required permissions
		hasPermission := false
		for _, permission := range permissions {
			if constants.HasPermission(role, permission) {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied. Insufficient permissions",
				"required_permissions": permissions,
				"user_role": role,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole creates middleware that checks if the user has one of the specified roles
func RequireRole(roles ...constants.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleInterface, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Role not found in context"})
			c.Abort()
			return
		}

		userRole := constants.UserRole(roleInterface.(string))
		
		// Check if user has one of the required roles
		hasRole := false
		for _, role := range roles {
			if userRole == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied. Invalid role",
				"required_roles": roles,
				"user_role": userRole,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePlatformOwner is a convenience middleware for platform owner only endpoints
func RequirePlatformOwner() gin.HandlerFunc {
	return RequireRole(constants.RolePlatformOwner)
}

// RequireTenantAdmin is a convenience middleware for tenant admin only endpoints
func RequireTenantAdmin() gin.HandlerFunc {
	return RequireRole(constants.RoleTenantAdmin)
}

// RequireTenantUser ensures the user belongs to a tenant (not platform owner)
func RequireTenantUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, exists := c.Get("tenant_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "This endpoint requires tenant context"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// EnsureSameTenant checks if the resource being accessed belongs to the user's tenant
// This is used for additional security on resource access
func EnsureSameTenant(getTenantIDFunc func(c *gin.Context) (uuid.UUID, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Platform owners can access any tenant's data
		if role, _ := c.Get("role"); role == string(constants.RolePlatformOwner) {
			c.Next()
			return
		}

		userTenantID, exists := c.Get("tenant_id")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Tenant context required"})
			c.Abort()
			return
		}

		resourceTenantID, err := getTenantIDFunc(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get resource tenant ID"})
			c.Abort()
			return
		}

		if userTenantID.(uuid.UUID) != resourceTenantID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. Resource belongs to different tenant"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Note: AdminOnly function is already defined in rbac.go for backward compatibility