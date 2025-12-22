package routes

import (
	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func TariffRoutes(r *gin.Engine) {
	tariffController := controllers.NewTariffController(config.DB)
	
	api := r.Group("/api/tariffs")
	api.Use(middleware.JWTAuthMiddleware())
	{
		// Tariff Categories (Residential, Commercial, Industrial, etc)
		api.GET("/categories", tariffController.GetTariffCategories)
		api.POST("/categories", middleware.AdminOnly(), tariffController.CreateTariffCategory)
		api.GET("/categories/:id", tariffController.GetTariffCategory)
		api.PUT("/categories/:id", middleware.AdminOnly(), tariffController.UpdateTariffCategory)
		api.DELETE("/categories/:id", middleware.AdminOnly(), tariffController.DeleteTariffCategory)
		
		// Progressive Rates (tiered pricing within category)
		// Note: Using different route structure to avoid conflict
		api.GET("/progressive-rates", tariffController.GetProgressiveRates) // Use query param: ?category_id=X
		api.POST("/progressive-rates", middleware.AdminOnly(), tariffController.CreateProgressiveRate)
		api.PUT("/progressive-rates/:id", middleware.AdminOnly(), tariffController.UpdateProgressiveRate)
		api.DELETE("/progressive-rates/:id", middleware.AdminOnly(), tariffController.DeleteProgressiveRate)
		
		// Bill Simulation
		api.POST("/simulate", tariffController.SimulateBill)
	}
}
