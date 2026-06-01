package controllers

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/helpers"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/services"
	"github.com/adipras/tirta-saas-backend/utils"
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

	if _, err := utils.ValidateFile(file, utils.DefaultCSVUploadConfig()); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid file format",
			Error:   err.Error(),
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
	requiredHeaders := []string{"name", "meter_number", "address", "phone", "subscription_id"}
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
		subscriptionIDRaw := strings.TrimSpace(record[headerMap["subscription_id"]])

		// Validate required fields
		if name == "" || meterNumber == "" || subscriptionIDRaw == "" {
			errors = append(errors, fmt.Sprintf("Line %d: Missing name, meter number, or subscription_id", lineNumber))
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

		password := ""
		if idx, exists := headerMap["password"]; exists && idx < len(record) {
			password = strings.TrimSpace(record[idx])
		}

		if email != "" {
			var existingCustomerByEmail models.Customer
			if err := config.DB.Where("tenant_id = ? AND email = ?", tenantID, email).First(&existingCustomerByEmail).Error; err == nil {
				errors = append(errors, fmt.Sprintf("Line %d: Email '%s' already exists", lineNumber, email))
				skippedCount++
				continue
			}
		}

		hashedPassword := ""
		if password != "" {
			if len(password) < 6 {
				errors = append(errors, fmt.Sprintf("Line %d: Password minimal 6 karakter", lineNumber))
				failureCount++
				continue
			}

			hashedPassword, err = utils.HashPassword(password)
			if err != nil {
				errors = append(errors, fmt.Sprintf("Line %d: Failed to hash password - %s", lineNumber, err.Error()))
				failureCount++
				continue
			}
		}

		isActive := true
		if idx, exists := headerMap["is_active"]; exists && idx < len(record) {
			isActive = strings.ToLower(strings.TrimSpace(record[idx])) == "true"
		}

		subscriptionID, err := uuid.Parse(subscriptionIDRaw)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Line %d: subscription_id '%s' is not a valid UUID", lineNumber, subscriptionIDRaw))
			failureCount++
			continue
		}

		// Validate subscription type for tenant
		var subscriptionType models.SubscriptionType
		if err := config.DB.Where("tenant_id = ? AND id = ?", tenantID, subscriptionID).First(&subscriptionType).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Line %d: subscription_id '%s' not found for tenant", lineNumber, subscriptionIDRaw))
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
			Password:       hashedPassword,
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
		"address":   true,
		"phone":     true,
		"email":     true,
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

	query = query.Order("meter_number ASC")

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

// BulkImportWaterUsage imports multiple water usage records at once via JSON body
func BulkImportWaterUsage(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var req struct {
		UsageMonth string `json:"usage_month" binding:"required"`
		Records    []struct {
			MeterNumber string  `json:"meter_number"`
			CustomerID  string  `json:"customer_id"`
			MeterEnd    float64 `json:"meter_end"`
			Notes       string  `json:"notes"`
		} `json:"records" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prevMonth, err := time.Parse("2006-01", req.UsageMonth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan YYYY-MM"})
		return
	}
	prevMonthStr := prevMonth.AddDate(0, -1, 0).Format("2006-01")

	type recordResult struct {
		Row         int    `json:"row"`
		MeterNumber string `json:"meter_number"`
		Error       string `json:"error,omitempty"`
	}

	var successCount, failedCount int
	var errs []recordResult

	for i, rec := range req.Records {
		rowNum := i + 1

		var customer models.Customer
		if rec.MeterNumber != "" {
			if err := config.DB.Where("meter_number = ? AND tenant_id = ?", rec.MeterNumber, tenantID).First(&customer).Error; err != nil {
				errs = append(errs, recordResult{Row: rowNum, MeterNumber: rec.MeterNumber, Error: "Pelanggan tidak ditemukan"})
				failedCount++
				continue
			}
		} else if rec.CustomerID != "" {
			custID, parseErr := uuid.Parse(rec.CustomerID)
			if parseErr != nil {
				errs = append(errs, recordResult{Row: rowNum, Error: "customer_id tidak valid"})
				failedCount++
				continue
			}
			if err := config.DB.Where("id = ? AND tenant_id = ?", custID, tenantID).First(&customer).Error; err != nil {
				errs = append(errs, recordResult{Row: rowNum, Error: "Pelanggan tidak ditemukan"})
				failedCount++
				continue
			}
		} else {
			errs = append(errs, recordResult{Row: rowNum, Error: "meter_number atau customer_id harus diisi"})
			failedCount++
			continue
		}

		var lastUsage models.WaterUsage
		meterStart := 0.0
		if err := config.DB.Where("customer_id = ? AND usage_month = ? AND tenant_id = ?", customer.ID, prevMonthStr, tenantID).First(&lastUsage).Error; err == nil {
			meterStart = lastUsage.MeterEnd
		} else {
			// Tidak ada data bulan sebelumnya — pakai InitialReading meter aktif pelanggan
			var activeMeter models.Meter
			if err := config.DB.
				Where("customer_id = ? AND tenant_id = ? AND status = ?", customer.ID, tenantID, "active").
				First(&activeMeter).Error; err == nil && activeMeter.InitialReading > 0 {
				meterStart = activeMeter.InitialReading
			}
		}

		if rec.MeterEnd < meterStart {
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: customer.MeterNumber, Error: "Meter akhir lebih kecil dari meter sebelumnya"})
			failedCount++
			continue
		}

		var rate models.WaterRate
		if err := config.DB.
			Where("subscription_id = ? AND active = ? AND tenant_id = ?", customer.SubscriptionID, true, tenantID).
			Order("effective_date DESC").
			First(&rate).Error; err != nil {
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: customer.MeterNumber, Error: "Tarif air aktif tidak ditemukan"})
			failedCount++
			continue
		}

		usageM3 := rec.MeterEnd - meterStart
		amountCalculated, err := services.CalculateWaterUsageCharge(config.DB, tenantID, rate, usageM3)
		if err != nil {
			message := "Gagal menghitung tarif pemakaian"
			if errors.Is(err, services.ErrNoActiveProgressiveRates) || errors.Is(err, services.ErrIncompleteProgressiveRates) {
				message = err.Error()
			}
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: customer.MeterNumber, Error: message})
			failedCount++
			continue
		}

		usage := models.WaterUsage{
			CustomerID:       customer.ID,
			UsageMonth:       req.UsageMonth,
			MeterStart:       meterStart,
			MeterEnd:         rec.MeterEnd,
			UsageM3:          usageM3,
			AmountCalculated: amountCalculated,
			TenantID:         tenantID,
			Notes:            rec.Notes,
		}

		if err := config.DB.Create(&usage).Error; err != nil {
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: customer.MeterNumber, Error: "Gagal menyimpan: " + err.Error()})
			failedCount++
			continue
		}
		successCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": successCount,
		"failed":  failedCount,
		"total":   len(req.Records),
		"errors":  errs,
	})
}
