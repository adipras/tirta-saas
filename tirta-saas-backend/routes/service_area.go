package routes

import (
	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func ServiceAreaRoutes(r *gin.Engine) {
	serviceAreaController := controllers.NewServiceAreaController(config.DB)
	
	api := r.Group("/api/service-areas")
	api.Use(middleware.JWTAuthMiddleware())
	{
		// List all service areas for tenant
		api.GET("", serviceAreaController.GetServiceAreas)
		
		// Get specific service area
		api.GET("/:id", serviceAreaController.GetServiceArea)
		
		// Create service area (admin only)
		api.POST("", middleware.AdminOnly(), serviceAreaController.CreateServiceArea)
		
		// Update service area (admin only)
		api.PUT("/:id", middleware.AdminOnly(), serviceAreaController.UpdateServiceArea)
		
		// Delete service area (admin only)
		api.DELETE("/:id", middleware.AdminOnly(), serviceAreaController.DeleteServiceArea)
	}
}
