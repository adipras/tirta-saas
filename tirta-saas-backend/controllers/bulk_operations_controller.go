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

	// New CSV format: name, email, phone, address, meter_number, subscription_type_id, install_date, initial_reading
	// Optional: password, is_active, service_area_id, reading_route_id
	requiredHeaders := []string{"name", "meter_number", "subscription_type_id", "install_date"}
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
	var importErrors []string

	getField := func(record []string, key string) string {
		if idx, ok := headerMap[key]; ok && idx < len(record) {
			return strings.TrimSpace(record[idx])
		}
		return ""
	}

	// tracks name (lowercase) → customer ID for multi-meter rows within one import batch
	nameToCustomerID := make(map[string]uuid.UUID)

	// Read and process records
	lineNumber := 1
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		lineNumber++

		if err != nil {
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Failed to read - %s", lineNumber, err.Error()))
			failureCount++
			continue
		}

		name := getField(record, "name")
		meterNumber := getField(record, "meter_number")
		subscriptionTypeIDRaw := getField(record, "subscription_type_id")
		installDateRaw := getField(record, "install_date")

		if name == "" || meterNumber == "" || subscriptionTypeIDRaw == "" || installDateRaw == "" {
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Missing required fields (name, meter_number, subscription_type_id, install_date)", lineNumber))
			failureCount++
			continue
		}

		// Check meter_number uniqueness in meters table
		var existingMeter models.Meter
		if err := config.DB.Where("tenant_id = ? AND meter_number = ? AND deleted_at IS NULL", tenantID, meterNumber).First(&existingMeter).Error; err == nil {
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Nomor meter '%s' sudah digunakan", lineNumber, meterNumber))
			skippedCount++
			continue
		}

		subscriptionTypeID, err := uuid.Parse(subscriptionTypeIDRaw)
		if err != nil {
			importErrors = append(importErrors, fmt.Sprintf("Line %d: subscription_type_id '%s' tidak valid", lineNumber, subscriptionTypeIDRaw))
			failureCount++
			continue
		}

		var subscriptionType models.SubscriptionType
		if err := config.DB.Where("tenant_id = ? AND id = ?", tenantID, subscriptionTypeID).First(&subscriptionType).Error; err != nil {
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Jenis langganan '%s' tidak ditemukan", lineNumber, subscriptionTypeIDRaw))
			failureCount++
			continue
		}

		installDate, err := time.Parse("2006-01-02", installDateRaw)
		if err != nil {
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Format install_date tidak valid, gunakan YYYY-MM-DD", lineNumber))
			failureCount++
			continue
		}

		initialReadingRaw := getField(record, "initial_reading")
		var initialReading float64
		if initialReadingRaw != "" {
			if _, err := fmt.Sscanf(initialReadingRaw, "%f", &initialReading); err != nil {
				initialReading = 0
			}
		}

		normalizedName := strings.ToLower(name)
		existingCustomerID, isAdditionalMeter := nameToCustomerID[normalizedName]

		if isAdditionalMeter {
			// Add meter to the customer created earlier in this batch
			tx := config.DB.Begin()
			meter := models.Meter{
				TenantID:           tenantID,
				CustomerID:         existingCustomerID,
				MeterNumber:        meterNumber,
				SubscriptionTypeID: &subscriptionTypeID,
				InstallDate:        installDate,
				InitialReading:     initialReading,
				LocationName:       getField(record, "location_name"),
				Status:             models.MeterStatusActive,
			}
			if err := tx.Create(&meter).Error; err != nil {
				tx.Rollback()
				importErrors = append(importErrors, fmt.Sprintf("Line %d: Failed to create meter - %s", lineNumber, err.Error()))
				failureCount++
				continue
			}
			if err := tx.Commit().Error; err != nil {
				importErrors = append(importErrors, fmt.Sprintf("Line %d: Failed to commit - %s", lineNumber, err.Error()))
				failureCount++
				continue
			}
			successCount++
			continue
		}

		// New customer: validate email and password, then create customer + first meter
		email := getField(record, "email")
		if email != "" {
			var existingByEmail models.Customer
			if err := config.DB.Where("tenant_id = ? AND email = ?", tenantID, email).First(&existingByEmail).Error; err == nil {
				importErrors = append(importErrors, fmt.Sprintf("Line %d: Email '%s' sudah digunakan", lineNumber, email))
				skippedCount++
				continue
			}
		}

		password := getField(record, "password")
		hashedPassword := ""
		if password != "" {
			if len(password) < 6 {
				importErrors = append(importErrors, fmt.Sprintf("Line %d: Password minimal 6 karakter", lineNumber))
				failureCount++
				continue
			}
			hashedPassword, err = utils.HashPassword(password)
			if err != nil {
				importErrors = append(importErrors, fmt.Sprintf("Line %d: Failed to hash password", lineNumber))
				failureCount++
				continue
			}
		}

		isActive := false
		if v := getField(record, "is_active"); strings.ToLower(v) == "true" {
			isActive = true
		}

		// Mini-transaction: create customer + meter (no registration invoice for import)
		tx := config.DB.Begin()

		customer := models.Customer{
			TenantID:       tenantID,
			Name:           name,
			Address:        getField(record, "address"),
			Phone:          getField(record, "phone"),
			Email:          email,
			Password:       hashedPassword,
			SubscriptionID: subscriptionType.ID,
			IsActive:       isActive,
		}

		if err := tx.Create(&customer).Error; err != nil {
			tx.Rollback()
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Failed to create customer - %s", lineNumber, err.Error()))
			failureCount++
			continue
		}

		meter := models.Meter{
			TenantID:           tenantID,
			CustomerID:         customer.ID,
			MeterNumber:        meterNumber,
			SubscriptionTypeID: &subscriptionTypeID,
			InstallDate:        installDate,
			InitialReading:     initialReading,
			LocationName:       getField(record, "location_name"),
			Status:             models.MeterStatusActive,
		}
		if err := tx.Create(&meter).Error; err != nil {
			tx.Rollback()
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Failed to create meter - %s", lineNumber, err.Error()))
			failureCount++
			continue
		}

		if err := tx.Commit().Error; err != nil {
			importErrors = append(importErrors, fmt.Sprintf("Line %d: Failed to commit - %s", lineNumber, err.Error()))
			failureCount++
			continue
		}

		nameToCustomerID[normalizedName] = customer.ID
		successCount++
	}

	duration := time.Since(startTime)

	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: fmt.Sprintf("Bulk import completed: %d succeeded, %d failed, %d skipped. Import tidak menghasilkan invoice registrasi.", successCount, failureCount, skippedCount),
		Data: responses.BulkOperationResponse{
			TotalRecords: successCount + failureCount + skippedCount,
			SuccessCount: successCount,
			FailureCount: failureCount,
			SkippedCount: skippedCount,
			Errors:       importErrors,
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

	query = query.Order("created_at ASC")

	if err := query.Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch customers",
			Error:   err.Error(),
		})
		return
	}

	// Set headers for CSV download
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=customers_export_%s.csv", time.Now().Format("20060102_150405")))

	// Create CSV writer
	writer := csv.NewWriter(c.Writer)
	// Use semicolon to match common Excel regional settings (e.g. Indonesian locale)
	// so columns are parsed correctly instead of appearing in a single column.
	writer.Comma = ';'
	defer writer.Flush()

	// Write header
	headers := []string{
		"Name", "Address", "Phone", "Email",
		"Is Active", "Created At",
	}
	if err := writer.Write(headers); err != nil {
		return
	}

	// Write data
	for _, customer := range customers {
		record := []string{
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

	if _, err := time.Parse("2006-01", req.UsageMonth); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan YYYY-MM"})
		return
	}

	type recordResult struct {
		Row         int    `json:"row"`
		MeterNumber string `json:"meter_number"`
		Error       string `json:"error,omitempty"`
	}

	var successCount, failedCount int
	var errs []recordResult

	for i, rec := range req.Records {
		rowNum := i + 1

		var meter models.Meter
		var customer models.Customer

		if rec.MeterNumber != "" {
			// Look up meter by meter_number
			if err := config.DB.Where("meter_number = ? AND tenant_id = ? AND deleted_at IS NULL", rec.MeterNumber, tenantID).First(&meter).Error; err != nil {
				errs = append(errs, recordResult{Row: rowNum, MeterNumber: rec.MeterNumber, Error: "Meter tidak ditemukan"})
				failedCount++
				continue
			}
			if err := config.DB.Where("id = ? AND tenant_id = ?", meter.CustomerID, tenantID).First(&customer).Error; err != nil {
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
			// Get first active meter for customer
			if err := config.DB.Where("customer_id = ? AND status = 'active' AND deleted_at IS NULL", customer.ID).First(&meter).Error; err != nil {
				errs = append(errs, recordResult{Row: rowNum, Error: "Tidak ada meter aktif untuk pelanggan ini"})
				failedCount++
				continue
			}
		} else {
			errs = append(errs, recordResult{Row: rowNum, Error: "meter_number atau customer_id harus diisi"})
			failedCount++
			continue
		}

		meterStart, meterStartSource, _ := services.ResolveWaterUsageMeterStart(config.DB, meter.ID, req.UsageMonth)

		if rec.MeterEnd < meterStart {
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: meter.MeterNumber, Error: "Meter akhir lebih kecil dari meter sebelumnya"})
			failedCount++
			continue
		}

		// Get rate from meter's subscription type (not customer's deprecated SubscriptionID)
		var subscriptionIDForRate = customer.SubscriptionID
		if meter.SubscriptionTypeID != nil {
			subscriptionIDForRate = *meter.SubscriptionTypeID
		}
		var rate models.WaterRate
		if err := config.DB.
			Where("subscription_id = ? AND active = ? AND tenant_id = ?", subscriptionIDForRate, true, tenantID).
			Order("effective_date DESC").
			First(&rate).Error; err != nil {
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: meter.MeterNumber, Error: "Tarif air aktif tidak ditemukan"})
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
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: meter.MeterNumber, Error: message})
			failedCount++
			continue
		}

		meterID := meter.ID
		usage := models.WaterUsage{
			CustomerID:       customer.ID,
			MeterID:          &meterID,
			UsageMonth:       req.UsageMonth,
			MeterStart:       meterStart,
			MeterStartSource: meterStartSource,
			MeterEnd:         rec.MeterEnd,
			UsageM3:          usageM3,
			AmountCalculated: amountCalculated,
			TenantID:         tenantID,
			Notes:            rec.Notes,
		}

		if err := config.DB.Create(&usage).Error; err != nil {
			errs = append(errs, recordResult{Row: rowNum, MeterNumber: meter.MeterNumber, Error: "Gagal menyimpan: " + err.Error()})
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
