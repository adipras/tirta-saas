package controllers

import (
	"github.com/adipras/tirta-saas-backend/helpers"
	"net/http"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CreateWaterRate(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}

	var input struct {
		Amount         float64    `json:"amount"`
		EffectiveDate  string     `json:"effective_date"` // YYYY-MM-DD
		SubscriptionID uuid.UUID  `json:"subscription_id"`
		CategoryID     *uuid.UUID `json:"category_id"`
		Description    string     `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set existing rates for same subscription to inactive
	config.DB.Model(&models.WaterRate{}).
		Where("subscription_id = ? AND tenant_id = ?", input.SubscriptionID, tenantID).
		Update("active", false)

	date, err := time.Parse("2006-01-02", input.EffectiveDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal tidak valid"})
		return
	}

	if input.CategoryID != nil {
		var category models.TariffCategory
		if err := config.DB.Where("id = ? AND tenant_id = ?", *input.CategoryID, tenantID).First(&category).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tarif tidak valid"})
			return
		}
	}

	rate := models.WaterRate{
		Amount:         input.Amount,
		EffectiveDate:  date,
		Active:         true,
		SubscriptionID: input.SubscriptionID,
		TenantID:       tenantID,
		CategoryID:     input.CategoryID,
		Description:    input.Description,
	}

	if err := config.DB.Create(&rate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat tarif"})
		return
	}

	config.DB.Preload("Subscription").Preload("Category").First(&rate, "id = ?", rate.ID)

	helpers.RespondCreated(c, "Tarif air berhasil dibuat", rate)
}

func GetWaterRates(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid tenant context", err)
		return
	}

	var rates []models.WaterRate
	query := config.DB.Preload("Subscription").Preload("Category")

	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	// Filter by active status if provided
	if activeParam := c.Query("active"); activeParam != "" {
		query = query.Where("active = ?", activeParam == "true")
	}

	if subscriptionID := c.Query("subscription_id"); subscriptionID != "" {
		query = query.Where("subscription_id = ?", subscriptionID)
	}

	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if err := query.Order("effective_date DESC").Find(&rates).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch water rates", err)
		return
	}

	helpers.RespondSuccess(c, "Water rates retrieved successfully", rates)
}

// GetWaterRate godoc
// @Summary Get water rate by ID
// @Description Get a specific water rate by ID
// @Tags Water Rates
// @Accept json
// @Produce json
// @Param id path string true "Water Rate ID"
// @Security BearerAuth
// @Success 200 {object} models.WaterRate
// @Failure 404 {object} map[string]interface{}
// @Router /api/water-rates/{id} [get]
func GetWaterRate(c *gin.Context) {
	id := c.Param("id")
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var rate models.WaterRate
	query := config.DB.Preload("Subscription").Preload("Category")

	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.First(&rate, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Water rate not found"})
		return
	}

	helpers.RespondSuccess(c, "Detail tarif air berhasil diambil", rate)
}

// GetCurrentWaterRate godoc
// @Summary Get current active water rate
// @Description Get the currently active water rate for a tenant
// @Tags Water Rates
// @Accept json
// @Produce json
// @Param subscription_id query string false "Filter by subscription type ID"
// @Security BearerAuth
// @Success 200 {object} models.WaterRate
// @Failure 404 {object} map[string]interface{}
// @Router /api/water-rates/current [get]
func GetCurrentWaterRate(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := config.DB.Preload("Subscription").Preload("Category").Where("active = ?", true)

	// Filter by tenant if specified
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}

	// Optional filter by subscription type
	if subscriptionID := c.Query("subscription_id"); subscriptionID != "" {
		query = query.Where("subscription_id = ?", subscriptionID)
	}

	var rate models.WaterRate
	if err := query.Order("effective_date DESC").First(&rate).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active water rate found"})
		return
	}

	helpers.RespondSuccess(c, "Tarif air aktif berhasil diambil", rate)
}

func UpdateWaterRate(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	rateID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid water rate ID"})
		return
	}

	var rate models.WaterRate
	if err := config.DB.Where("id = ? AND tenant_id = ?", rateID, tenantID).
		First(&rate).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarif air tidak ditemukan"})
		return
	}

	var input struct {
		Amount        *float64 `json:"amount"`
		EffectiveDate *string  `json:"effective_date"` // YYYY-MM-DD
		Active        *bool    `json:"active"`
		CategoryID    *string  `json:"category_id"`
		Description   *string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If activating this rate, deactivate others for the same subscription
	if input.Active != nil && *input.Active && !rate.Active {
		config.DB.Model(&models.WaterRate{}).
			Where("subscription_id = ? AND tenant_id = ? AND id != ?",
				rate.SubscriptionID, tenantID, rateID).
			Update("active", false)
	}

	updates := map[string]interface{}{}

	if input.Amount != nil {
		rate.Amount = *input.Amount
		updates["amount"] = *input.Amount
	}

	if input.EffectiveDate != nil {
		date, err := time.Parse("2006-01-02", *input.EffectiveDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal tidak valid"})
			return
		}

		rate.EffectiveDate = date
		updates["effective_date"] = date
	}

	if input.Active != nil {
		rate.Active = *input.Active
		updates["active"] = *input.Active
	}

	if input.CategoryID != nil {
		if *input.CategoryID == "" {
			rate.CategoryID = nil
			updates["category_id"] = nil
		} else {
			parsedCategoryID, err := uuid.Parse(*input.CategoryID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tarif tidak valid"})
				return
			}

			var category models.TariffCategory
			if err := config.DB.Where("id = ? AND tenant_id = ?", parsedCategoryID, tenantID).First(&category).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tarif tidak valid"})
				return
			}

			rate.CategoryID = &parsedCategoryID
			updates["category_id"] = parsedCategoryID
		}
	}

	if input.Description != nil {
		rate.Description = *input.Description
		updates["description"] = *input.Description
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada perubahan yang dikirim"})
		return
	}

	if err := config.DB.Model(&rate).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui tarif"})
		return
	}

	config.DB.Preload("Subscription").Preload("Category").First(&rate, "id = ?", rate.ID)

	helpers.RespondSuccess(c, "Tarif air berhasil diperbarui", rate)
}

func DeleteWaterRate(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	rateID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid water rate ID"})
		return
	}

	var rate models.WaterRate
	if err := config.DB.Where("id = ? AND tenant_id = ?", rateID, tenantID).
		First(&rate).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tarif air tidak ditemukan"})
		return
	}

	if err := config.DB.Delete(&rate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus tarif"})
		return
	}

	helpers.RespondSuccess(c, "Tarif air berhasil dihapus", gin.H{
		"deleted": true,
		"id":      rate.ID,
	})
}
