package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	name := os.Getenv("DB_NAME")

	if user == "" || pass == "" || host == "" || port == "" || name == "" {
		log.Fatal("❌ ENV database tidak lengkap. Harap periksa .env file")
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, pass, host, port, name)

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Fatalf("❌ Gagal konek ke database: %v", err)
	}

	log.Println("✅ Database berhasil terkoneksi")
	DB = database
}

func Migrate() {
	log.Println("🚀 Memulai proses migrasi database...")

	// Migration order is important due to foreign key constraints
	// 1. Base entities first (no dependencies)
	// 2. Entities with foreign keys last
	err := DB.AutoMigrate(
		// Phase 1-4: Core Models
		&models.Tenant{},                  // No dependencies
		&models.User{},                    // References Tenant
		&models.SubscriptionType{},        // References Tenant
		&models.Customer{},                // References Tenant + SubscriptionType
		&models.WaterRate{},               // References Tenant + SubscriptionType
		&models.WaterUsage{},              // References Tenant + Customer
		&models.Invoice{},                 // References Tenant + Customer
		&models.Payment{},                 // References Tenant + Invoice (must be after Invoice)
		&models.PaymentProof{},            // References Tenant + Invoice + Customer
		&models.AuditLog{},                // References Tenant (no other FK constraints)
		&models.TenantSettings{},          // References Tenant
		&models.SubscriptionPlanDetails{}, // No dependencies
		&models.TenantSubscription{},      // References Tenant
		&models.NotificationTemplate{},    // References Tenant
		&models.NotificationLog{},         // References Tenant + NotificationTemplate

		// Phase 6-7: New Models
		&models.Permission{},               // No dependencies
		&models.Role{},                     // References Tenant
		&models.RolePermission{},           // References Role + Permission
		&models.UserRole{},                 // References User + Role
		&models.UserProfile{},              // References User
		&models.UserSession{},              // References User
		&models.UserActivity{},             // References User
		&models.ServiceArea{},              // References Tenant
		&models.PaymentMethod{},            // References Tenant
		&models.BankAccount{},              // References Tenant
		&models.QRCode{},                   // References Tenant
		&models.PlatformBankAccount{},      // No dependencies (platform-level)
		&models.PlatformQRCode{},           // No dependencies (platform-level)
		&models.TariffCategory{},           // References Tenant
		&models.ProgressiveRate{},          // References Tenant + TariffCategory
		&models.ReadingRoute{},             // References Tenant + User
		&models.Meter{},                    // References Tenant + Customer
		&models.MeterIssue{},               // References Tenant + Meter + User
		&models.MeterHistory{},             // References Tenant + Meter + Customer + User
		&models.ReadingSession{},           // References Tenant + ReadingRoute + User
		&models.ReadingAnomaly{},           // References Tenant + WaterUsage + User
		&models.SubscriptionPayment{},      // References Tenant (subscription upgrade payments)
		&models.SubscriptionInvoice{},      // References Tenant (tenant subscription invoices)
		&models.InvoiceGenerationHistory{}, // References Tenant
	)

	if err != nil {
		log.Fatalf("❌ Migrasi gagal: %v", err)
	}

	if err := applyInvoiceSchemaAdjustments(); err != nil {
		log.Fatalf("❌ Migrasi schema invoice gagal: %v", err)
	}

	if err := applyUserSchemaAdjustments(); err != nil {
		log.Fatalf("❌ Migrasi schema user gagal: %v", err)
	}

	log.Println("✅ Migrasi database selesai.")

	// Apply database optimizations after migration
	if err := OptimizeDatabase(DB); err != nil {
		log.Printf("⚠️ Database optimization failed: %v", err)
	} else {
		log.Println("✅ Database optimizations applied")
	}

	// Initialize default permissions
	initializeDefaultPermissions(DB)
}

func applyInvoiceSchemaAdjustments() error {
	if err := DB.Exec("ALTER TABLE invoices MODIFY COLUMN type VARCHAR(20) NOT NULL").Error; err != nil {
		return err
	}

	if !DB.Migrator().HasColumn(&models.Invoice{}, "ManualItems") {
		if err := DB.Exec("ALTER TABLE invoices ADD COLUMN manual_items JSON NULL").Error; err != nil {
			return err
		}
	}

	return nil
}

func applyUserSchemaAdjustments() error {
	if !DB.Migrator().HasColumn(&models.User{}, "Username") {
		if err := DB.Exec("ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER name").Error; err != nil {
			return err
		}
	}

	if err := DB.Exec("ALTER TABLE users MODIFY COLUMN email VARCHAR(191) NULL").Error; err != nil {
		return err
	}

	type legacyUserIdentity struct {
		ID    string
		Name  string
		Email *string
	}

	var users []legacyUserIdentity
	if err := DB.Raw(`
		SELECT id, name, email
		FROM users
		WHERE username IS NULL OR TRIM(username) = ''
	`).Scan(&users).Error; err != nil {
		return err
	}

	for _, user := range users {
		username := utils.NormalizeUsername(utils.StringValue(user.Email))
		if username == "" {
			username = utils.NormalizeUsername(user.Name)
		}
		if username == "" {
			username = "user"
		}
		idSuffix := strings.ToLower(strings.ReplaceAll(user.ID, "-", ""))
		if len(idSuffix) > 8 {
			idSuffix = idSuffix[:8]
		}
		if idSuffix == "" {
			idSuffix = "user"
		}
		username = fmt.Sprintf("%s-%s", username, idSuffix)

		if err := DB.Exec("UPDATE users SET username = ? WHERE id = ?", username, user.ID).Error; err != nil {
			return err
		}
	}

	var remainingBlankUsernames int64
	if err := DB.Raw(`
		SELECT COUNT(*)
		FROM users
		WHERE username IS NULL OR TRIM(username) = ''
	`).Scan(&remainingBlankUsernames).Error; err != nil {
		return err
	}
	if remainingBlankUsernames > 0 {
		return fmt.Errorf("masih ada %d user tanpa username setelah backfill", remainingBlankUsernames)
	}

	if err := DB.Exec("ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NOT NULL").Error; err != nil {
		return err
	}

	if !hasTableIndex("users", "idx_users_username") {
		if err := DB.Exec("CREATE UNIQUE INDEX idx_users_username ON users(username)").Error; err != nil {
			return err
		}
	}

	if !hasTableIndex("users", "idx_users_email") {
		if err := DB.Exec("CREATE UNIQUE INDEX idx_users_email ON users(email)").Error; err != nil {
			return err
		}
	}

	return nil
}

func hasTableIndex(tableName, indexName string) bool {
	var count int64
	if err := DB.Raw(`
		SELECT COUNT(*)
		FROM information_schema.statistics
		WHERE table_schema = DATABASE()
		  AND table_name = ?
		  AND index_name = ?
	`, tableName, indexName).Scan(&count).Error; err != nil {
		return false
	}

	return count > 0
}

func initializeDefaultPermissions(db *gorm.DB) {
	log.Println("🔐 Initializing default permissions...")

	permissions := []models.Permission{
		// Customer permissions
		{Name: "customer.view", DisplayName: "View Customers", Category: models.PermissionCategoryCustomer, Description: "View customer list and details"},
		{Name: "customer.create", DisplayName: "Create Customers", Category: models.PermissionCategoryCustomer, Description: "Register new customers"},
		{Name: "customer.update", DisplayName: "Update Customers", Category: models.PermissionCategoryCustomer, Description: "Update customer information"},
		{Name: "customer.delete", DisplayName: "Delete Customers", Category: models.PermissionCategoryCustomer, Description: "Delete customer accounts"},

		// Invoice permissions
		{Name: "invoice.view", DisplayName: "View Invoices", Category: models.PermissionCategoryInvoice, Description: "View invoice list and details"},
		{Name: "invoice.create", DisplayName: "Create Invoices", Category: models.PermissionCategoryInvoice, Description: "Generate invoices"},
		{Name: "invoice.update", DisplayName: "Update Invoices", Category: models.PermissionCategoryInvoice, Description: "Modify invoice details"},
		{Name: "invoice.delete", DisplayName: "Delete Invoices", Category: models.PermissionCategoryInvoice, Description: "Void or delete invoices"},

		// Payment permissions
		{Name: "payment.view", DisplayName: "View Payments", Category: models.PermissionCategoryPayment, Description: "View payment records"},
		{Name: "payment.create", DisplayName: "Record Payments", Category: models.PermissionCategoryPayment, Description: "Record new payments"},
		{Name: "payment.update", DisplayName: "Update Payments", Category: models.PermissionCategoryPayment, Description: "Modify payment records"},

		// Water usage permissions
		{Name: "usage.view", DisplayName: "View Usage", Category: models.PermissionCategoryWaterUsage, Description: "View water usage records"},
		{Name: "usage.create", DisplayName: "Record Usage", Category: models.PermissionCategoryWaterUsage, Description: "Record meter readings"},
		{Name: "usage.update", DisplayName: "Update Usage", Category: models.PermissionCategoryWaterUsage, Description: "Modify usage records"},

		// Subscription permissions
		{Name: "subscription.view", DisplayName: "View Subscriptions", Category: models.PermissionCategorySubscription, Description: "View subscription types"},
		{Name: "subscription.manage", DisplayName: "Manage Subscriptions", Category: models.PermissionCategorySubscription, Description: "Create/update subscription types"},

		// Settings permissions
		{Name: "settings.view", DisplayName: "View Settings", Category: models.PermissionCategorySettings, Description: "View system settings"},
		{Name: "settings.manage", DisplayName: "Manage Settings", Category: models.PermissionCategorySettings, Description: "Modify system settings"},

		// User management permissions
		{Name: "user.view", DisplayName: "View Users", Category: models.PermissionCategoryUser, Description: "View user list"},
		{Name: "user.manage", DisplayName: "Manage Users", Category: models.PermissionCategoryUser, Description: "Create/update users and roles"},

		// Report permissions
		{Name: "report.view", DisplayName: "View Reports", Category: models.PermissionCategoryReport, Description: "Access reports and analytics"},
		{Name: "report.export", DisplayName: "Export Reports", Category: models.PermissionCategoryReport, Description: "Export report data"},
	}

	for _, perm := range permissions {
		var existing models.Permission
		if err := db.Where("name = ?", perm.Name).First(&existing).Error; err == gorm.ErrRecordNotFound {
			if err := db.Create(&perm).Error; err != nil {
				log.Printf("⚠️ Failed to create permission %s: %v", perm.Name, err)
			}
		}
	}

	log.Println("✅ Default permissions initialized")
}
