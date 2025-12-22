package controllers

import (
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"

	"github.com/gin-gonic/gin"
)

// CreateWaterUsage godoc
// @Summary Create water usage record
// @Description Record water meter reading and calculate usage
// @Tags Water Usage
// @Accept json
// @Produce json
// @Param request body requests.CreateWaterUsageRequest true "Create water usage request"
// @Security BearerAuth
// @Success 201 {object} responses.WaterUsageResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/water-usage [post]
func CreateWaterUsage(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}

	var req requests.CreateWaterUsageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Business rule validation: Check reasonable meter reading
	if req.MeterEnd < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter end reading cannot be negative"})
		return
	}

	if req.MeterEnd > 99999999 { // 8 digit max reasonable meter reading
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter reading exceeds maximum allowed value"})
		return
	}

	// Hitung bulan sebelumnya
	prevMonth, err := time.Parse("2006-01", req.UsageMonth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan YYYY-MM"})
		return
	}
	prevMonth = prevMonth.AddDate(0, -1, 0)
	prevMonthStr := prevMonth.Format("2006-01")

	// Ambil meter_end bulan sebelumnya
	var lastUsage models.WaterUsage
	meterStart := 0.0
	if err := config.DB.Where("customer_id = ? AND usage_month = ? AND tenant_id = ?", req.CustomerID, prevMonthStr, tenantID).
		First(&lastUsage).Error; err == nil {
		meterStart = lastUsage.MeterEnd
	}

	if req.MeterEnd < meterStart {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter akhir lebih kecil dari meter sebelumnya"})
		return
	}

	// Ambil data customer
	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", req.CustomerID, tenantID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	// Ambil tarif aktif untuk subscription pelanggan
	var rate models.WaterRate
	if err := config.DB.
		Where("subscription_id = ? AND active = ?", customer.SubscriptionID, true).
		Order("effective_date DESC").
		First(&rate).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tarif air aktif tidak ditemukan"})
		return
	}

	UsageM3 := req.MeterEnd - meterStart

	// Business rule validation: Check reasonable usage amount
	if UsageM3 < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Calculated usage cannot be negative"})
		return
	}

	if UsageM3 > 1000 { // Max 1000 m3 per month seems reasonable
		c.JSON(http.StatusBadRequest, gin.H{"error": "Usage amount exceeds reasonable limit (1000 m3/month)"})
		return
	}

	usage := models.WaterUsage{
		CustomerID:       req.CustomerID,
		UsageMonth:       req.UsageMonth,
		MeterStart:       meterStart,
		MeterEnd:         req.MeterEnd,
		UsageM3:          UsageM3,
		AmountCalculated: UsageM3 * rate.Amount,
		TenantID:         tenantID,
	}

	if err := config.DB.Create(&usage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data"})
		return
	}

	response := responses.WaterUsageResponse{
		ID:               usage.ID,
		CustomerID:       usage.CustomerID,
		UsageMonth:       usage.UsageMonth,
		MeterStart:       usage.MeterStart,
		MeterEnd:         usage.MeterEnd,
		UsageM3:          usage.UsageM3,
		AmountCalculated: usage.AmountCalculated,
		CreatedAt:        usage.CreatedAt,
	}
	c.JSON(http.StatusCreated, response)
}

// GetWaterUsages godoc
// @Summary List water usage records
// @Description Get all water usage records for the tenant
// @Tags Water Usage
// @Accept json
// @Produce json
// @Param customer_id query string false "Filter by customer ID"
// @Param period query string false "Filter by period (YYYY-MM)"
// @Security BearerAuth
// @Success 200 {array} responses.WaterUsageResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/water-usage [get]
func GetWaterUsages(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var records []models.WaterUsage
	query := config.DB.Preload("Customer")
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if err := query.Order("created_at DESC").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
		return
	}

	// Convert to response format
	usageResponses := make([]responses.WaterUsageResponse, len(records))
	for i, record := range records {
		usageResponses[i] = responses.WaterUsageResponse{
			ID:               record.ID,
			CustomerID:       record.CustomerID,
			UsageMonth:       record.UsageMonth,
			MeterStart:       record.MeterStart,
			MeterEnd:         record.MeterEnd,
			UsageM3:          record.UsageM3,
			AmountCalculated: record.AmountCalculated,
			CreatedAt:        record.CreatedAt,
		}
	}

	response := responses.WaterUsageListResponse{
		UsageRecords: usageResponses,
		Total:        len(usageResponses),
	}
	c.JSON(http.StatusOK, response)
}

func GetWaterUsageByID(c *gin.Context) {
	id := c.Param("id")
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}

	var usage models.WaterUsage
	if err := config.DB.Preload("Customer").
		Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&usage).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}

	response := responses.WaterUsageResponse{
		ID:               usage.ID,
		CustomerID:       usage.CustomerID,
		UsageMonth:       usage.UsageMonth,
		MeterStart:       usage.MeterStart,
		MeterEnd:         usage.MeterEnd,
		UsageM3:          usage.UsageM3,
		AmountCalculated: usage.AmountCalculated,
		CreatedAt:        usage.CreatedAt,
	}
	c.JSON(http.StatusOK, response)
}

func UpdateWaterUsage(c *gin.Context) {
	id := c.Param("id")
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}

	var input struct {
		MeterEnd float64 `json:"meter_end"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var usage models.WaterUsage
	if err := config.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&usage).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}

	// Business rule validations
	if input.MeterEnd < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter end reading cannot be negative"})
		return
	}

	if input.MeterEnd > 99999999 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter reading exceeds maximum allowed value"})
		return
	}

	if input.MeterEnd < usage.MeterStart {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter akhir tidak boleh lebih kecil dari awal"})
		return
	}

	// Ambil data customer
	var customer models.Customer
	if err := config.DB.Where("id = ? AND tenant_id = ?", usage.CustomerID, tenantID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pelanggan tidak ditemukan"})
		return
	}

	// Ambil tarif aktif untuk subscription pelanggan
	var rate models.WaterRate
	if err := config.DB.
		Where("subscription_id = ? AND active = ?", customer.SubscriptionID, true).
		Order("effective_date DESC").
		First(&rate).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tarif air aktif tidak ditemukan"})
		return
	}

	UsageM3 := input.MeterEnd - usage.MeterStart

	// Business rule validation: Check reasonable usage amount
	if UsageM3 > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Usage amount exceeds reasonable limit (1000 m3/month)"})
		return
	}

	usage.MeterEnd = input.MeterEnd
	usage.UsageM3 = UsageM3
	usage.AmountCalculated = UsageM3 * rate.Amount

	if err := config.DB.Save(&usage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui data"})
		return
	}

	response := responses.WaterUsageResponse{
		ID:               usage.ID,
		CustomerID:       usage.CustomerID,
		UsageMonth:       usage.UsageMonth,
		MeterStart:       usage.MeterStart,
		MeterEnd:         usage.MeterEnd,
		UsageM3:          usage.UsageM3,
		AmountCalculated: usage.AmountCalculated,
		CreatedAt:        usage.CreatedAt,
	}
	c.JSON(http.StatusOK, response)
}

func DeleteWaterUsage(c *gin.Context) {
	id := c.Param("id")
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}

	var usage models.WaterUsage
	if err := config.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&usage).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}

	if err := config.DB.Delete(&usage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data berhasil dihapus"})
}
