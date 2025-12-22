package controllers

import (
	"fmt"
	"net/http"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TariffController struct {
	DB *gorm.DB
}

func NewTariffController(db *gorm.DB) *TariffController {
	return &TariffController{DB: db}
}

// CreateTariffCategory creates a new tariff category
// CreateTariffCategory godoc
// @Summary Create tariff category
// @Description Create a new tariff category for water pricing
// @Tags Tariffs
// @Accept json
// @Produce json
// @Param request body requests.CreateTariffCategoryRequest true "Create tariff category request"
// @Security BearerAuth
// @Success 201 {object} responses.TariffCategoryResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/water-rates/tariffs/categories [post]
func (ctrl *TariffController) CreateTariffCategory(c *gin.Context) {
	var req requests.CreateTariffCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := c.GetString("tenant_id")
	tenantUUID, _ := uuid.Parse(tenantID)

	// Check if code already exists
	var existing models.TariffCategory
	if err := ctrl.DB.Where("tenant_id = ? AND code = ?", tenantID, req.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Tariff category code already exists"})
		return
	}

	category := models.TariffCategory{
		TenantID:    tenantUUID,
		Code:        req.Code,
		Name:        req.Name,
		Type:        req.Type,
		Description: req.Description,
		IsActive:    true,
	}

	if err := ctrl.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create tariff category"})
		return
	}

	response := responses.ToTariffCategoryResponse(&category)
	c.JSON(http.StatusCreated, gin.H{"message": "Tariff category created successfully", "data": response})
}

// GetTariffCategories lists all tariff categories
// GetTariffCategories godoc
// @Summary List tariff categories
// @Description Get all tariff categories for the tenant
// @Tags Tariffs
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} responses.TariffCategoryResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/water-rates/tariffs/categories [get]
func (ctrl *TariffController) GetTariffCategories(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	categoryType := c.Query("type")

	var categories []models.TariffCategory
	query := ctrl.DB.Where("tenant_id = ?", tenantID)

	if categoryType != "" {
		query = query.Where("type = ?", categoryType)
	}

	if err := query.Order("display_order ASC, name ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tariff categories"})
		return
	}

	categoryResponses := make([]responses.TariffCategoryResponse, len(categories))
	for i, cat := range categories {
		categoryResponses[i] = responses.ToTariffCategoryResponse(&cat)
	}

	c.JSON(http.StatusOK, gin.H{"data": categoryResponses})
}

// GetTariffCategory gets a single tariff category
func (ctrl *TariffController) GetTariffCategory(c *gin.Context) {
	categoryID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedID, err := uuid.Parse(categoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var category models.TariffCategory
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tariff category not found"})
		return
	}

	response := responses.ToTariffCategoryResponse(&category)
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// UpdateTariffCategory updates a tariff category
func (ctrl *TariffController) UpdateTariffCategory(c *gin.Context) {
	categoryID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req requests.UpdateTariffCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(categoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var category models.TariffCategory
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tariff category not found"})
		return
	}

	category.Name = req.Name
	category.Description = req.Description
	category.DisplayOrder = req.DisplayOrder
	if req.IsActive != nil {
		category.IsActive = *req.IsActive
	}

	if err := ctrl.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tariff category"})
		return
	}

	response := responses.ToTariffCategoryResponse(&category)
	c.JSON(http.StatusOK, gin.H{"message": "Tariff category updated successfully", "data": response})
}

// DeleteTariffCategory deletes a tariff category
func (ctrl *TariffController) DeleteTariffCategory(c *gin.Context) {
	categoryID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedID, err := uuid.Parse(categoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Check if has progressive rates
	var rateCount int64
	ctrl.DB.Model(&models.ProgressiveRate{}).Where("category_id = ?", parsedID).Count(&rateCount)
	if rateCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete category with existing progressive rates"})
		return
	}

	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).Delete(&models.TariffCategory{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tariff category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tariff category deleted successfully"})
}

// CreateProgressiveRate creates a new progressive rate
// CreateProgressiveRate godoc
// @Summary Create progressive rate
// @Description Create a new progressive rate tier for a tariff category
// @Tags Tariffs
// @Accept json
// @Produce json
// @Param request body requests.CreateProgressiveRateRequest true "Create progressive rate request"
// @Security BearerAuth
// @Success 201 {object} responses.ProgressiveRateResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/water-rates/tariffs/progressive-rates [post]
func (ctrl *TariffController) CreateProgressiveRate(c *gin.Context) {
	var req requests.CreateProgressiveRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := c.GetString("tenant_id")
	tenantUUID, _ := uuid.Parse(tenantID)

	categoryUUID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Verify category exists
	var category models.TariffCategory
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", categoryUUID, tenantID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tariff category not found"})
		return
	}

	rate := models.ProgressiveRate{
		TenantID:     tenantUUID,
		CategoryID:   categoryUUID,
		MinVolume:    req.MinVolume,
		MaxVolume:    req.MaxVolume,
		PricePerUnit: req.PricePerUnit,
		DisplayOrder: req.DisplayOrder,
		IsActive:     true,
	}

	if err := ctrl.DB.Create(&rate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create progressive rate"})
		return
	}

	// Load category for response
	ctrl.DB.Preload("Category").First(&rate, rate.ID)
	response := responses.ToProgressiveRateResponse(&rate)
	c.JSON(http.StatusCreated, gin.H{"message": "Progressive rate created successfully", "data": response})
}

// GetProgressiveRates lists progressive rates for a category
func (ctrl *TariffController) GetProgressiveRates(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	categoryID := c.Query("category_id")

	query := ctrl.DB.Preload("Category").Where("tenant_id = ?", tenantID)

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	var rates []models.ProgressiveRate
	if err := query.Order("display_order ASC, min_volume ASC").Find(&rates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch progressive rates"})
		return
	}

	rateResponses := make([]responses.ProgressiveRateResponse, len(rates))
	for i, rate := range rates {
		rateResponses[i] = responses.ToProgressiveRateResponse(&rate)
	}

	c.JSON(http.StatusOK, gin.H{"data": rateResponses})
}

// UpdateProgressiveRate updates a progressive rate
func (ctrl *TariffController) UpdateProgressiveRate(c *gin.Context) {
	rateID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req requests.UpdateProgressiveRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(rateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rate ID"})
		return
	}

	var rate models.ProgressiveRate
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&rate).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Progressive rate not found"})
		return
	}

	rate.MinVolume = req.MinVolume
	rate.MaxVolume = req.MaxVolume
	rate.PricePerUnit = req.PricePerUnit
	rate.DisplayOrder = req.DisplayOrder
	if req.IsActive != nil {
		rate.IsActive = *req.IsActive
	}

	if err := ctrl.DB.Save(&rate).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update progressive rate"})
		return
	}

	ctrl.DB.Preload("Category").First(&rate, rate.ID)
	response := responses.ToProgressiveRateResponse(&rate)
	c.JSON(http.StatusOK, gin.H{"message": "Progressive rate updated successfully", "data": response})
}

// DeleteProgressiveRate deletes a progressive rate
func (ctrl *TariffController) DeleteProgressiveRate(c *gin.Context) {
	rateID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedID, err := uuid.Parse(rateID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rate ID"})
		return
	}

	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).Delete(&models.ProgressiveRate{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete progressive rate"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progressive rate deleted successfully"})
}

// SimulateBill simulates bill calculation based on progressive rates
func (ctrl *TariffController) SimulateBill(c *gin.Context) {
	var req requests.SimulateBillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := c.GetString("tenant_id")
	categoryUUID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Get category
	var category models.TariffCategory
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", categoryUUID, tenantID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tariff category not found"})
		return
	}

	// Get progressive rates for this category
	var rates []models.ProgressiveRate
	if err := ctrl.DB.Where("category_id = ? AND is_active = ?", categoryUUID, true).
		Order("min_volume ASC").Find(&rates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch progressive rates"})
		return
	}

	if len(rates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active progressive rates found for this category"})
		return
	}

	// Calculate bill
	remainingVolume := req.UsageVolume
	totalAmount := 0.0
	var breakdown []responses.BillSimulationBreakdown

	for _, rate := range rates {
		if remainingVolume <= 0 {
			break
		}

		var volumeInTier float64
		tierMax := remainingVolume

		if rate.MaxVolume != nil && remainingVolume > (*rate.MaxVolume-rate.MinVolume) {
			tierMax = *rate.MaxVolume - rate.MinVolume
		}

		if tierMax < 0 {
			continue
		}

		volumeInTier = tierMax
		if volumeInTier > remainingVolume {
			volumeInTier = remainingVolume
		}

		tierAmount := volumeInTier * rate.PricePerUnit
		totalAmount += tierAmount

		tierRange := fmt.Sprintf("%.0f - ", rate.MinVolume)
		if rate.MaxVolume != nil {
			tierRange += fmt.Sprintf("%.0f m³", *rate.MaxVolume)
		} else {
			tierRange += "unlimited m³"
		}

		breakdown = append(breakdown, responses.BillSimulationBreakdown{
			TierRange:    tierRange,
			Volume:       volumeInTier,
			PricePerUnit: rate.PricePerUnit,
			Amount:       tierAmount,
		})

		remainingVolume -= volumeInTier
	}

	response := responses.BillSimulationResponse{
		Category:    responses.ToTariffCategoryResponse(&category),
		UsageVolume: req.UsageVolume,
		TotalAmount: totalAmount,
		Breakdown:   breakdown,
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}
