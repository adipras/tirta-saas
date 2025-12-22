package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"

	"github.com/gin-gonic/gin"
)

func WaterUsageRoutes(r *gin.Engine) {
	group := r.Group("/api/water-usage")
	group.Use(middleware.JWTAuthMiddleware(), middleware.AdminOnly())

	group.POST("", controllers.CreateWaterUsage)
	group.GET("", controllers.GetWaterUsages)
	group.GET(":id", controllers.GetWaterUsageByID)
	group.PUT(":id", controllers.UpdateWaterUsage)
	group.DELETE(":id", controllers.DeleteWaterUsage)
}
