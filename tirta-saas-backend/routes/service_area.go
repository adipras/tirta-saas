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
	api.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus(), middleware.AdminOnly())
	{
		// List all service areas for tenant
		api.GET("", serviceAreaController.GetServiceAreas)
		
		// Get specific service area
		api.GET("/:id", serviceAreaController.GetServiceArea)
		
		// Create service area
		api.POST("", serviceAreaController.CreateServiceArea)
		
		// Update service area
		api.PUT("/:id", serviceAreaController.UpdateServiceArea)
		
		// Delete service area
		api.DELETE("/:id", serviceAreaController.DeleteServiceArea)
	}
}
