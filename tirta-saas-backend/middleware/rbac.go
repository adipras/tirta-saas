package middleware

import (
	"net/http"
	"github.com/adipras/tirta-saas-backend/constants"

	"github.com/gin-gonic/gin"
)

// AdminOnly is kept for backward compatibility
// It now allows both tenant_admin and platform_owner roles
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus admin"})
			c.Abort()
			return
		}
		
		userRole := constants.UserRole(role.(string))
		// Allow access for admin (legacy), tenant_admin, and platform_owner
		if userRole != "admin" && userRole != constants.RoleTenantAdmin && userRole != constants.RolePlatformOwner {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus admin"})
			c.Abort()
			return
		}
		c.Next()
	}
}
