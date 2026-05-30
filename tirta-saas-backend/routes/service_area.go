package routes

import (
	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func ServiceAreaRoutes(r *gin.Engine) {
	serviceAreaController := controllers.NewServiceAreaController(config.DB)

	api := r.Group("/api/service-areas")
	api.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())
	{
		// List all service areas for tenant
		api.GET(
			"",
			middleware.RequirePermission(constants.PermManageCustomers, constants.PermViewCustomers),
			serviceAreaController.GetServiceAreas,
		)

		// Get specific service area
		api.GET(
			"/:id",
			middleware.RequirePermission(constants.PermManageCustomers, constants.PermViewCustomers),
			serviceAreaController.GetServiceArea,
		)

		// Create service area
		api.POST("", middleware.RequireTenantAdmin(), serviceAreaController.CreateServiceArea)

		// Update service area
		api.PUT("/:id", middleware.RequireTenantAdmin(), serviceAreaController.UpdateServiceArea)

		// Delete service area
		api.DELETE("/:id", middleware.RequireTenantAdmin(), serviceAreaController.DeleteServiceArea)
	}
}
