package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func CustomerRoutes(r *gin.Engine) {
	group := r.Group("/api/customers")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	group.POST("", middleware.RequirePermission(constants.PermManageCustomers), controllers.CreateCustomer)
	group.GET("", middleware.RequirePermission(constants.PermViewCustomers), controllers.GetCustomers)
	group.GET("/export", middleware.RequirePermission(constants.PermViewCustomers), controllers.ExportCustomers)
	group.POST("/bulk-import", middleware.RequirePermission(constants.PermManageCustomers), controllers.BulkImportCustomers)
	group.GET("/:id", middleware.RequirePermission(constants.PermViewCustomers), controllers.GetCustomer)
	group.PUT("/:id", middleware.RequirePermission(constants.PermManageCustomers), controllers.UpdateCustomer)
	group.DELETE("/:id", middleware.RequirePermission(constants.PermManageCustomers), controllers.DeleteCustomer)
	group.PATCH("/:id/initial-reading", middleware.RequirePermission(constants.PermManageCustomers), controllers.SetInitialReading)
	group.POST("/:id/activate", middleware.RequirePermission(constants.PermManageCustomers), controllers.ActivateCustomer)
	group.POST("/:id/deactivate", middleware.RequirePermission(constants.PermManageCustomers), controllers.DeactivateCustomer)
	group.POST("/:id/reset-password", middleware.RequirePermission(constants.PermManageCustomers), controllers.ResetCustomerPassword)

	// Meter sub-resources
	group.GET("/:id/meters", middleware.RequirePermission(constants.PermViewCustomers), controllers.GetCustomerMeters)
	group.POST("/:id/meters", middleware.RequirePermission(constants.PermManageCustomers), controllers.AddCustomerMeter)
	group.PATCH("/:id/meters/:mid", middleware.RequirePermission(constants.PermManageCustomers), controllers.UpdateCustomerMeter)
	group.DELETE("/:id/meters/:mid", middleware.RequirePermission(constants.PermManageCustomers), controllers.DeleteCustomerMeter)
	group.PATCH("/:id/meters/:mid/initial-reading", middleware.RequirePermission(constants.PermManageCustomers), controllers.SetMeterInitialReading)
}
