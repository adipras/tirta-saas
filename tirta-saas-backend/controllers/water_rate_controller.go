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
		Amount         float64   `json:"amount"`
		EffectiveDate  string    `json:"effective_date"` // YYYY-MM-DD
		SubscriptionID uuid.UUID `json:"subscription_id"`
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

	rate := models.WaterRate{
		Amount:         input.Amount,
		EffectiveDate:  date,
		Active:         true,
		SubscriptionID: input.SubscriptionID,
		TenantID:       tenantID,
	}

	if err := config.DB.Create(&rate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat tarif"})
		return
	}

	c.JSON(http.StatusCreated, rate)
}

func GetWaterRates(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var rates []models.WaterRate
	query := config.DB.Preload("Subscription")
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if err := query.Order("effective_date DESC").Find(&rates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
		return
	}

	c.JSON(http.StatusOK, rates)
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

	query := config.DB.Preload("Subscription").Where("active = ?", true)
	
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

	c.JSON(http.StatusOK, rate)
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
		Amount        float64 `json:"amount"`
		EffectiveDate string  `json:"effective_date"` // YYYY-MM-DD
		Active        bool    `json:"active"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", input.EffectiveDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal tidak valid"})
		return
	}

	// If activating this rate, deactivate others for the same subscription
	if input.Active && !rate.Active {
		config.DB.Model(&models.WaterRate{}).
			Where("subscription_id = ? AND tenant_id = ? AND id != ?", 
				rate.SubscriptionID, tenantID, rateID).
			Update("active", false)
	}

	rate.Amount = input.Amount
	rate.EffectiveDate = date
	rate.Active = input.Active

	if err := config.DB.Save(&rate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui tarif"})
		return
	}

	c.JSON(http.StatusOK, rate)
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

	c.JSON(http.StatusOK, gin.H{"message": "Tarif air berhasil dihapus"})
}
