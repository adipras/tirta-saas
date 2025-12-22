package main

import (
	"log"
	"os"

	"github.com/adipras/tirta-saas-backend/config"
	_ "github.com/adipras/tirta-saas-backend/docs"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/adipras/tirta-saas-backend/pkg/logger"
	"github.com/adipras/tirta-saas-backend/pkg/seeder"
	"github.com/adipras/tirta-saas-backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title Tirta SaaS Backend API
// @version 1.0
// @description Multi-Tenant Water Utility Billing System - Complete SaaS solution for water utility companies
// @termsOfService https://tirtasaas.com/terms

// @contact.name Tirta SaaS Support
// @contact.email support@tirtasaas.com
// @contact.url https://tirtasaas.com/support

// @license.name Proprietary
// @license.url https://tirtasaas.com/license

// @host localhost:8081
// @BasePath /
// @schemes http https

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	config.ConnectDB()
	config.Migrate()

	// Auto-seed default platform admin if none exists
	if os.Getenv("AUTO_SEED_ADMIN") == "true" {
		if err := seeder.SeedDefaultPlatformAdmin(); err != nil {
			log.Printf("⚠️  Warning: Failed to seed platform admin: %v", err)
		}
	}

	// Get port configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // default
	}

	// Initialize logger
	logger.Init("INFO")
	logger.Info("🚀 Tirta-SaaS Backend starting up", map[string]interface{}{
		"version": "1.0.0",
		"env":     os.Getenv("ENV"),
		"port":    port,
	})

	r := gin.Default()
	
	// Disable automatic trailing slash redirects
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// Global middleware
	r.Use(middleware.HandleTrailingSlash())
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.RequestTracingMiddleware())
	r.Use(middleware.PerformanceMonitoringMiddleware())

	// Swagger UI endpoint for API documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	
	// Register all application routes
	routes.HealthRoutes(r)
	routes.AuthRoutes(r)
	routes.ProtectedRoutes(r)
	routes.SubscriptionRoutes(r)
	routes.CustomerRoutes(r)
	routes.CustomerSelfServiceRoutes(r)
	routes.WaterRateRoutes(r)
	routes.WaterUsageRoutes(r)
	routes.InvoiceRoutes(r)
	routes.PaymentRoutes(r)
	routes.RegisterTenantUserRoutes(r)
	routes.PlatformRoutes(r)
	routes.ReportRoutes(r)
	
	// Master Data & Settings Routes
	routes.ServiceAreaRoutes(r)
	routes.PaymentMethodRoutes(r)
	routes.TariffRoutes(r)
	routes.UserManagementRoutes(r)

	logger.Info("🚀 Server ready and listening", map[string]interface{}{
		"port":    port,
		"swagger": "http://localhost:" + port + "/swagger/index.html",
		"health":  "http://localhost:" + port + "/health",
	})
	r.Run(":" + port)
}
