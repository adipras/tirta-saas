package routes

import (
	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func PaymentMethodRoutes(r *gin.Engine) {
	paymentMethodController := controllers.NewPaymentMethodController(config.DB)
	
	// Payment Methods Management (Tenant Admin)
	api := r.Group("/api/payment-methods")
	api.Use(middleware.JWTAuthMiddleware())
	api.Use(middleware.AdminOnly()) // Only admins can manage payment methods
	{
		// Payment method types (Cash, Transfer, E-Wallet, etc)
		api.GET("", paymentMethodController.GetPaymentMethods)
		api.POST("", paymentMethodController.CreatePaymentMethod)
		api.PUT("/:id", paymentMethodController.UpdatePaymentMethod)
		api.POST("/:id/toggle", paymentMethodController.TogglePaymentMethod)
		
		// Bank accounts for transfer payments
		api.GET("/bank-accounts", paymentMethodController.GetBankAccounts)
		api.POST("/bank-accounts", paymentMethodController.CreateBankAccount)
		api.PUT("/bank-accounts/:id", paymentMethodController.UpdateBankAccount)
		api.POST("/bank-accounts/:id/set-primary", paymentMethodController.SetPrimaryBankAccount)
	}
}
