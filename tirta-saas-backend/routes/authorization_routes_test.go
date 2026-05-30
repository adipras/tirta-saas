package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type routeAuthErrorResponse struct {
	Error string `json:"error"`
}

func issueRouteJWT(t *testing.T, role constants.UserRole, tenantID *uuid.UUID) string {
	t.Helper()

	token, err := utils.GenerateJWT(uuid.New(), tenantID, string(role))
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	return token
}

func assertRouteAuthError(t *testing.T, recorder *httptest.ResponseRecorder, expectedCode int, expectedError string) {
	t.Helper()

	if recorder.Code != expectedCode {
		t.Fatalf("expected status %d, got %d with body %s", expectedCode, recorder.Code, recorder.Body.String())
	}

	var payload routeAuthErrorResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload.Error != expectedError {
		t.Fatalf("expected error %q, got %q", expectedError, payload.Error)
	}
}

func assertRouteOK(t *testing.T, recorder *httptest.ResponseRecorder) {
	t.Helper()

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d with body %s", http.StatusOK, recorder.Code, recorder.Body.String())
	}
}

func registerAuthorizedTestRoute(router *gin.Engine, method, path string, handlers ...gin.HandlerFunc) {
	finalHandler := func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}

	switch method {
	case http.MethodGet:
		router.GET(path, append(handlers, finalHandler)...)
	case http.MethodPost:
		router.POST(path, append(handlers, finalHandler)...)
	default:
		panic("unsupported test method")
	}
}

func TestPlatformRoutesRejectTenantAdmin(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()
	token := issueRouteJWT(t, constants.RoleTenantAdmin, &tenantID)

	router := gin.New()
	PlatformRoutes(router)

	req := httptest.NewRequest(http.MethodGet, "/api/platform/system/alerts", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteAuthError(t, recorder, http.StatusForbidden, "Akses khusus platform owner")
}

func TestTenantRoutesRejectPlatformOwner(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	token := issueRouteJWT(t, constants.RolePlatformOwner, nil)

	router := gin.New()
	PlatformRoutes(router)

	req := httptest.NewRequest(http.MethodGet, "/api/tenant/settings", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteAuthError(t, recorder, http.StatusForbidden, "Access denied. Invalid role")
}

func TestTenantUserRoutesRejectFinanceRoleManagement(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()
	token := issueRouteJWT(t, constants.RoleFinance, &tenantID)

	router := gin.New()
	RegisterTenantUserRoutes(router)

	req := httptest.NewRequest(http.MethodGet, "/api/tenant-users/roles", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteAuthError(t, recorder, http.StatusForbidden, "Access denied. Invalid role")
}

func TestReportRoutesAllowFinance(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()
	token := issueRouteJWT(t, constants.RoleFinance, &tenantID)

	router := gin.New()
	registerAuthorizedTestRoute(
		router,
		http.MethodGet,
		"/api/reports/revenue",
		middleware.JWTAuthMiddleware(),
		middleware.RequirePermission(constants.PermViewInvoices, constants.PermViewPayments),
	)

	req := httptest.NewRequest(http.MethodGet, "/api/reports/revenue", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteOK(t, recorder)
}

func TestPaymentProofRoutesAllowFinanceVerification(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()
	token := issueRouteJWT(t, constants.RoleFinance, &tenantID)

	router := gin.New()
	registerAuthorizedTestRoute(
		router,
		http.MethodPost,
		"/api/payment-proofs/:id/verify",
		middleware.JWTAuthMiddleware(),
		middleware.RequirePermission(constants.PermManagePayments),
	)

	req := httptest.NewRequest(http.MethodPost, "/api/payment-proofs/123/verify", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteOK(t, recorder)
}

func TestSubscriptionRoutesAllowFinanceRead(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()
	token := issueRouteJWT(t, constants.RoleFinance, &tenantID)

	router := gin.New()
	registerAuthorizedTestRoute(
		router,
		http.MethodGet,
		"/api/subscription-types",
		middleware.JWTAuthMiddleware(),
		middleware.RequirePermission(
			constants.PermManageSubscriptions,
			constants.PermManageCustomers,
			constants.PermViewCustomers,
		),
	)

	req := httptest.NewRequest(http.MethodGet, "/api/subscription-types", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteOK(t, recorder)
}

func TestServiceAreaRoutesAllowServiceRead(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	tenantID := uuid.New()
	token := issueRouteJWT(t, constants.RoleService, &tenantID)

	router := gin.New()
	registerAuthorizedTestRoute(
		router,
		http.MethodGet,
		"/api/service-areas",
		middleware.JWTAuthMiddleware(),
		middleware.RequirePermission(constants.PermManageCustomers, constants.PermViewCustomers),
	)

	req := httptest.NewRequest(http.MethodGet, "/api/service-areas", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteOK(t, recorder)
}

func TestInvoiceRoutesRejectTenantScopedRoleWithoutTenantID(t *testing.T) {
	t.Setenv("JWT_SECRET", "test-secret")
	gin.SetMode(gin.TestMode)

	token := issueRouteJWT(t, constants.RoleFinance, nil)

	router := gin.New()
	InvoiceRoutes(router)

	req := httptest.NewRequest(http.MethodGet, "/api/invoices", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, req)

	assertRouteAuthError(t, recorder, http.StatusUnauthorized, "Tenant ID wajib untuk role ini")
}
