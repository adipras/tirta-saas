package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func SubscriptionRoutes(r *gin.Engine) {
	group := r.Group("/api/subscription-types")
	group.Use(middleware.JWTAuthMiddleware(), middleware.AdminOnly())

	group.POST("", controllers.CreateSubscriptionType)
	group.GET("", controllers.GetAllSubscriptionTypes)
	group.GET(":id", controllers.GetSubscriptionType)
	group.PUT(":id", controllers.UpdateSubscriptionType)
	group.DELETE(":id", controllers.DeleteSubscriptionType)
}
