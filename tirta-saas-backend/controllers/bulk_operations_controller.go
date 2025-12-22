package controllers

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// BulkImportCustomers imports customers from CSV file
func BulkImportCustomers(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "No file uploaded",
			Error:   err.Error(),
		})
		return
	}
	
	// Check file extension
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".csv") {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid file format",
			Error:   "Only CSV files are allowed",
		})
		return
	}
	
	// Open file
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to open file",
			Error:   err.Error(),
		})
		return
	}
	defer f.Close()
	
	// Parse CSV
	reader := csv.NewReader(f)
	
	// Read header
	headers, err := reader.Read()
	if err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to read CSV headers",
			Error:   err.Error(),
		})
		return
	}
	
	// Validate headers
	requiredHeaders := []string{"name", "meter_number", "address", "phone"}
	headerMap := make(map[string]int)
	for i, header := range headers {
		headerMap[strings.ToLower(strings.TrimSpace(header))] = i
	}
	
	for _, required := range requiredHeaders {
		if _, exists := headerMap[required]; !exists {
			c.JSON(http.StatusBadRequest, responses.ErrorResponse{
				Status:  "error",
				Message: "Missing required header",
				Error:   fmt.Sprintf("Required header '%s' not found", required),
			})
			return
		}
	}
	
	startTime := time.Now()
	var successCount, failureCount, skippedCount int
	var errors []string
	
	// Read and process records
	lineNumber := 1
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		lineNumber++
		
		if err != nil {
			errors = append(errors, fmt.Sprintf("Line %d: Failed to read - %s", lineNumber, err.Error()))
			failureCount++
			continue
		}
		
		// Extract data
		name := strings.TrimSpace(record[headerMap["name"]])
		meterNumber := strings.TrimSpace(record[headerMap["meter_number"]])
		if meterIdx, exists := headerMap["meter_number"]; !exists || meterIdx >= len(record) {
			meterNumber = fmt.Sprintf("MTR-%d-%d", time.Now().Unix(), lineNumber)
		}
		address := strings.TrimSpace(record[headerMap["address"]])
		phone := strings.TrimSpace(record[headerMap["phone"]])
		
		// Validate required fields
		if name == "" || meterNumber == "" {
			errors = append(errors, fmt.Sprintf("Line %d: Missing name or meter number", lineNumber))
			failureCount++
			continue
		}
		
		// Check if customer already exists
		var existingCustomer models.Customer
		if err := config.DB.Where("tenant_id = ? AND meter_number = ?", tenantID, meterNumber).First(&existingCustomer).Error; err == nil {
			errors = append(errors, fmt.Sprintf("Line %d: Meter number '%s' already exists", lineNumber, meterNumber))
			skippedCount++
			continue
		}
		
		// Optional fields
		email := ""
		if idx, exists := headerMap["email"]; exists && idx < len(record) {
			email = strings.TrimSpace(record[idx])
		}
		
		isActive := true
		if idx, exists := headerMap["is_active"]; exists && idx < len(record) {
			isActive = strings.ToLower(strings.TrimSpace(record[idx])) == "true"
		}
		
		// Get default subscription type for tenant
		var subscriptionType models.SubscriptionType
		if err := config.DB.Where("tenant_id = ?", tenantID).First(&subscriptionType).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Line %d: No subscription type found for tenant", lineNumber))
			failureCount++
			continue
		}
		
		// Create customer
		customer := models.Customer{
			TenantID:       tenantID,
			MeterNumber:    meterNumber,
			Name:           name,
			Address:        address,
			Phone:          phone,
			Email:          email,
			SubscriptionID: subscriptionType.ID,
			IsActive:       isActive,
		}
		
		if err := config.DB.Create(&customer).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Line %d: Failed to create customer - %s", lineNumber, err.Error()))
			failureCount++
			continue
		}
		
		successCount++
	}
	
	duration := time.Since(startTime)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: fmt.Sprintf("Bulk import completed: %d succeeded, %d failed, %d skipped", successCount, failureCount, skippedCount),
		Data: responses.BulkOperationResponse{
			TotalRecords: successCount + failureCount + skippedCount,
			SuccessCount: successCount,
			FailureCount: failureCount,
			SkippedCount: skippedCount,
			Errors:       errors,
			ProcessedAt:  time.Now(),
			DurationMs:   duration.Milliseconds(),
		},
	})
}

// BulkUpdateCustomers updates multiple customers at once
func BulkUpdateCustomers(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var req struct {
		CustomerIDs []string               `json:"customer_ids" binding:"required"`
		Updates     map[string]interface{} `json:"updates" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	if len(req.CustomerIDs) == 0 {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "No customer IDs provided",
			Error:   "customer_ids cannot be empty",
		})
		return
	}
	
	startTime := time.Now()
	var successCount, failureCount int
	var errors []string
	
	// Allowed fields to update
	allowedFields := map[string]bool{
		"is_active": true,
		"address":  true,
		"phone":    true,
		"email":    true,
	}
	
	// Validate updates
	for key := range req.Updates {
		if !allowedFields[key] {
			c.JSON(http.StatusBadRequest, responses.ErrorResponse{
				Status:  "error",
				Message: "Invalid update field",
				Error:   fmt.Sprintf("Field '%s' cannot be bulk updated", key),
			})
			return
		}
	}
	
	for _, customerID := range req.CustomerIDs {
		var customer models.Customer
		if err := config.DB.Where("id = ? AND tenant_id = ?", customerID, tenantID).First(&customer).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Customer %s: not found", customerID))
			failureCount++
			continue
		}
		
		// Apply updates
		if err := config.DB.Model(&customer).Updates(req.Updates).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Customer %s: update failed - %s", customerID, err.Error()))
			failureCount++
			continue
		}
		
		successCount++
	}
	
	duration := time.Since(startTime)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: fmt.Sprintf("Bulk update completed: %d succeeded, %d failed", successCount, failureCount),
		Data: responses.BulkOperationResponse{
			TotalRecords: len(req.CustomerIDs),
			SuccessCount: successCount,
			FailureCount: failureCount,
			Errors:       errors,
			ProcessedAt:  time.Now(),
			DurationMs:   duration.Milliseconds(),
		},
	})
}

// BulkActivateCustomers activates multiple customers
func BulkActivateCustomers(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var req struct {
		CustomerIDs []string `json:"customer_ids" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	startTime := time.Now()
	
	result := config.DB.Model(&models.Customer{}).
		Where("id IN ? AND tenant_id = ?", req.CustomerIDs, tenantID).
		Updates(map[string]interface{}{
			"is_active": true,
		})
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to activate customers",
			Error:   result.Error.Error(),
		})
		return
	}
	
	duration := time.Since(startTime)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: fmt.Sprintf("Successfully activated %d customers", result.RowsAffected),
		Data: responses.BulkOperationResponse{
			TotalRecords: len(req.CustomerIDs),
			SuccessCount: int(result.RowsAffected),
			FailureCount: len(req.CustomerIDs) - int(result.RowsAffected),
			ProcessedAt:  time.Now(),
			DurationMs:   duration.Milliseconds(),
		},
	})
}

// ExportCustomers exports customers to CSV
func ExportCustomers(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var customers []models.Customer
	query := config.DB.Where("tenant_id = ?", tenantID)
	
	// Apply filters
	if isActive := c.Query("is_active"); isActive != "" {
		active, _ := strconv.ParseBool(isActive)
		query = query.Where("is_active = ?", active)
	}
	
	query = query.Order("customer_code ASC")
	
	if err := query.Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch customers",
			Error:   err.Error(),
		})
		return
	}
	
	// Set headers for CSV download
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=customers_export_%s.csv", time.Now().Format("20060102_150405")))
	
	// Create CSV writer
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()
	
	// Write header
	headers := []string{
		"Meter Number", "Name", "Address", "Phone", "Email",
		"Is Active", "Created At",
	}
	if err := writer.Write(headers); err != nil {
		return
	}
	
	// Write data
	for _, customer := range customers {
		record := []string{
			customer.MeterNumber,
			customer.Name,
			customer.Address,
			customer.Phone,
			customer.Email,
			fmt.Sprintf("%t", customer.IsActive),
			customer.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(record); err != nil {
			return
		}
	}
}
