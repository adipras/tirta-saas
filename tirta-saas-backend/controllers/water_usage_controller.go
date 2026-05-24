package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/helpers"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter akhir tidak boleh bernilai negatif"})
		return
	}

	if req.MeterEnd > 99999999 { // 8 digit max reasonable meter reading
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nilai meter melebihi batas maksimum yang diizinkan"})
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
		Where("subscription_id = ? AND active = ? AND tenant_id = ?", customer.SubscriptionID, true, tenantID).
		Order("effective_date DESC").
		First(&rate).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tarif air aktif tidak ditemukan untuk tipe langganan pelanggan ini. Silakan tambahkan atau aktifkan tarif terlebih dahulu di menu Konfigurasi Tarif Air."})
		return
	}

	UsageM3 := req.MeterEnd - meterStart

	// Business rule validation: Check reasonable usage amount
	if UsageM3 < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pemakaian terhitung tidak boleh bernilai negatif"})
		return
	}

	if UsageM3 > 1000 { // Max 1000 m3 per month seems reasonable
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah pemakaian melebihi batas wajar (1000 m3/bulan)"})
		return
	}

	// If client provided an ID, check for existing record to ensure idempotency
	if req.ID != nil {
		var existing models.WaterUsage
		if err := config.DB.Where("id = ? AND tenant_id = ?", *req.ID, tenantID).First(&existing).Error; err == nil {
			// Return existing record — idempotent create
			response := responses.WaterUsageResponse{
				ID:               existing.ID,
				CustomerID:       existing.CustomerID,
				UsageMonth:       existing.UsageMonth,
				MeterStart:       existing.MeterStart,
				MeterEnd:         existing.MeterEnd,
				UsageM3:          existing.UsageM3,
				AmountCalculated: existing.AmountCalculated,
				PhotoURL:         existing.PhotoURL,
				IsDraft:          existing.IsDraft,
				CreatedAt:        existing.CreatedAt,
			}
			helpers.RespondSuccess(c, "Data pencatatan meter sudah ada", response)
			return
		}
	}

	usage := models.WaterUsage{
		CustomerID:       req.CustomerID,
		UsageMonth:       req.UsageMonth,
		MeterStart:       meterStart,
		MeterEnd:         req.MeterEnd,
		UsageM3:          UsageM3,
		AmountCalculated: UsageM3 * rate.Amount,
		TenantID:         tenantID,
		IsDraft:          req.IsDraft,
	}

	// Accept client-generated ID for idempotent sync
	if req.ID != nil {
		usage.ID = *req.ID
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
		PhotoURL:         usage.PhotoURL,
		IsDraft:          usage.IsDraft,
		CreatedAt:        usage.CreatedAt,
	}
	helpers.RespondCreated(c, "Pencatatan meter berhasil disimpan", response)
}

// GetWaterUsages godoc
// @Summary List water usage records (paged)
// @Description Get water usage records for the tenant. Supports pagination and filters.
// @Tags Water Usage
// @Accept json
// @Produce json
// @Param customer_id query string false "Filter by customer ID"
// @Param usage_month query string false "Filter by usage month (YYYY-MM)"
// @Param include_drafts query bool false "Include draft records"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Security BearerAuth
// @Success 200 {object} responses.PaginatedResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/water-usage [get]
func GetWaterUsages(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pagination defaults
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if ps := c.Query("page_size"); ps != "" {
		fmt.Sscanf(ps, "%d", &pageSize)
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	includeDrafts := false
	if c.Query("include_drafts") == "true" {
		includeDrafts = true
	}

	var total int64
	var records []models.WaterUsage
	query := config.DB.Preload("Customer").Model(&models.WaterUsage{})

	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if customerIDStr := c.Query("customer_id"); customerIDStr != "" {
		query = query.Where("customer_id = ?", customerIDStr)
	}

	if usageMonth := c.Query("usage_month"); usageMonth != "" {
		query = query.Where("usage_month = ?", usageMonth)
	}

	if !includeDrafts {
		query = query.Where("is_draft = ?", false)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung data"})
		return
	}

	// Fetch page
	offset := (page - 1) * pageSize
	tq := query.Order("usage_month DESC, created_at DESC").Offset(offset).Limit(pageSize)
	if err := tq.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
		return
	}

	// Convert to response format
	usageResponses := make([]responses.WaterUsageResponse, len(records))
	for i, record := range records {
		r := responses.WaterUsageResponse{
			ID:               record.ID,
			CustomerID:       record.CustomerID,
			UsageMonth:       record.UsageMonth,
			MeterStart:       record.MeterStart,
			MeterEnd:         record.MeterEnd,
			UsageM3:          record.UsageM3,
			AmountCalculated: record.AmountCalculated,
			PhotoURL:         record.PhotoURL,
			IsDraft:          record.IsDraft,
			CreatedAt:        record.CreatedAt,
		}
		if record.Customer.ID != uuid.Nil {
			r.Customer = &responses.WaterUsageCustomer{
				ID:          record.Customer.ID,
				Name:        record.Customer.Name,
				MeterNumber: record.Customer.MeterNumber,
				Address:     record.Customer.Address,
			}
		}
		usageResponses[i] = r
	}

	meta := responses.PaginationMeta{
		CurrentPage: page,
		PageSize:    pageSize,
		TotalPages:  int((total + int64(pageSize) - 1) / int64(pageSize)),
		TotalItems:  int(total),
	}

	c.JSON(http.StatusOK, responses.PaginatedResponse{
		Status:  "success",
		Message: "Water usages retrieved successfully",
		Data:    usageResponses,
		Meta:    meta,
	})
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
		PhotoURL:         usage.PhotoURL,
		IsDraft:          usage.IsDraft,
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
		MeterEnd *float64 `json:"meter_end,omitempty"`
		Notes    *string  `json:"notes,omitempty"`
		IsDraft  *bool    `json:"is_draft,omitempty"`
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

	// If updating meter end
	if input.MeterEnd != nil {
		if *input.MeterEnd < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Meter akhir tidak boleh bernilai negatif"})
			return
		}
		if *input.MeterEnd > 99999999 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nilai meter melebihi batas maksimum yang diizinkan"})
			return
		}
		if *input.MeterEnd < usage.MeterStart {
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
			Where("subscription_id = ? AND active = ? AND tenant_id = ?", customer.SubscriptionID, true, tenantID).
			Order("effective_date DESC").
			First(&rate).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tarif air aktif tidak ditemukan untuk tipe langganan pelanggan ini. Silakan tambahkan atau aktifkan tarif terlebih dahulu di menu Konfigurasi Tarif Air."})
			return
		}

		UsageM3 := *input.MeterEnd - usage.MeterStart

		// Business rule validation: Check reasonable usage amount
		if UsageM3 > 1000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah pemakaian melebihi batas wajar (1000 m3/bulan)"})
			return
		}

		usage.MeterEnd = *input.MeterEnd
		usage.UsageM3 = UsageM3
		usage.AmountCalculated = UsageM3 * rate.Amount
	}

	// Handle draft flag changes: if finalizing (IsDraft=false) ensure no existing finalized record for same customer/month
	if input.IsDraft != nil {
		if usage.IsDraft && !*input.IsDraft {
			// finalizing
			var existing models.WaterUsage
			if err := config.DB.Where("customer_id = ? AND usage_month = ? AND tenant_id = ? AND is_draft = ?", usage.CustomerID, usage.UsageMonth, tenantID, false).First(&existing).Error; err == nil {
				c.JSON(http.StatusConflict, gin.H{"error": "Terdapat data final yang sudah ada untuk pelanggan dan periode ini. Batalkan draft atau hapus data tersebut terlebih dahulu."})
				return
			}
		}
		usage.IsDraft = *input.IsDraft
	}

	if input.Notes != nil {
		usage.Notes = *input.Notes
	}

	if err := config.DB.Model(&usage).Select("MeterEnd", "UsageM3", "AmountCalculated", "IsDraft", "Notes").Updates(&usage).Error; err != nil {
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
		PhotoURL:         usage.PhotoURL,
		IsDraft:          usage.IsDraft,
		CreatedAt:        usage.CreatedAt,
	}
	helpers.RespondSuccess(c, "Data pencatatan meter berhasil diperbarui", response)
}

func UploadWaterUsagePhoto(c *gin.Context) {
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

	file, err := c.FormFile("photo")
	if err != nil || file == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Foto meter wajib diunggah"})
		return
	}

	uploadConfig := utils.DefaultImageUploadConfig()
	uploadConfig.UploadDir = fmt.Sprintf("uploads/water-usage/%s", tenantID.String())
	uploadPath, err := utils.SaveUploadedFile(file, uploadConfig)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal mengunggah foto meter: " + err.Error()})
		return
	}

	normalizedPath := strings.ReplaceAll(uploadPath, "\\", "/")
	if usage.PhotoURL != "" && usage.PhotoURL != normalizedPath {
		_ = utils.DeleteFile(usage.PhotoURL)
	}

	if err := config.DB.Model(&usage).Update("photo_url", normalizedPath).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan foto meter"})
		return
	}
	usage.PhotoURL = normalizedPath

	response := responses.WaterUsageResponse{
		ID:               usage.ID,
		CustomerID:       usage.CustomerID,
		UsageMonth:       usage.UsageMonth,
		MeterStart:       usage.MeterStart,
		MeterEnd:         usage.MeterEnd,
		UsageM3:          usage.UsageM3,
		AmountCalculated: usage.AmountCalculated,
		PhotoURL:         usage.PhotoURL,
		IsDraft:          usage.IsDraft,
		CreatedAt:        usage.CreatedAt,
	}
	helpers.RespondSuccess(c, "Foto meter berhasil diunggah", response)
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
