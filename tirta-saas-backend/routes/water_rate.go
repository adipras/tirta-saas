package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func WaterRateRoutes(r *gin.Engine) {
	group := r.Group("/api/water-rates")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	group.POST("", middleware.RequirePermission(constants.PermManageWaterRates), controllers.CreateWaterRate)
	group.GET("", middleware.RequirePermission(constants.PermManageWaterRates), controllers.GetWaterRates)
	group.GET("/current", middleware.RequirePermission(constants.PermManageWaterRates, constants.PermRecordWaterUsage), controllers.GetCurrentWaterRate)
	group.GET("/:id", middleware.RequirePermission(constants.PermManageWaterRates), controllers.GetWaterRate)
	group.PUT("/:id", middleware.RequirePermission(constants.PermManageWaterRates), controllers.UpdateWaterRate)
	group.DELETE("/:id", middleware.RequirePermission(constants.PermManageWaterRates), controllers.DeleteWaterRate)
}
