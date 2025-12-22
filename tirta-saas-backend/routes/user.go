package routes

import (
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func ProtectedRoutes(r *gin.Engine) {
	api := r.Group("/api")
	api.Use(middleware.JWTAuthMiddleware())

	api.GET("/me", func(c *gin.Context) {
		userID := c.MustGet("user_id")
		tenantID := c.MustGet("tenant_id")
		role := c.MustGet("role")

		c.JSON(200, gin.H{
			"user_id":   userID,
			"tenant_id": tenantID,
			"role":      role,
		})
	})

	// Admin Only route
	api.GET("/admin-only", middleware.AdminOnly(), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Selamat datang admin!"})
	})
}
