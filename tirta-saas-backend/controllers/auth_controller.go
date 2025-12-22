package controllers

import (
	"net/http"
	"os"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RegisterInput struct {
	TenantName    string `json:"tenant_name" binding:"required"`
	VillageCode   string `json:"village_code" binding:"required"`
	AdminName     string `json:"admin_name" binding:"required"`
	AdminEmail    string `json:"admin_email" binding:"required,email"`
	AdminPassword string `json:"admin_password" binding:"required,min=6"`
}

// Register creates a new tenant and admin user
// @Summary Register new tenant
// @Description Register a new tenant organization with admin user
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RegisterInput true "Registration data"
// @Success 201 {object} map[string]string
// @Failure 400,500 {object} map[string]string
// @Router /auth/register [post]
func Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, _ := utils.HashPassword(input.AdminPassword)

	tenant := models.Tenant{
		Name:        input.TenantName,
		VillageCode: input.VillageCode,
	}

	user := models.User{
		Name:     input.AdminName,
		Email:    input.AdminEmail,
		Password: hashedPassword,
		Role:     string(constants.RoleTenantAdmin),
	}

	tx := config.DB.Begin()

	if err := tx.Create(&tenant).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal buat tenant"})
		return
	}

	tenantID := tenant.ID
	user.TenantID = &tenantID

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal buat admin user"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{"message": "Tenant dan admin berhasil dibuat"})
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login authenticates a user
// @Summary User login
// @Description Authenticate user and get JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginInput true "Login credentials"
// @Success 200 {object} map[string]interface{}
// @Failure 400,401,500 {object} map[string]string
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email tidak ditemukan"})
		return
	}

	if !utils.CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.TenantID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"role":  user.Role,
	})
}

type CreateCustomerAccountInput struct {
	MeterNumber    string `json:"meter_number" binding:"required"`
	Name           string `json:"name" binding:"required"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=6"`
	Address        string `json:"address"`
	Phone          string `json:"phone"`
	SubscriptionID string `json:"subscription_id" binding:"required"`
}

// CreateCustomerAccount creates a customer account
// @Summary Create customer account
// @Description Create a new customer account with meter number
// @Tags Auth
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body CreateCustomerAccountInput true "Customer account data"
// @Success 201 {object} map[string]interface{}
// @Failure 400,401,404,409,500 {object} map[string]string
// @Router /auth/create-customer [post]
func CreateCustomerAccount(c *gin.Context) {
	var input CreateCustomerAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	// Business rule validations
	if len(input.MeterNumber) < 3 || len(input.MeterNumber) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Meter number must be 3-20 characters long"})
		return
	}

	if len(input.Name) < 2 || len(input.Name) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name must be 2-100 characters long"})
		return
	}

	// Check if meter number already exists
	var existingCustomer models.Customer
	if err := config.DB.Where("meter_number = ? AND tenant_id = ?", input.MeterNumber, tenantID).First(&existingCustomer).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Meter number already exists"})
		return
	}

	// Check if email already exists
	if err := config.DB.Where("email = ? AND tenant_id = ?", input.Email, tenantID).First(&existingCustomer).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email sudah digunakan"})
		return
	}

	subscriptionID, err := uuid.Parse(input.SubscriptionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription ID"})
		return
	}

	// Verify subscription exists for this tenant
	var subscription models.SubscriptionType
	if err := config.DB.Where("id = ? AND tenant_id = ?", subscriptionID, tenantID).First(&subscription).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription type tidak ditemukan"})
		return
	}

	hashedPassword, _ := utils.HashPassword(input.Password)

	customer := models.Customer{
		MeterNumber:    input.MeterNumber,
		Name:           input.Name,
		Email:          input.Email,
		Password:       hashedPassword,
		Address:        input.Address,
		Phone:          input.Phone,
		SubscriptionID: subscriptionID,
		IsActive:       false, // Will be activated after registration payment
		TenantID:       tenantID,
	}

	if err := config.DB.Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat akun customer"})
		return
	}

	// Create registration invoice
	invoice := models.Invoice{
		CustomerID:  customer.ID,
		UsageMonth:  "",
		UsageM3:     0,
		Abonemen:    subscription.RegistrationFee,
		PricePerM3:  0,
		TotalAmount: subscription.RegistrationFee,
		TotalPaid:   0,
		IsPaid:      false,
		TenantID:    tenantID,
		Type:        "registration",
	}

	if err := config.DB.Create(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat invoice pendaftaran"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":            "Akun customer berhasil dibuat",
		"meter_number":       customer.MeterNumber,
		"registration_fee":   subscription.RegistrationFee,
		"invoice_id":        invoice.ID,
	})
}

type CustomerLoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// CustomerLogin authenticates a customer
// @Summary Customer login
// @Description Authenticate customer and get JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body CustomerLoginInput true "Customer login credentials"
// @Success 200 {object} map[string]interface{}
// @Failure 400,401,500 {object} map[string]string
// @Router /auth/customer/login [post]
func CustomerLogin(c *gin.Context) {
	var input CustomerLoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var customer models.Customer
	if err := config.DB.Where("email = ?", input.Email).First(&customer).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email tidak ditemukan"})
		return
	}

	if !utils.CheckPasswordHash(input.Password, customer.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	if !customer.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Akun belum aktif. Silakan lakukan pembayaran pendaftaran terlebih dahulu"})
		return
	}

	token, err := utils.GenerateCustomerJWT(customer.ID, customer.TenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":       token,
		"meter_number": customer.MeterNumber,
		"name":        customer.Name,
	})
}

type PlatformOwnerRegisterInput struct {
	Name     string `json:"name" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	SecretKey string `json:"secret_key" binding:"required"`
}

// RegisterPlatformOwner creates a platform owner account
// @Summary Register platform owner
// @Description Create a new platform owner account (requires secret key)
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body PlatformOwnerRegisterInput true "Platform owner data"
// @Success 201 {object} map[string]string
// @Failure 400,401,409 {object} map[string]string
// @Router /auth/platform-owner/register [post]
func RegisterPlatformOwner(c *gin.Context) {
	var input PlatformOwnerRegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify secret key (should be set in environment variable)
	expectedSecretKey := os.Getenv("PLATFORM_OWNER_SECRET_KEY")
	if expectedSecretKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Platform owner registration not configured"})
		return
	}

	if input.SecretKey != expectedSecretKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid secret key"})
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Check if any platform owner already exists
	var platformOwnerCount int64
	config.DB.Model(&models.User{}).Where("role = ?", string(constants.RolePlatformOwner)).Count(&platformOwnerCount)
	if platformOwnerCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Platform owner already exists"})
		return
	}

	hashedPassword, _ := utils.HashPassword(input.Password)

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: hashedPassword,
		Role:     string(constants.RolePlatformOwner),
		TenantID: nil, // Platform owner doesn't belong to any tenant
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create platform owner"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Platform owner account created successfully",
		"email":   user.Email,
	})
}
