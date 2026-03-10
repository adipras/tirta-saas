package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		// Admin/Operator authentication
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)

		// Step-1 of the two-step registration flow: create user account only (no tenant)
		auth.POST("/register-account", controllers.RegisterAccount)
		
		// Platform owner registration (requires secret key)
		auth.POST("/platform-owner/register", controllers.RegisterPlatformOwner)
		
		// Customer authentication
		auth.POST("/customer/login", controllers.CustomerLogin)
	}
	
	// Admin-only endpoint to create customer accounts
	adminAuth := r.Group("/api/auth")
	adminAuth.Use(middleware.JWTAuthMiddleware(), middleware.AdminOnly())
	{
		adminAuth.POST("/customer/create", controllers.CreateCustomerAccount)
	}

	// Step-2 of the two-step registration flow: setup tenant after login
	// Requires JWT auth but does NOT require an existing tenant_id
	setup := r.Group("/api/setup")
	setup.Use(middleware.JWTAuthMiddleware())
	{
		setup.POST("/tenant", controllers.SetupTenant)
	}
}
