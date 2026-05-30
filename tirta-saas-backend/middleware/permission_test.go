package middleware

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func decodeJSONBody(t *testing.T, recorder *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()

	var payload map[string]interface{}
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	return payload
}

func TestPlatformOwnerOnly(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name         string
		role         interface{}
		expectedCode int
		expectedBody string
	}{
		{
			name:         "allows platform owner",
			role:         string(constants.RolePlatformOwner),
			expectedCode: http.StatusOK,
		},
		{
			name:         "rejects tenant admin",
			role:         string(constants.RoleTenantAdmin),
			expectedCode: http.StatusForbidden,
			expectedBody: "Akses khusus platform owner",
		},
		{
			name:         "rejects missing role",
			role:         nil,
			expectedCode: http.StatusForbidden,
			expectedBody: "Akses khusus platform owner",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(func(c *gin.Context) {
				if tt.role != nil {
					c.Set("role", tt.role)
				}
				c.Next()
			})
			router.Use(PlatformOwnerOnly())
			router.GET("/protected", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})

			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			recorder := httptest.NewRecorder()

			router.ServeHTTP(recorder, req)

			if recorder.Code != tt.expectedCode {
				t.Fatalf("expected status %d, got %d", tt.expectedCode, recorder.Code)
			}

			if tt.expectedBody == "" {
				return
			}

			payload := decodeJSONBody(t, recorder)
			if payload["error"] != tt.expectedBody {
				t.Fatalf("expected error %q, got %v", tt.expectedBody, payload["error"])
			}
		})
	}
}

func TestRequirePermission(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name         string
		role         interface{}
		permission   constants.Permission
		expectedCode int
		expectedBody string
	}{
		{
			name:         "allows meter reader with customer view permission",
			role:         string(constants.RoleMeterReader),
			permission:   constants.PermViewCustomers,
			expectedCode: http.StatusOK,
		},
		{
			name:         "allows finance with matching permission",
			role:         string(constants.RoleFinance),
			permission:   constants.PermManagePayments,
			expectedCode: http.StatusOK,
		},
		{
			name:         "allows tenant admin as elevated role",
			role:         string(constants.RoleTenantAdmin),
			permission:   constants.PermSystemConfiguration,
			expectedCode: http.StatusOK,
		},
		{
			name:         "rejects meter reader without permission",
			role:         string(constants.RoleMeterReader),
			permission:   constants.PermManagePayments,
			expectedCode: http.StatusForbidden,
			expectedBody: "Access denied. Insufficient permissions",
		},
		{
			name:         "rejects invalid role type",
			role:         123,
			permission:   constants.PermManagePayments,
			expectedCode: http.StatusUnauthorized,
			expectedBody: "Invalid role in context",
		},
		{
			name:         "rejects missing role",
			role:         nil,
			permission:   constants.PermManagePayments,
			expectedCode: http.StatusUnauthorized,
			expectedBody: "Role not found in context",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(func(c *gin.Context) {
				if tt.role != nil {
					c.Set("role", tt.role)
				}
				c.Next()
			})
			router.Use(RequirePermission(tt.permission))
			router.GET("/protected", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})

			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			recorder := httptest.NewRecorder()

			router.ServeHTTP(recorder, req)

			if recorder.Code != tt.expectedCode {
				t.Fatalf("expected status %d, got %d", tt.expectedCode, recorder.Code)
			}

			if tt.expectedBody == "" {
				return
			}

			payload := decodeJSONBody(t, recorder)
			if payload["error"] != tt.expectedBody {
				t.Fatalf("expected error %q, got %v", tt.expectedBody, payload["error"])
			}
		})
	}
}

func TestRequirePermissionAllowsAnyMatchingPermission(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("role", string(constants.RoleMeterReader))
		c.Next()
	})
	router.Use(RequirePermission(constants.PermManageWaterRates, constants.PermRecordWaterUsage))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}

func TestRequireTenantUser(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()

	tests := []struct {
		name         string
		setTenant    bool
		expectedCode int
		expectedBody string
	}{
		{
			name:         "allows tenant context",
			setTenant:    true,
			expectedCode: http.StatusOK,
		},
		{
			name:         "rejects missing tenant context",
			setTenant:    false,
			expectedCode: http.StatusForbidden,
			expectedBody: "This endpoint requires tenant context",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(func(c *gin.Context) {
				if tt.setTenant {
					c.Set("tenant_id", tenantID)
				}
				c.Next()
			})
			router.Use(RequireTenantUser())
			router.GET("/protected", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})

			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			recorder := httptest.NewRecorder()

			router.ServeHTTP(recorder, req)

			if recorder.Code != tt.expectedCode {
				t.Fatalf("expected status %d, got %d", tt.expectedCode, recorder.Code)
			}

			if tt.expectedBody == "" {
				return
			}

			payload := decodeJSONBody(t, recorder)
			if payload["error"] != tt.expectedBody {
				t.Fatalf("expected error %q, got %v", tt.expectedBody, payload["error"])
			}
		})
	}
}

func TestEnsureSameTenant(t *testing.T) {
	gin.SetMode(gin.TestMode)

	userTenantID := uuid.New()
	resourceTenantID := uuid.New()

	tests := []struct {
		name              string
		role              string
		setTenant         bool
		resourceTenantID  uuid.UUID
		resourceErr       error
		expectedCode      int
		expectedErrorBody string
	}{
		{
			name:             "allows platform owner bypass",
			role:             string(constants.RolePlatformOwner),
			setTenant:        false,
			resourceTenantID: resourceTenantID,
			expectedCode:     http.StatusOK,
		},
		{
			name:             "allows same tenant",
			role:             string(constants.RoleFinance),
			setTenant:        true,
			resourceTenantID: userTenantID,
			expectedCode:     http.StatusOK,
		},
		{
			name:              "rejects different tenant",
			role:              string(constants.RoleFinance),
			setTenant:         true,
			resourceTenantID:  resourceTenantID,
			expectedCode:      http.StatusForbidden,
			expectedErrorBody: "Access denied. Resource belongs to different tenant",
		},
		{
			name:              "rejects missing tenant context",
			role:              string(constants.RoleFinance),
			setTenant:         false,
			resourceTenantID:  resourceTenantID,
			expectedCode:      http.StatusForbidden,
			expectedErrorBody: "Tenant context required",
		},
		{
			name:              "rejects tenant lookup failure",
			role:              string(constants.RoleFinance),
			setTenant:         true,
			resourceErr:       errors.New("boom"),
			expectedCode:      http.StatusBadRequest,
			expectedErrorBody: "Failed to get resource tenant ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(func(c *gin.Context) {
				c.Set("role", tt.role)
				if tt.setTenant {
					c.Set("tenant_id", userTenantID)
				}
				c.Next()
			})
			router.Use(EnsureSameTenant(func(c *gin.Context) (uuid.UUID, error) {
				if tt.resourceErr != nil {
					return uuid.Nil, tt.resourceErr
				}
				return tt.resourceTenantID, nil
			}))
			router.GET("/protected", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})

			req := httptest.NewRequest(http.MethodGet, "/protected", nil)
			recorder := httptest.NewRecorder()

			router.ServeHTTP(recorder, req)

			if recorder.Code != tt.expectedCode {
				t.Fatalf("expected status %d, got %d", tt.expectedCode, recorder.Code)
			}

			if tt.expectedErrorBody == "" {
				return
			}

			payload := decodeJSONBody(t, recorder)
			if payload["error"] != tt.expectedErrorBody {
				t.Fatalf("expected error %q, got %v", tt.expectedErrorBody, payload["error"])
			}
		})
	}
}
