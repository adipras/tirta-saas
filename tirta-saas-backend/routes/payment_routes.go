// routes/payment_routes.go
package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func PaymentRoutes(r *gin.Engine) {
	group := r.Group("/api/payments")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus(), middleware.AdminOnly())

	group.POST("", controllers.CreatePayment)
	group.GET("", controllers.GetAllPayments)
	group.GET("/customer/:customer_id", controllers.GetPaymentHistoryByCustomerID)
	group.POST("/:id/void", controllers.VoidPayment)
	group.GET("/:id/receipt", controllers.GetPaymentReceipt)
	group.POST("/:id/receipt", controllers.GeneratePaymentReceipt)
	group.GET("/:id", controllers.GetPayment)
	group.PUT("/:id", controllers.UpdatePayment)
	group.DELETE("/:id", controllers.DeletePayment)
}
