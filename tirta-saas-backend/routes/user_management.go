package routes

import (
	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func UserManagementRoutes(r *gin.Engine) {
	userManagementController := controllers.NewUserManagementController(config.DB)
	
	api := r.Group("/api/users")
	api.Use(middleware.JWTAuthMiddleware())
	{
		// User profile operations (self-service)
		api.GET("/profile/:id", userManagementController.GetUserProfile)
		api.PUT("/profile/:id", userManagementController.UpdateUserProfile)
		
		// User activity and sessions
		api.GET("/:id/activity", userManagementController.GetUserActivity)
		api.POST("/:id/logout-all", userManagementController.LogoutAllSessions)
		
		// Admin operations
		api.POST("", middleware.AdminOnly(), userManagementController.CreateUserWithProfile)
		api.POST("/:id/suspend", middleware.AdminOnly(), userManagementController.SuspendUser)
	}
}
