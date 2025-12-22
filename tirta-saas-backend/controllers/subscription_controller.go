package controllers

import (
	"github.com/adipras/tirta-saas-backend/helpers"
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateSubscriptionType godoc
// @Summary Create subscription type
// @Description Create a new subscription type/plan
// @Tags Subscriptions
// @Accept json
// @Produce json
// @Param request body requests.CreateSubscriptionTypeRequest true "Create subscription type request"
// @Security BearerAuth
// @Success 200 {object} responses.SubscriptionTypeResponse
// @Failure 400 {object} map[string]interface{}
// @Router /api/subscription-types [post]
func CreateSubscriptionType(c *gin.Context) {
	var req requests.CreateSubscriptionTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID, err := helpers.RequireTenantID(c)


	if err != nil {


		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})


		return


	}

	sub := models.SubscriptionType{
		Name:            req.Name,
		Description:     req.Description,
		RegistrationFee: req.RegistrationFee,
		MonthlyFee:      req.MonthlyFee,
		MaintenanceFee:  req.MaintenanceFee,
		LateFeePerDay:   req.LateFeePerDay,
		MaxLateFee:      req.MaxLateFee,
		TenantID:        tenantID,
	}

	if err := config.DB.Create(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan SubscriptionType"})
		return
	}

	res := responses.SubscriptionTypeResponse{
		ID:              sub.ID,
		Name:            sub.Name,
		Description:     sub.Description,
		RegistrationFee: sub.RegistrationFee,
		MonthlyFee:      sub.MonthlyFee,
		MaintenanceFee:  sub.MaintenanceFee,
		LateFeePerDay:   sub.LateFeePerDay,
		MaxLateFee:      sub.MaxLateFee,
		CreatedAt:       sub.CreatedAt,
	}

	c.JSON(http.StatusCreated, res)
}

// GetAllSubscriptionTypes godoc
// @Summary List subscription types
// @Description Get all subscription types/plans for the tenant
// @Tags Subscriptions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} responses.SubscriptionTypeResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/subscription-types [get]
func GetAllSubscriptionTypes(c *gin.Context) {
	tenantID, hasSpecificTenant, err := helpers.GetTenantIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var subscriptions []models.SubscriptionType
	query := config.DB
	
	if hasSpecificTenant {
		query = query.Where("tenant_id = ?", tenantID)
	}
	
	if err := query.Find(&subscriptions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data subscription types"})
		return
	}

	var responseList []responses.SubscriptionTypeResponse
	for _, sub := range subscriptions {
		res := responses.SubscriptionTypeResponse{
			ID:              sub.ID,
			Name:            sub.Name,
			Description:     sub.Description,
			RegistrationFee: sub.RegistrationFee,
			MonthlyFee:      sub.MonthlyFee,
			MaintenanceFee:  sub.MaintenanceFee,
			LateFeePerDay:   sub.LateFeePerDay,
			MaxLateFee:      sub.MaxLateFee,
			CreatedAt:       sub.CreatedAt,
		}
		responseList = append(responseList, res)
	}

	c.JSON(http.StatusOK, responseList)
}

// GetSubscriptionType godoc
// @Summary Get subscription type
// @Description Get a specific subscription type by ID
// @Tags Subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription Type ID"
// @Security BearerAuth
// @Success 200 {object} responses.SubscriptionTypeResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/subscription-types/{id} [get]
func GetSubscriptionType(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	subID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription type ID"})
		return
	}

	var sub models.SubscriptionType
	if err := config.DB.Where("id = ? AND tenant_id = ?", subID, tenantID).First(&sub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription type tidak ditemukan"})
		return
	}

	res := responses.SubscriptionTypeResponse{
		ID:              sub.ID,
		Name:            sub.Name,
		Description:     sub.Description,
		RegistrationFee: sub.RegistrationFee,
		MonthlyFee:      sub.MonthlyFee,
		MaintenanceFee:  sub.MaintenanceFee,
		LateFeePerDay:   sub.LateFeePerDay,
		MaxLateFee:      sub.MaxLateFee,
		CreatedAt:       sub.CreatedAt,
	}

	c.JSON(http.StatusOK, res)
}

// UpdateSubscriptionType godoc
// @Summary Update subscription type
// @Description Update an existing subscription type
// @Tags Subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription Type ID"
// @Param request body requests.UpdateSubscriptionTypeRequest true "Update subscription type request"
// @Security BearerAuth
// @Success 200 {object} responses.SubscriptionTypeResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/subscription-types/{id} [put]
func UpdateSubscriptionType(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	subID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription type ID"})
		return
	}

	var req requests.CreateSubscriptionTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var sub models.SubscriptionType
	if err := config.DB.Where("id = ? AND tenant_id = ?", subID, tenantID).First(&sub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription type tidak ditemukan"})
		return
	}

	sub.Name = req.Name
	sub.Description = req.Description
	sub.RegistrationFee = req.RegistrationFee
	sub.MonthlyFee = req.MonthlyFee
	sub.MaintenanceFee = req.MaintenanceFee
	sub.LateFeePerDay = req.LateFeePerDay
	sub.MaxLateFee = req.MaxLateFee

	if err := config.DB.Save(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui subscription type"})
		return
	}

	res := responses.SubscriptionTypeResponse{
		ID:              sub.ID,
		Name:            sub.Name,
		Description:     sub.Description,
		RegistrationFee: sub.RegistrationFee,
		MonthlyFee:      sub.MonthlyFee,
		MaintenanceFee:  sub.MaintenanceFee,
		LateFeePerDay:   sub.LateFeePerDay,
		MaxLateFee:      sub.MaxLateFee,
		CreatedAt:       sub.CreatedAt,
	}

	c.JSON(http.StatusOK, res)
}

// DeleteSubscriptionType godoc
// @Summary Delete subscription type
// @Description Delete a subscription type by ID
// @Tags Subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription Type ID"
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/subscription-types/{id} [delete]
func DeleteSubscriptionType(c *gin.Context) {
	tenantID, err := helpers.RequireTenantID(c)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})

		return

	}
	id := c.Param("id")

	subID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription type ID"})
		return
	}

	var sub models.SubscriptionType
	if err := config.DB.Where("id = ? AND tenant_id = ?", subID, tenantID).First(&sub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription type tidak ditemukan"})
		return
	}

	if err := config.DB.Delete(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus subscription type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Subscription type berhasil dihapus"})
}
