package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func InvoiceRoutes(r *gin.Engine) {
	group := r.Group("/api/invoices")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	// Legacy single generation
	group.POST("/generate-monthly", middleware.RequirePermission(constants.PermGenerateInvoices), controllers.GenerateMonthlyInvoice)

	// New bulk generation endpoints
	group.POST("/bulk-generate", middleware.RequirePermission(constants.PermGenerateInvoices), controllers.BulkGenerateInvoices)
	group.POST("/preview-generation", middleware.RequirePermission(constants.PermGenerateInvoices), controllers.PreviewInvoiceGeneration)

	// CRUD operations
	group.POST("", middleware.RequirePermission(constants.PermGenerateInvoices), controllers.CreateInvoice)
	group.GET("", middleware.RequirePermission(constants.PermViewInvoices), controllers.GetInvoices)
	group.GET("/outstanding", middleware.RequirePermission(constants.PermViewInvoices), controllers.GetOutstandingInvoices)
	group.GET("/:id", middleware.RequirePermission(constants.PermViewInvoices), controllers.GetInvoice)
	group.PUT("/:id", middleware.RequirePermission(constants.PermEditInvoices), controllers.UpdateInvoice)
	group.DELETE("/:id", middleware.RequirePermission(constants.PermEditInvoices), controllers.DeleteInvoice)
}
