package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func ReportRoutes(r *gin.Engine) {
	group := r.Group("/api/reports")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	group.GET(
		"/revenue",
		middleware.RequirePermission(constants.PermViewInvoices, constants.PermViewPayments),
		controllers.GetRevenueReport,
	)
	group.GET("/customers", middleware.RequirePermission(constants.PermViewCustomers), controllers.GetCustomerReport)
	group.GET("/usage", middleware.RequirePermission(constants.PermViewWaterUsage), controllers.GetUsageReport)
	group.GET("/payments", middleware.RequirePermission(constants.PermViewPayments), controllers.GetPaymentReport)
	group.GET("/outstanding", middleware.RequirePermission(constants.PermViewInvoices), controllers.GetOutstandingReport)
}
