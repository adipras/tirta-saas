package audit

import (
	"encoding/json"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditEntry represents the structure for creating audit logs
type AuditEntry struct {
	Action       models.AuditAction
	Resource     string
	ResourceID   *uuid.UUID
	Level        models.AuditLevel
	Description  string
	OldValues    interface{}
	NewValues    interface{}
	Success      bool
	ErrorMessage string
	Metadata     map[string]interface{}
}

// AuditService handles audit logging operations
type AuditService struct {
	db *gorm.DB
}

// NewAuditService creates a new audit service instance
func NewAuditService() *AuditService {
	return &AuditService{
		db: config.DB,
	}
}

// Log creates an audit log entry
func (s *AuditService) Log(c *gin.Context, entry AuditEntry) error {
	// Extract context information
	var userID, customerID, tenantID *uuid.UUID

	if uid, exists := c.Get("user_id"); exists {
		if u, ok := uid.(uuid.UUID); ok {
			userID = &u
		}
	}

	if cid, exists := c.Get("customer_id"); exists {
		if cu, ok := cid.(uuid.UUID); ok {
			customerID = &cu
		}
	}

	if tid, exists := c.Get("tenant_id"); exists {
		if t, ok := tid.(uuid.UUID); ok {
			tenantID = &t
		}
	}

	// If no tenant ID in context, skip audit (may be unauthenticated endpoint)
	if tenantID == nil {
		return nil
	}

	// Serialize old and new values
	var oldValuesJSON, newValuesJSON, metadataJSON *string

	if entry.OldValues != nil {
		if data, err := json.Marshal(entry.OldValues); err == nil {
			str := string(data)
			oldValuesJSON = &str
		}
	}

	if entry.NewValues != nil {
		if data, err := json.Marshal(entry.NewValues); err == nil {
			str := string(data)
			newValuesJSON = &str
		}
	}

	if entry.Metadata != nil {
		if data, err := json.Marshal(entry.Metadata); err == nil {
			str := string(data)
			metadataJSON = &str
		}
	}

	// Handle error message
	var errorMsg *string
	if entry.ErrorMessage != "" {
		errorMsg = &entry.ErrorMessage
	}

	// Get request duration if available
	var duration int64
	if start, exists := c.Get("start_time"); exists {
		if startTime, ok := start.(time.Time); ok {
			duration = time.Since(startTime).Milliseconds()
		}
	}

	// Create audit log
	auditLog := models.AuditLog{
		TenantID:     *tenantID,
		UserID:       userID,
		CustomerID:   customerID,
		Action:       entry.Action,
		Resource:     entry.Resource,
		ResourceID:   entry.ResourceID,
		Level:        entry.Level,
		Description:  entry.Description,
		OldValues:    oldValuesJSON,
		NewValues:    newValuesJSON,
		IPAddress:    c.ClientIP(),
		UserAgent:    c.Request.UserAgent(),
		Endpoint:     c.Request.URL.Path,
		Method:       c.Request.Method,
		StatusCode:   c.Writer.Status(),
		Duration:     duration,
		Success:      entry.Success,
		ErrorMessage: errorMsg,
		Metadata:     metadataJSON,
		CreatedAt:    time.Now(),
	}

	// Save to database
	if err := s.db.Create(&auditLog).Error; err != nil {
		logger.Error("Failed to create audit log", err, map[string]interface{}{
			"audit_entry": entry,
			"tenant_id":   tenantID,
		})
		return err
	}

	// Also log to structured logger for immediate visibility
	logFields := map[string]interface{}{
		"audit_id":    auditLog.ID,
		"action":      string(entry.Action),
		"resource":    entry.Resource,
		"level":       string(entry.Level),
		"success":     entry.Success,
		"tenant_id":   tenantID,
		"ip_address":  auditLog.IPAddress,
		"endpoint":    auditLog.Endpoint,
		"method":      auditLog.Method,
	}

	if userID != nil {
		logFields["user_id"] = userID
	}
	if customerID != nil {
		logFields["customer_id"] = customerID
	}
	if entry.ResourceID != nil {
		logFields["resource_id"] = entry.ResourceID
	}

	switch entry.Level {
	case models.LevelCritical:
		logger.Error("AUDIT: "+entry.Description, nil, logFields)
	case models.LevelWarning:
		logger.Warn("AUDIT: "+entry.Description, logFields)
	default:
		logger.Info("AUDIT: "+entry.Description, logFields)
	}

	return nil
}

// Global audit service instance
var auditService *AuditService

func init() {
	auditService = NewAuditService()
}

// LogCreate audits resource creation
func LogCreate(c *gin.Context, resource string, resourceID uuid.UUID, newValues interface{}) {
	auditService.Log(c, AuditEntry{
		Action:      models.ActionCreate,
		Resource:    resource,
		ResourceID:  &resourceID,
		Level:       models.LevelInfo,
		Description: "Resource created: " + resource,
		NewValues:   newValues,
		Success:     true,
	})
}

// LogUpdate audits resource updates
func LogUpdate(c *gin.Context, resource string, resourceID uuid.UUID, oldValues, newValues interface{}) {
	auditService.Log(c, AuditEntry{
		Action:      models.ActionUpdate,
		Resource:    resource,
		ResourceID:  &resourceID,
		Level:       models.LevelInfo,
		Description: "Resource updated: " + resource,
		OldValues:   oldValues,
		NewValues:   newValues,
		Success:     true,
	})
}

// LogDelete audits resource deletion
func LogDelete(c *gin.Context, resource string, resourceID uuid.UUID, oldValues interface{}) {
	auditService.Log(c, AuditEntry{
		Action:      models.ActionDelete,
		Resource:    resource,
		ResourceID:  &resourceID,
		Level:       models.LevelWarning,
		Description: "Resource deleted: " + resource,
		OldValues:   oldValues,
		Success:     true,
	})
}

// LogLogin audits login attempts
func LogLogin(c *gin.Context, userType, identifier string, success bool, errorMsg string) {
	level := models.LevelInfo
	if !success {
		level = models.LevelWarning
	}

	auditService.Log(c, AuditEntry{
		Action:       models.ActionLogin,
		Resource:     userType,
		Level:        level,
		Description:  "Login attempt for " + userType + ": " + identifier,
		Success:      success,
		ErrorMessage: errorMsg,
		Metadata: map[string]interface{}{
			"user_type":  userType,
			"identifier": identifier,
		},
	})
}

// LogPayment audits payment operations
func LogPayment(c *gin.Context, invoiceID, paymentID uuid.UUID, amount float64, success bool, errorMsg string) {
	level := models.LevelInfo
	if !success {
		level = models.LevelCritical
	}

	auditService.Log(c, AuditEntry{
		Action:       models.ActionPayment,
		Resource:     "payment",
		ResourceID:   &paymentID,
		Level:        level,
		Description:  "Payment processed",
		Success:      success,
		ErrorMessage: errorMsg,
		Metadata: map[string]interface{}{
			"invoice_id": invoiceID,
			"amount":     amount,
		},
	})
}

// LogPasswordChange audits password changes
func LogPasswordChange(c *gin.Context, userType string, userID uuid.UUID, success bool) {
	level := models.LevelWarning
	if !success {
		level = models.LevelCritical
	}

	auditService.Log(c, AuditEntry{
		Action:      models.ActionPasswordChange,
		Resource:    userType,
		ResourceID:  &userID,
		Level:       level,
		Description: "Password changed for " + userType,
		Success:     success,
	})
}

// LogActivation audits customer activation
func LogActivation(c *gin.Context, customerID uuid.UUID, activated bool) {
	action := models.ActionActivation
	description := "Customer activated"
	if !activated {
		action = models.ActionDeactivation
		description = "Customer deactivated"
	}

	auditService.Log(c, AuditEntry{
		Action:      action,
		Resource:    "customer",
		ResourceID:  &customerID,
		Level:       models.LevelWarning,
		Description: description,
		Success:     true,
	})
}

// LogInvoiceGeneration audits invoice generation
func LogInvoiceGeneration(c *gin.Context, usageMonth string, invoiceCount int, success bool, errorMsg string) {
	level := models.LevelInfo
	if !success {
		level = models.LevelCritical
	}

	auditService.Log(c, AuditEntry{
		Action:       models.ActionInvoiceGeneration,
		Resource:     "invoice",
		Level:        level,
		Description:  "Monthly invoice generation",
		Success:      success,
		ErrorMessage: errorMsg,
		Metadata: map[string]interface{}{
			"usage_month":   usageMonth,
			"invoice_count": invoiceCount,
		},
	})
}

// LogSensitiveOperation audits any sensitive operation
func LogSensitiveOperation(c *gin.Context, action models.AuditAction, resource string, description string, metadata map[string]interface{}) {
	auditService.Log(c, AuditEntry{
		Action:      action,
		Resource:    resource,
		Level:       models.LevelCritical,
		Description: description,
		Success:     true,
		Metadata:    metadata,
	})
}

// AuditMiddleware logs all requests (optional - can be resource intensive)
func AuditMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Store start time for duration calculation
		c.Set("start_time", time.Now())

		// Skip audit for health checks and non-sensitive endpoints
		path := c.Request.URL.Path
		if path == "/health" || path == "/ready" || path == "/metrics" {
			c.Next()
			return
		}

		c.Next()

		// Only audit authenticated requests
		if _, exists := c.Get("tenant_id"); !exists {
			return
		}

		// Determine if this is a sensitive operation
		method := c.Request.Method
		if method == "POST" || method == "PUT" || method == "DELETE" {
			level := models.LevelInfo
			if method == "DELETE" {
				level = models.LevelWarning
			}

			auditService.Log(c, AuditEntry{
				Action:      models.AuditAction(method),
				Resource:    "api_request",
				Level:       level,
				Description: "API request: " + method + " " + path,
				Success:     c.Writer.Status() < 400,
			})
		}
	}
}

// GetAuditLogs retrieves audit logs with pagination
func GetAuditLogs(tenantID uuid.UUID, page, perPage int, filters map[string]interface{}) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := config.DB.Model(&models.AuditLog{}).Where("tenant_id = ?", tenantID)

	// Apply filters
	if action, ok := filters["action"]; ok {
		query = query.Where("action = ?", action)
	}
	if resource, ok := filters["resource"]; ok {
		query = query.Where("resource = ?", resource)
	}
	if level, ok := filters["level"]; ok {
		query = query.Where("level = ?", level)
	}
	if userID, ok := filters["user_id"]; ok {
		query = query.Where("user_id = ?", userID)
	}
	if customerID, ok := filters["customer_id"]; ok {
		query = query.Where("customer_id = ?", customerID)
	}
	if from, ok := filters["from"]; ok {
		query = query.Where("created_at >= ?", from)
	}
	if to, ok := filters["to"]; ok {
		query = query.Where("created_at <= ?", to)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}