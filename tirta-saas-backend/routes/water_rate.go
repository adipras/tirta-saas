package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func WaterRateRoutes(r *gin.Engine) {
	group := r.Group("/api/water-rates")
	group.Use(middleware.JWTAuthMiddleware(), middleware.AdminOnly())

	group.POST("", controllers.CreateWaterRate)
	group.GET("", controllers.GetWaterRates)
	group.GET("/current", controllers.GetCurrentWaterRate)
	group.PUT(":id", controllers.UpdateWaterRate)
	group.DELETE(":id", controllers.DeleteWaterRate)
}
