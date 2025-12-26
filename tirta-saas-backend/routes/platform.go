package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func PlatformRoutes(r *gin.Engine) {
	// Platform owner routes - requires special platform owner authentication
	// For now, we'll use AdminOnly middleware but in production you should have PlatformOwnerOnly middleware
	platform := r.Group("/api/platform")
	platform.Use(middleware.JWTAuthMiddleware())
	platform.Use(middleware.AdminOnly()) // TODO: Create PlatformOwnerOnly middleware
	{
		// Tenant Registration & Approval
		platform.GET("/tenants/pending", controllers.GetPendingTenants)
		platform.POST("/tenants/:id/approve", controllers.ApproveTenant)
		platform.POST("/tenants/:id/reject", controllers.RejectTenant)
		
		// Tenant Management
		platform.GET("/tenants", controllers.ListTenants)
		platform.GET("/tenants/:id", controllers.GetTenantDetail)
		platform.PUT("/tenants/:id", controllers.UpdateTenant)
		platform.POST("/tenants/:id/suspend", controllers.SuspendTenantByPlatform)
		platform.POST("/tenants/:id/activate", controllers.ActivateTenant)
		platform.DELETE("/tenants/:id", controllers.DeleteTenant)
		platform.GET("/tenants/:id/statistics", controllers.GetTenantStatistics)
		
		// Platform Analytics - Subscription & Tenant Management focused
		platform.GET("/analytics/overview", controllers.GetPlatformAnalyticsOverview)
		platform.GET("/analytics/tenants", controllers.GetTenantGrowthAnalytics)
		platform.GET("/analytics/subscription-revenue", controllers.GetSubscriptionRevenueAnalytics)
		platform.GET("/analytics/platform-usage", controllers.GetPlatformUsageAnalytics)
		
		// Subscription Plan Management
		platform.GET("/subscription-plans", controllers.ListSubscriptionPlans)
		platform.POST("/subscription-plans", controllers.CreateSubscriptionPlan)
		platform.PUT("/subscription-plans/:id", controllers.UpdateSubscriptionPlan)
		platform.POST("/tenants/:id/subscription", controllers.AssignSubscriptionToTenant)
		platform.GET("/tenants/:id/billing-history", controllers.GetTenantBillingHistory)
		
		// Subscription Payment Verification
		platform.GET("/subscription-payments", controllers.GetSubscriptionPayments)
		platform.GET("/subscription-payments/:id", controllers.GetSubscriptionPaymentDetail)
		platform.PUT("/subscription-payments/:id/verify", controllers.VerifySubscriptionPayment)
		platform.PUT("/subscription-payments/:id/reject", controllers.RejectSubscriptionPayment)
		
		// System Monitoring & Logs
		platform.GET("/logs/audit", controllers.GetAuditLogs)
		platform.GET("/logs/errors", controllers.GetErrorLogs)
		platform.GET("/system/health", controllers.GetSystemHealth)
		platform.GET("/system/metrics", controllers.GetSystemMetrics)
	}
	
	// Tenant-specific settings routes - requires tenant admin role
	tenant := r.Group("/api/tenant")
	tenant.Use(middleware.JWTAuthMiddleware())
	tenant.Use(middleware.AdminOnly()) // Tenant admins only
	{
		// Tenant Settings
		tenant.GET("/settings", controllers.GetTenantSettings)
		tenant.PUT("/settings", controllers.UpdateTenantSettings)
		tenant.POST("/settings/logo", controllers.UploadTenantLogo)
		
		// Notification System
		tenant.GET("/notifications/templates", controllers.ListNotificationTemplates)
		tenant.POST("/notifications/templates", controllers.CreateNotificationTemplate)
		tenant.PUT("/notifications/templates/:id", controllers.UpdateNotificationTemplate)
		tenant.DELETE("/notifications/templates/:id", controllers.DeleteNotificationTemplate)
		tenant.POST("/notifications/send", controllers.SendNotification)
		
		// Customer Bulk Operations
		tenant.POST("/customers/bulk-import", controllers.BulkImportCustomers)
		tenant.POST("/customers/bulk-update", controllers.BulkUpdateCustomers)
		tenant.POST("/customers/bulk-activate", controllers.BulkActivateCustomers)
		tenant.GET("/customers/export", controllers.ExportCustomers)
		
		// TODO: Reports
		// tenant.GET("/reports/monthly-collection", controllers.MonthlyCollectionReport)
		// tenant.GET("/reports/outstanding-payments", controllers.OutstandingPaymentsReport)
		// tenant.GET("/reports/usage-analysis", controllers.UsageAnalysisReport)
		// tenant.GET("/reports/customer-summary", controllers.CustomerSummaryReport)
	}
}
