package controllers

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ServiceAreaController struct {
	DB *gorm.DB
}

func NewServiceAreaController(db *gorm.DB) *ServiceAreaController {
	return &ServiceAreaController{DB: db}
}

// CreateServiceArea creates a new service area
// CreateServiceArea godoc
// @Summary Create service area
// @Description Create a new service area (RT/RW zone)
// @Tags Service Areas
// @Accept json
// @Produce json
// @Param request body requests.CreateServiceAreaRequest true "Create service area request"
// @Security BearerAuth
// @Success 201 {object} responses.ServiceAreaResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/service-areas [post]
func (ctrl *ServiceAreaController) CreateServiceArea(c *gin.Context) {
	var req requests.CreateServiceAreaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := c.GetString("tenant_id")
	tenantUUID, _ := uuid.Parse(tenantID)

	// Check if code already exists
	var existing models.ServiceArea
	if err := ctrl.DB.Where("tenant_id = ? AND code = ?", tenantID, req.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Service area code already exists"})
		return
	}

	serviceArea := models.ServiceArea{
		TenantID:     tenantUUID,
		Code:         req.Code,
		Name:         req.Name,
		Type:         req.Type,
		Description:  req.Description,
		Population:   req.Population,
		CoverageArea: req.CoverageArea,
		IsActive:     true,
	}

	if req.ParentID != nil {
		parentUUID, err := uuid.Parse(*req.ParentID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parent ID"})
			return
		}
		serviceArea.ParentID = &parentUUID
	}

	if err := ctrl.DB.Create(&serviceArea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service area"})
		return
	}

	response := responses.ToServiceAreaResponse(&serviceArea)
	c.JSON(http.StatusCreated, gin.H{"message": "Service area created successfully", "data": response})
}

// GetServiceAreas lists all service areas
// GetServiceAreas godoc
// @Summary List service areas
// @Description Get all service areas for the tenant
// @Tags Service Areas
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} responses.ServiceAreaResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/service-areas [get]
func (ctrl *ServiceAreaController) GetServiceAreas(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	areaType := c.Query("type")

	var serviceAreas []models.ServiceArea
	query := ctrl.DB.Where("tenant_id = ?", tenantID)

	if areaType != "" {
		query = query.Where("type = ?", areaType)
	}

	if err := query.Preload("Parent").Preload("Children").Order("code ASC").Find(&serviceAreas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service areas"})
		return
	}

	// Count customers in each area
	for i := range serviceAreas {
		var count int64
		ctrl.DB.Model(&models.Customer{}).Where("service_area_id = ?", serviceAreas[i].ID).Count(&count)
		serviceAreas[i].CustomerCount = int(count)
	}

	serviceAreaResponses := make([]responses.ServiceAreaResponse, len(serviceAreas))
	for i, area := range serviceAreas {
		serviceAreaResponses[i] = responses.ToServiceAreaResponse(&area)
	}

	c.JSON(http.StatusOK, gin.H{"data": serviceAreaResponses, "total": len(serviceAreaResponses)})
}

// GetServiceArea gets a single service area
func (ctrl *ServiceAreaController) GetServiceArea(c *gin.Context) {
	areaID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedID, err := uuid.Parse(areaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service area ID"})
		return
	}

	var serviceArea models.ServiceArea
	if err := ctrl.DB.Preload("Parent").Preload("Children").
		Where("id = ? AND tenant_id = ?", parsedID, tenantID).
		First(&serviceArea).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service area not found"})
		return
	}

	// Count customers
	var count int64
	ctrl.DB.Model(&models.Customer{}).Where("service_area_id = ?", serviceArea.ID).Count(&count)
	serviceArea.CustomerCount = int(count)

	response := responses.ToServiceAreaResponse(&serviceArea)
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// UpdateServiceArea updates a service area
func (ctrl *ServiceAreaController) UpdateServiceArea(c *gin.Context) {
	areaID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req requests.UpdateServiceAreaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedID, err := uuid.Parse(areaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service area ID"})
		return
	}

	var serviceArea models.ServiceArea
	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).First(&serviceArea).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service area not found"})
		return
	}

	serviceArea.Name = req.Name
	serviceArea.Description = req.Description
	serviceArea.Population = req.Population
	serviceArea.CoverageArea = req.CoverageArea
	if req.IsActive != nil {
		serviceArea.IsActive = *req.IsActive
	}

	if err := ctrl.DB.Save(&serviceArea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service area"})
		return
	}

	response := responses.ToServiceAreaResponse(&serviceArea)
	c.JSON(http.StatusOK, gin.H{"message": "Service area updated successfully", "data": response})
}

// DeleteServiceArea deletes a service area
func (ctrl *ServiceAreaController) DeleteServiceArea(c *gin.Context) {
	areaID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	parsedID, err := uuid.Parse(areaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service area ID"})
		return
	}

	// Check if has customers
	var customerCount int64
	ctrl.DB.Model(&models.Customer{}).Where("service_area_id = ?", parsedID).Count(&customerCount)
	if customerCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete service area with existing customers"})
		return
	}

	// Check if has children
	var childrenCount int64
	ctrl.DB.Model(&models.ServiceArea{}).Where("parent_id = ?", parsedID).Count(&childrenCount)
	if childrenCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete service area with child areas"})
		return
	}

	if err := ctrl.DB.Where("id = ? AND tenant_id = ?", parsedID, tenantID).Delete(&models.ServiceArea{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service area"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service area deleted successfully"})
}
