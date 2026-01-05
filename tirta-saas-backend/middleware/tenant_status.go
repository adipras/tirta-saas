package middleware

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CheckTenantStatus middleware checks if tenant is active/allowed to access
func CheckTenantStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip check for platform owner (they don't have tenant restrictions)
		role, exists := c.Get("role")
		if exists && role == "platform_owner" {
			c.Next()
			return
		}

		// Get tenant ID from context (set by JWT middleware)
		tenantIDInterface, exists := c.Get("tenant_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Tenant ID not found in request context",
			})
			c.Abort()
			return
		}

		tenantID, ok := tenantIDInterface.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid tenant ID format",
			})
			c.Abort()
			return
		}

		// Fetch tenant status from database
		var tenant models.Tenant
		if err := config.DB.Select("id, status").Where("id = ?", tenantID).First(&tenant).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Tenant not found",
			})
			c.Abort()
			return
		}

		// Check if tenant is allowed to access
		switch tenant.Status {
		case models.TenantStatusExpired:
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Trial period has expired",
				"message": "Your trial period has expired. Please upgrade your subscription to continue using this service.",
				"status":  "EXPIRED",
				"action":  "Please contact support or upgrade your subscription",
			})
			c.Abort()
			return

		case models.TenantStatusSuspended:
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Account suspended",
				"message": "Your account has been suspended. Please contact support for assistance.",
				"status":  "SUSPENDED",
				"action":  "Contact support at support@tirtasaas.com",
			})
			c.Abort()
			return

		case models.TenantStatusInactive:
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Account inactive",
				"message": "Your account is inactive. Please contact support to reactivate.",
				"status":  "INACTIVE",
				"action":  "Contact support at support@tirtasaas.com",
			})
			c.Abort()
			return

		case models.TenantStatusActive, models.TenantStatusTrial, models.TenantStatusPendingPayment, models.TenantStatusPendingVerification:
			// These statuses are allowed to access
			c.Next()
			return

		default:
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Invalid tenant status",
				"message": "Your account status is not recognized. Please contact support.",
			})
			c.Abort()
			return
		}
	}
}
