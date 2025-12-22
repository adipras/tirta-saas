package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func ReportRoutes(r *gin.Engine) {
	group := r.Group("/api/reports")
	group.Use(middleware.JWTAuthMiddleware(), middleware.AdminOnly())

	group.GET("/revenue", controllers.GetRevenueReport)
	group.GET("/customers", controllers.GetCustomerReport)
	group.GET("/usage", controllers.GetUsageReport)
	group.GET("/payments", controllers.GetPaymentReport)
	group.GET("/outstanding", controllers.GetOutstandingReport)
}
