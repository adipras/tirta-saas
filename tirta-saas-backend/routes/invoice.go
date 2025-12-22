package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func InvoiceRoutes(r *gin.Engine) {
	group := r.Group("/api/invoices")
	group.Use(middleware.JWTAuthMiddleware(), middleware.AdminOnly())

	// Legacy single generation
	group.POST("generate-monthly", controllers.GenerateMonthlyInvoice)
	
	// New bulk generation endpoints
	group.POST("/bulk-generate", controllers.BulkGenerateInvoices)
	group.POST("/preview-generation", controllers.PreviewInvoiceGeneration)
	
	// CRUD operations
	group.GET("", controllers.GetInvoices)
	group.GET(":id", controllers.GetInvoice)
	group.PUT(":id", controllers.UpdateInvoice)
	group.DELETE(":id", controllers.DeleteInvoice)
}
