package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"

	"github.com/gin-gonic/gin"
)

func WaterUsageRoutes(r *gin.Engine) {
	group := r.Group("/api/water-usage")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	group.POST("", middleware.RequirePermission(constants.PermRecordWaterUsage), controllers.CreateWaterUsage)
	group.POST("/bulk-import", middleware.RequirePermission(constants.PermRecordWaterUsage), controllers.BulkImportWaterUsage)
	group.GET("", middleware.RequirePermission(constants.PermViewWaterUsage), controllers.GetWaterUsages)
	group.GET("/:id", middleware.RequirePermission(constants.PermViewWaterUsage), controllers.GetWaterUsageByID)
	group.PUT("/:id", middleware.RequirePermission(constants.PermEditWaterUsage), controllers.UpdateWaterUsage)
	group.POST("/:id/photo", middleware.RequirePermission(constants.PermEditWaterUsage), controllers.UploadWaterUsagePhoto)
	group.DELETE("/:id", middleware.RequirePermission(constants.PermEditWaterUsage), controllers.DeleteWaterUsage)
}
