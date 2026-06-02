package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func MeterRoutes(r *gin.Engine) {
	group := r.Group("/api/meters")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	group.GET("/:id/resolve-meter-start", middleware.RequirePermission(constants.PermRecordWaterUsage), controllers.ResolveMeterStart)
	group.GET("/:id/customers-meters", middleware.RequirePermission(constants.PermViewCustomers), controllers.GetCustomerMeters)
}
