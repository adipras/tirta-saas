package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type middlewareResponse struct {
	UserID     string `json:"user_id,omitempty"`
	CustomerID string `json:"customer_id,omitempty"`
	TenantID   string `json:"tenant_id,omitempty"`
	Role       string `json:"role,omitempty"`
	HasTenant  bool   `json:"has_tenant"`
	Error      string `json:"error,omitempty"`
}

func TestJWTAuthMiddleware_AllowsPlatformOwnerWithoutTenantID(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	userID := uuid.New()
	token, err := utils.GenerateJWT(userID, nil, string(constants.RolePlatformOwner))
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	router := gin.New()
	router.Use(JWTAuthMiddleware())
	router.GET("/protected", func(c *gin.Context) {
		tenantID, hasTenant := c.Get("tenant_id")
		response := middlewareResponse{
			UserID:    c.MustGet("user_id").(uuid.UUID).String(),
			Role:      c.MustGet("role").(string),
			HasTenant: hasTenant,
		}
		if hasTenant {
			response.TenantID = tenantID.(uuid.UUID).String()
		}
		c.JSON(http.StatusOK, response)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}

	var response middlewareResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if response.UserID != userID.String() {
		t.Fatalf("expected user_id %s, got %s", userID.String(), response.UserID)
	}
	if response.Role != string(constants.RolePlatformOwner) {
		t.Fatalf("expected role %s, got %s", constants.RolePlatformOwner, response.Role)
	}
	if response.HasTenant {
		t.Fatalf("expected platform owner to bypass tenant requirement")
	}
}

func TestJWTAuthMiddleware_RejectsTenantScopedRoleWithoutTenantID(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	token, err := utils.GenerateJWT(uuid.New(), nil, string(constants.RoleFinance))
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	router := gin.New()
	router.Use(JWTAuthMiddleware())
	router.GET("/protected", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", recorder.Code)
	}

	var response middlewareResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if response.Error != "Tenant ID wajib untuk role ini" {
		t.Fatalf("expected tenant error, got %q", response.Error)
	}
}

func TestJWTAuthMiddlewareAllowMissingTenant_AllowsTenantScopedRoleWithoutTenantID(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	userID := uuid.New()
	token, err := utils.GenerateJWT(userID, nil, string(constants.RoleTenantAdmin))
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	router := gin.New()
	router.Use(JWTAuthMiddlewareAllowMissingTenant())
	router.GET("/setup/tenant", func(c *gin.Context) {
		_, hasTenant := c.Get("tenant_id")
		c.JSON(http.StatusOK, middlewareResponse{
			UserID:    c.MustGet("user_id").(uuid.UUID).String(),
			Role:      c.MustGet("role").(string),
			HasTenant: hasTenant,
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/setup/tenant", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}

	var response middlewareResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if response.UserID != userID.String() {
		t.Fatalf("expected user_id %s, got %s", userID.String(), response.UserID)
	}
	if response.Role != string(constants.RoleTenantAdmin) {
		t.Fatalf("expected role %s, got %s", constants.RoleTenantAdmin, response.Role)
	}
	if response.HasTenant {
		t.Fatalf("expected missing tenant_id to remain absent for setup flow")
	}
}

func TestCustomerJWTAuthMiddleware_AllowsValidCustomerToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	customerID := uuid.New()
	tenantID := uuid.New()
	token, err := utils.GenerateCustomerJWT(customerID, tenantID)
	if err != nil {
		t.Fatalf("generate customer token: %v", err)
	}

	router := gin.New()
	router.Use(CustomerJWTAuthMiddleware())
	router.GET("/customer", func(c *gin.Context) {
		c.JSON(http.StatusOK, middlewareResponse{
			CustomerID: c.MustGet("customer_id").(uuid.UUID).String(),
			TenantID:   c.MustGet("tenant_id").(uuid.UUID).String(),
			Role:       c.MustGet("role").(string),
			HasTenant:  true,
		})
	})

	req := httptest.NewRequest(http.MethodGet, "/customer", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}

	var response middlewareResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if response.CustomerID != customerID.String() {
		t.Fatalf("expected customer_id %s, got %s", customerID.String(), response.CustomerID)
	}
	if response.TenantID != tenantID.String() {
		t.Fatalf("expected tenant_id %s, got %s", tenantID.String(), response.TenantID)
	}
	if response.Role != string(constants.RoleCustomer) {
		t.Fatalf("expected role %s, got %s", constants.RoleCustomer, response.Role)
	}
}

func TestCustomerJWTAuthMiddleware_RejectsNonCustomerRole(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()
	token, err := utils.GenerateJWT(uuid.New(), &tenantID, string(constants.RoleTenantAdmin))
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	router := gin.New()
	router.Use(CustomerJWTAuthMiddleware())
	router.GET("/customer", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/customer", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", recorder.Code)
	}

	var response middlewareResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if response.Error != "Akses ditolak. Endpoint khusus customer" {
		t.Fatalf("expected customer-only error, got %q", response.Error)
	}
}
