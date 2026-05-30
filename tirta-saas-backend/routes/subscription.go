package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func SubscriptionRoutes(r *gin.Engine) {
	group := r.Group("/api/subscription-types")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	group.POST("", middleware.RequirePermission(constants.PermManageSubscriptions), controllers.CreateSubscriptionType)
	group.GET(
		"",
		middleware.RequirePermission(
			constants.PermManageSubscriptions,
			constants.PermManageCustomers,
			constants.PermViewCustomers,
		),
		controllers.GetAllSubscriptionTypes,
	)
	group.GET(
		"/:id",
		middleware.RequirePermission(
			constants.PermManageSubscriptions,
			constants.PermManageCustomers,
			constants.PermViewCustomers,
		),
		controllers.GetSubscriptionType,
	)
	group.PUT("/:id", middleware.RequirePermission(constants.PermManageSubscriptions), controllers.UpdateSubscriptionType)
	group.DELETE("/:id", middleware.RequirePermission(constants.PermManageSubscriptions), controllers.DeleteSubscriptionType)
}
