package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SubscriptionPaymentRoutes(r *gin.Engine) {
	// Tenant routes - submit subscription payment
	tenant := r.Group("/api/tenant/subscription")
	tenant.Use(middleware.JWTAuthMiddleware())
	{
		tenant.POST("/payment", controllers.SubmitSubscriptionPayment)
		tenant.GET("/status", controllers.GetTenantSubscriptionStatus)
	}
}
