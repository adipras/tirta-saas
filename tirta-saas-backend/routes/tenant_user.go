package routes

import (
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterTenantUserRoutes(router *gin.Engine) {
	tenantUserController := &controllers.TenantUserController{}
	
	api := router.Group("/api/tenant-users")
	api.Use(middleware.JWTAuthMiddleware())
	{
		// Platform owner and tenant admin can manage users
		api.POST("", 
			middleware.RequireRole(constants.RolePlatformOwner, constants.RoleTenantAdmin),
			tenantUserController.CreateTenantUser)
		
		api.GET("", 
			middleware.RequirePermission(constants.PermManageTenantUsers, constants.PermViewCustomers),
			tenantUserController.GetTenantUsers)
		
		api.PUT("/:id", 
			middleware.RequireRole(constants.RolePlatformOwner, constants.RoleTenantAdmin),
			tenantUserController.UpdateTenantUser)
		
		api.DELETE("/:id", 
			middleware.RequireRole(constants.RolePlatformOwner, constants.RoleTenantAdmin),
			tenantUserController.DeleteTenantUser)
		
		// Get available roles for assignment
		api.GET("/roles",
			middleware.RequireRole(constants.RolePlatformOwner, constants.RoleTenantAdmin),
			tenantUserController.GetAvailableRoles)
	}
}