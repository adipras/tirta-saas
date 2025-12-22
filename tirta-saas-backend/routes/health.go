package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/gin-gonic/gin"
)

// HealthRoutes sets up health check and monitoring endpoints
func HealthRoutes(r *gin.Engine) {
	// Health check endpoints (no authentication required)
	r.GET("/health", controllers.HealthCheck)
	r.GET("/ready", controllers.ReadinessCheck)
	r.GET("/alive", controllers.LivenessCheck)
	r.GET("/metrics", controllers.Metrics)
	
	// Alternative paths for compatibility
	r.GET("/health/live", controllers.LivenessCheck)
	r.GET("/health/ready", controllers.ReadinessCheck)
	r.GET("/health/metrics", controllers.Metrics)
}