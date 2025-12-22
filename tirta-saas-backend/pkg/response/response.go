package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// StandardResponse represents the standard API response format
type StandardResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Error     *ErrorInfo  `json:"error,omitempty"`
	Meta      *Meta       `json:"meta,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	TraceID   string      `json:"trace_id,omitempty"`
}

// ErrorInfo provides detailed error information
type ErrorInfo struct {
	Code    string                 `json:"code"`
	Message string                 `json:"message"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// Meta provides pagination and additional metadata
type Meta struct {
	Page       int `json:"page,omitempty"`
	PerPage    int `json:"per_page,omitempty"`
	Total      int `json:"total,omitempty"`
	TotalPages int `json:"total_pages,omitempty"`
}

// PaginationRequest represents pagination parameters
type PaginationRequest struct {
	Page    int `form:"page" binding:"min=1" json:"page"`
	PerPage int `form:"per_page" binding:"min=1,max=100" json:"per_page"`
}

// DefaultPagination returns default pagination values
func DefaultPagination() PaginationRequest {
	return PaginationRequest{
		Page:    1,
		PerPage: 10,
	}
}

// Success sends a successful response
func Success(c *gin.Context, data interface{}, message ...string) {
	msg := "Success"
	if len(message) > 0 {
		msg = message[0]
	}

	response := StandardResponse{
		Success:   true,
		Message:   msg,
		Data:      data,
		Timestamp: time.Now().UTC(),
	}

	// Add trace ID if available
	if traceID, exists := c.Get("trace_id"); exists {
		if tid, ok := traceID.(string); ok {
			response.TraceID = tid
		}
	}

	c.JSON(http.StatusOK, response)
}

// Created sends a successful creation response
func Created(c *gin.Context, data interface{}, message ...string) {
	msg := "Resource created successfully"
	if len(message) > 0 {
		msg = message[0]
	}

	response := StandardResponse{
		Success:   true,
		Message:   msg,
		Data:      data,
		Timestamp: time.Now().UTC(),
	}

	// Add trace ID if available
	if traceID, exists := c.Get("trace_id"); exists {
		if tid, ok := traceID.(string); ok {
			response.TraceID = tid
		}
	}

	c.JSON(http.StatusCreated, response)
}

// SuccessWithPagination sends a successful response with pagination metadata
func SuccessWithPagination(c *gin.Context, data interface{}, meta Meta, message ...string) {
	msg := "Success"
	if len(message) > 0 {
		msg = message[0]
	}

	response := StandardResponse{
		Success:   true,
		Message:   msg,
		Data:      data,
		Meta:      &meta,
		Timestamp: time.Now().UTC(),
	}

	// Add trace ID if available
	if traceID, exists := c.Get("trace_id"); exists {
		if tid, ok := traceID.(string); ok {
			response.TraceID = tid
		}
	}

	c.JSON(http.StatusOK, response)
}

// Error sends an error response
func Error(c *gin.Context, statusCode int, code, message string, details ...map[string]interface{}) {
	errorInfo := &ErrorInfo{
		Code:    code,
		Message: message,
	}

	if len(details) > 0 {
		errorInfo.Details = details[0]
	}

	response := StandardResponse{
		Success:   false,
		Error:     errorInfo,
		Timestamp: time.Now().UTC(),
	}

	// Add trace ID if available
	if traceID, exists := c.Get("trace_id"); exists {
		if tid, ok := traceID.(string); ok {
			response.TraceID = tid
		}
	}

	c.JSON(statusCode, response)
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusBadRequest, "BAD_REQUEST", message, details...)
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusUnauthorized, "UNAUTHORIZED", message, details...)
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusForbidden, "FORBIDDEN", message, details...)
}

// NotFound sends a 404 Not Found response
func NotFound(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusNotFound, "NOT_FOUND", message, details...)
}

// Conflict sends a 409 Conflict response
func Conflict(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusConflict, "CONFLICT", message, details...)
}

// UnprocessableEntity sends a 422 Unprocessable Entity response
func UnprocessableEntity(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusUnprocessableEntity, "UNPROCESSABLE_ENTITY", message, details...)
}

// TooManyRequests sends a 429 Too Many Requests response
func TooManyRequests(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusTooManyRequests, "TOO_MANY_REQUESTS", message, details...)
}

// InternalServerError sends a 500 Internal Server Error response
func InternalServerError(c *gin.Context, message string, details ...map[string]interface{}) {
	Error(c, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message, details...)
}

// ValidationError sends a validation error response
func ValidationError(c *gin.Context, errors []ValidationErrorDetail) {
	details := map[string]interface{}{
		"validation_errors": errors,
	}
	UnprocessableEntity(c, "Validation failed", details)
}

// ValidationErrorDetail represents a single validation error
type ValidationErrorDetail struct {
	Field   string `json:"field"`
	Tag     string `json:"tag"`
	Value   interface{} `json:"value,omitempty"`
	Message string `json:"message"`
}

// DatabaseError sends a database error response
func DatabaseError(c *gin.Context, operation string, err error) {
	details := map[string]interface{}{
		"operation": operation,
		"error":     err.Error(),
	}
	InternalServerError(c, "Database operation failed", details)
}

// AuthenticationError sends an authentication error response
func AuthenticationError(c *gin.Context, reason string) {
	details := map[string]interface{}{
		"reason": reason,
	}
	Unauthorized(c, "Authentication failed", details)
}

// AuthorizationError sends an authorization error response
func AuthorizationError(c *gin.Context, resource string, action string) {
	details := map[string]interface{}{
		"resource": resource,
		"action":   action,
	}
	Forbidden(c, "Access denied", details)
}

// BusinessRuleError sends a business rule violation error response
func BusinessRuleError(c *gin.Context, rule string, message string) {
	details := map[string]interface{}{
		"rule": rule,
	}
	UnprocessableEntity(c, message, details)
}

// PaymentError sends a payment-related error response
func PaymentError(c *gin.Context, errorType string, message string, details ...map[string]interface{}) {
	var d map[string]interface{}
	if len(details) > 0 {
		d = details[0]
	} else {
		d = make(map[string]interface{})
	}
	
	d["payment_error_type"] = errorType
	UnprocessableEntity(c, message, d)
}

// TenantError sends a tenant-related error response
func TenantError(c *gin.Context, tenantID uuid.UUID, message string) {
	details := map[string]interface{}{
		"tenant_id": tenantID.String(),
	}
	BadRequest(c, message, details)
}

// CustomerError sends a customer-related error response
func CustomerError(c *gin.Context, customerID uuid.UUID, message string) {
	details := map[string]interface{}{
		"customer_id": customerID.String(),
	}
	BadRequest(c, message, details)
}