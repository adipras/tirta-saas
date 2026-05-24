package middleware

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/constants"

	"github.com/gin-gonic/gin"
)

// AdminOnly is kept for backward compatibility
// It allows legacy admin and tenant_admin roles only.
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus admin"})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus admin"})
			c.Abort()
			return
		}

		userRole := constants.UserRole(roleStr)
		if userRole != "admin" && userRole != constants.RoleTenantAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus admin"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// PlatformOwnerOnly restricts access to platform owner routes only.
func PlatformOwnerOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus platform owner"})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok || constants.UserRole(roleStr) != constants.RolePlatformOwner {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses khusus platform owner"})
			c.Abort()
			return
		}

		c.Next()
	}
}
