package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func CustomerRoutes(r *gin.Engine) {
	group := r.Group("/api/customers")
	group.Use(middleware.JWTAuthMiddleware(), middleware.AdminOnly())

	group.POST("", controllers.CreateCustomer)
	group.GET("", controllers.GetCustomers)
	group.GET(":id", controllers.GetCustomer)
	group.PUT(":id", controllers.UpdateCustomer)
	group.DELETE(":id", controllers.DeleteCustomer)
}
