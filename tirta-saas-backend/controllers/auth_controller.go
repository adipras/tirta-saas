package controllers

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/pkg/audit"
	"github.com/adipras/tirta-saas-backend/services"
	"github.com/adipras/tirta-saas-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
	username := utils.NormalizeUsername(strings.SplitN(input.AdminEmail, "@", 2)[0])
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username admin tidak valid"})
		return
	}

	tenant := models.Tenant{
		Name:        input.TenantName,
		VillageCode: input.VillageCode,
	}

	user := models.User{
		Name:     input.AdminName,
		Username: username,
		Email:    utils.StringPointerOrNil(input.AdminEmail),
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
	Identifier string `json:"identifier"`
	Email      string `json:"email"`
	Password   string `json:"password" binding:"required"`
}

func resolveLoginIdentifier(input LoginInput) string {
	identifier := strings.TrimSpace(input.Identifier)
	if identifier != "" {
		return identifier
	}

	return strings.TrimSpace(input.Email)
}

func findUserByLoginIdentifier(identifier string) (models.User, error) {
	var user models.User

	query := config.DB
	if query.Migrator().HasColumn(&models.User{}, "Username") {
		err := query.Where("username = ? OR email = ?", identifier, identifier).First(&user).Error
		return user, err
	}

	err := query.Where("email = ?", identifier).First(&user).Error
	return user, err
}

func setAuditUserContext(c *gin.Context, user models.User) {
	c.Set("user_id", user.ID)
	c.Set("role", user.Role)
	if user.TenantID != nil {
		c.Set("tenant_id", *user.TenantID)
	}
}

func setAuditCustomerContext(c *gin.Context, customer models.Customer) {
	c.Set("customer_id", customer.ID)
	c.Set("tenant_id", customer.TenantID)
	c.Set("role", string(constants.RoleCustomer))
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

	identifier := resolveLoginIdentifier(input)
	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username atau email wajib diisi"})
		return
	}

	user, err := findUserByLoginIdentifier(identifier)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau email tidak ditemukan"})
		return
	}
	setAuditUserContext(c, user)

	if !utils.CheckPasswordHash(input.Password, user.Password) {
		audit.LogLogin(c, user.Role, identifier, false, "invalid password")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	authService := services.NewAuthService(config.DB)
	authPayload, err := authService.CreateSession(user, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		audit.LogLogin(c, user.Role, identifier, false, "session creation failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi login"})
		return
	}

	audit.LogLogin(c, user.Role, identifier, true, "")
	c.JSON(http.StatusOK, authPayload)
}

type refreshTokenInput struct {
	RefreshToken string `json:"refresh_token"`
}

func Refresh(c *gin.Context) {
	var payload map[string]string
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := refreshTokenInput{
		RefreshToken: payload["refresh_token"],
	}
	if input.RefreshToken == "" {
		input.RefreshToken = payload["refreshToken"]
	}

	if input.RefreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token wajib diisi"})
		return
	}

	authService := services.NewAuthService(config.DB)
	authPayload, err := authService.RefreshSession(input.RefreshToken, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidRefreshToken):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token tidak valid"})
		case errors.Is(err, services.ErrSessionExpired):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login sudah berakhir"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui sesi login"})
		}
		return
	}

	c.JSON(http.StatusOK, authPayload)
}

func Logout(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terautentikasi"})
		return
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terautentikasi"})
		return
	}

	authService := services.NewAuthService(config.DB)
	if err := authService.InvalidateUserSessions(userID); err != nil {
		audit.LogLogout(c, "user", false, "session invalidation failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal logout"})
		return
	}

	audit.LogLogout(c, "user", true, "")
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout berhasil",
	})
}

func Me(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terautentikasi"})
		return
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terautentikasi"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil profil user"})
		return
	}

	authService := services.NewAuthService(config.DB)
	profile, err := authService.BuildUserProfile(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil profil user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":            profile,
		"role":            profile.Role,
		"tenant_id":       profile.TenantID,
		"tenant_name":     profile.TenantName,
		"tenant_logo_url": profile.TenantLogoURL,
		"trial_ends_at":   profile.TrialEndsAt,
		"tenant_status":   profile.TenantStatus,
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
		"message":          "Akun customer berhasil dibuat",
		"meter_number":     customer.MeterNumber,
		"registration_fee": subscription.RegistrationFee,
		"invoice_id":       invoice.ID,
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
	setAuditCustomerContext(c, customer)

	if !utils.CheckPasswordHash(input.Password, customer.Password) {
		audit.LogLogin(c, "customer", input.Email, false, "invalid password")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password salah"})
		return
	}

	if !customer.IsActive {
		audit.LogLogin(c, "customer", input.Email, false, "customer inactive")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Akun belum aktif. Silakan lakukan pembayaran pendaftaran terlebih dahulu"})
		return
	}

	token, err := utils.GenerateCustomerJWT(customer.ID, customer.TenantID)
	if err != nil {
		audit.LogLogin(c, "customer", input.Email, false, "token generation failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	audit.LogLogin(c, "customer", input.Email, true, "")
	c.JSON(http.StatusOK, gin.H{
		"token":        token,
		"meter_number": customer.MeterNumber,
		"name":         customer.Name,
	})
}

type PlatformOwnerRegisterInput struct {
	Name      string `json:"name" binding:"required,min=3"`
	Username  string `json:"username" binding:"required,min=3"`
	Email     string `json:"email"`
	Password  string `json:"password" binding:"required,min=6"`
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

	normalizedEmail := utils.StringPointerOrNil(input.Email)
	normalizedUsername := utils.NormalizeUsername(input.Username)
	if len(normalizedUsername) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, underscore, atau dash"})
		return
	}
	var existingUser models.User
	if err := config.DB.Where("username = ?", normalizedUsername).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
		return
	}
	if normalizedEmail != nil {
		if err := config.DB.Where("email = ?", *normalizedEmail).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
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
		Username: normalizedUsername,
		Email:    normalizedEmail,
		Password: hashedPassword,
		Role:     string(constants.RolePlatformOwner),
		TenantID: nil, // Platform owner doesn't belong to any tenant
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create platform owner"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Platform owner account created successfully",
		"email":    utils.StringValue(user.Email),
		"username": user.Username,
	})
}

// RegisterAccountInput represents request to create a user account only (without tenant)
type RegisterAccountInput struct {
	Name     string `json:"name" binding:"required,min=3,max=100"`
	Username string `json:"username" binding:"required,min=3,max=100"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterAccount creates a standalone user account without a tenant.
// After registering, the user must log in and then call POST /api/setup/tenant.
func RegisterAccount(c *gin.Context) {
	var input RegisterAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalizedEmail := utils.StringPointerOrNil(input.Email)
	normalizedUsername := utils.NormalizeUsername(input.Username)
	if len(normalizedUsername) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, underscore, atau dash"})
		return
	}

	var existing models.User
	if err := config.DB.Where("username = ?", normalizedUsername).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
		return
	}
	if normalizedEmail != nil {
		if err := config.DB.Where("email = ?", *normalizedEmail).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email sudah terdaftar. Gunakan email lain."})
			return
		}
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
		return
	}

	user := models.User{
		Name:     input.Name,
		Username: normalizedUsername,
		Email:    normalizedEmail,
		Password: hashedPassword,
		Role:     string(constants.RoleTenantAdmin),
		TenantID: nil, // Tenant will be set up later via POST /api/setup/tenant
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat akun"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Akun berhasil dibuat. Silakan login untuk melanjutkan setup tenant.",
		"email":    utils.StringValue(user.Email),
		"username": user.Username,
	})
}
