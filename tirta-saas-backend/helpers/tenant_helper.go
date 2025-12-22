package helpers

import (
	"errors"
	"github.com/adipras/tirta-saas-backend/constants"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetTenantIDFromContext extracts tenant ID from context based on user role
// Returns: (tenantID, hasSpecificTenant, error)
// - For platform_owner: returns specified tenant_id from query param or uuid.Nil if accessing all
// - For tenant users: returns their tenant_id from JWT context
func GetTenantIDFromContext(c *gin.Context) (uuid.UUID, bool, error) {
	role, exists := c.Get("role")
	if !exists {
		return uuid.Nil, false, errors.New("role not found in context")
	}

	// Platform owner can access all tenants or specify tenant_id
	if role == string(constants.RolePlatformOwner) {
		if tenantIDParam := c.Query("tenant_id"); tenantIDParam != "" {
			parsedID, err := uuid.Parse(tenantIDParam)
			if err != nil {
				return uuid.Nil, false, errors.New("invalid tenant_id format")
			}
			return parsedID, true, nil
		}
		// No tenant_id means all tenants (for listing endpoints)
		return uuid.Nil, false, nil
	}

	// Regular tenant users must have tenant_id in context
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return uuid.Nil, false, errors.New("tenant_id not found in context")
	}

	tenantUUID, ok := tenantID.(uuid.UUID)
	if !ok {
		return uuid.Nil, false, errors.New("tenant_id is not a valid UUID")
	}

	return tenantUUID, true, nil
}

// RequireTenantID is a helper that requires a specific tenant ID
// For platform owners, tenant_id query parameter is mandatory
// For tenant users, uses their tenant_id from context
func RequireTenantID(c *gin.Context) (uuid.UUID, error) {
	role, exists := c.Get("role")
	if !exists {
		return uuid.Nil, errors.New("role not found in context")
	}

	// Platform owner must specify tenant_id
	if role == string(constants.RolePlatformOwner) {
		tenantIDParam := c.Query("tenant_id")
		if tenantIDParam == "" {
			return uuid.Nil, errors.New("tenant_id parameter is required for platform owner")
		}
		parsedID, err := uuid.Parse(tenantIDParam)
		if err != nil {
			return uuid.Nil, errors.New("invalid tenant_id format")
		}
		return parsedID, nil
	}

	// Regular tenant users must have tenant_id in context
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return uuid.Nil, errors.New("tenant_id not found in context")
	}

	tenantUUID, ok := tenantID.(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.New("tenant_id is not a valid UUID")
	}

	return tenantUUID, nil
}
