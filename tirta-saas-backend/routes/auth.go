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
}
