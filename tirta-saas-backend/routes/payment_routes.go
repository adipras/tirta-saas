// routes/payment_routes.go
package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func PaymentRoutes(r *gin.Engine) {
	group := r.Group("/api/payments")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	group.POST("", middleware.RequirePermission(constants.PermRecordPayments), controllers.CreatePayment)
	group.GET("", middleware.RequirePermission(constants.PermViewPayments), controllers.GetAllPayments)
	group.GET("/customer/:customer_id", middleware.RequirePermission(constants.PermViewPayments), controllers.GetPaymentHistoryByCustomerID)
	group.POST("/:id/void", middleware.RequirePermission(constants.PermManagePayments), controllers.VoidPayment)
	group.GET("/:id/receipt", middleware.RequirePermission(constants.PermViewPayments), controllers.GetPaymentReceipt)
	group.POST("/:id/receipt", middleware.RequirePermission(constants.PermManagePayments), controllers.GeneratePaymentReceipt)
	group.GET("/:id", middleware.RequirePermission(constants.PermViewPayments), controllers.GetPayment)
	group.PUT("/:id", middleware.RequirePermission(constants.PermManagePayments), controllers.UpdatePayment)
	group.DELETE("/:id", middleware.RequirePermission(constants.PermManagePayments), controllers.DeletePayment)
}
