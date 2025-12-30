package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/gin-gonic/gin"
)

// PublicRoutes defines public routes that don't require authentication
func PublicRoutes(r *gin.Engine) {
	public := r.Group("/api/public")
	{
		// Tenant registration (no authentication required)
		public.POST("/register", controllers.PublicTenantRegistration)
		
		// Platform payment settings for subscription payments (public access)
		public.GET("/platform-payment-settings", controllers.GetPlatformPaymentSettings)
	}
}
