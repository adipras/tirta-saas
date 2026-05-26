package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func NotificationRoutes(r *gin.Engine) {
	adminNotifications := r.Group("/api/notifications")
	adminNotifications.Use(middleware.JWTAuthMiddleware())
	{
		adminNotifications.GET("", controllers.ListUserNotifications)
		adminNotifications.PATCH("/read-all", controllers.MarkAllUserNotificationsRead)
		adminNotifications.PATCH("/:id/read", controllers.MarkUserNotificationRead)
	}

	customerNotifications := r.Group("/api/customer/notifications")
	customerNotifications.Use(middleware.CustomerJWTAuthMiddleware())
	{
		customerNotifications.GET("", controllers.ListCustomerNotifications)
		customerNotifications.PATCH("/read-all", controllers.MarkAllCustomerNotificationsRead)
		customerNotifications.PATCH("/:id/read", controllers.MarkCustomerNotificationRead)
	}
}
