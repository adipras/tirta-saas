package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func CustomerSelfServiceRoutes(r *gin.Engine) {
	group := r.Group("/api/customer")
	group.Use(middleware.CustomerJWTAuthMiddleware())

	// Profile management
	group.GET("/profile", controllers.GetCustomerProfile)
	group.PUT("/profile", controllers.UpdateCustomerProfile)
	group.PUT("/password", controllers.ChangeCustomerPassword)

	// Data access
	group.GET("/invoices", controllers.GetCustomerInvoices)
	group.GET("/payments", controllers.GetCustomerPayments)
	group.GET("/water-usage", controllers.GetCustomerWaterUsage)

	// Payment
	group.POST("/payments", controllers.CustomerMakePayment)
}