package config

import (
	"fmt"
	"log"
	"os"

	"github.com/adipras/tirta-saas-backend/models"
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
		&models.Tenant{},                     // No dependencies
		&models.User{},                       // References Tenant
		&models.SubscriptionType{},           // References Tenant
		&models.Customer{},                   // References Tenant + SubscriptionType
		&models.WaterRate{},                  // References Tenant + SubscriptionType
		&models.WaterUsage{},                 // References Tenant + Customer
		&models.Invoice{},                    // References Tenant + Customer
		&models.Payment{},                    // References Tenant + Invoice (must be after Invoice)
		&models.AuditLog{},                   // References Tenant (no other FK constraints)
		&models.TenantSettings{},             // References Tenant
		&models.SubscriptionPlanDetails{},    // No dependencies
		&models.TenantSubscription{},         // References Tenant
		&models.NotificationTemplate{},       // References Tenant
		&models.NotificationLog{},            // References Tenant + NotificationTemplate
		
		// Phase 6-7: New Models
		&models.Permission{},                 // No dependencies
		&models.Role{},                       // References Tenant
		&models.RolePermission{},             // References Role + Permission
		&models.UserRole{},                   // References User + Role
		&models.UserProfile{},                // References User
		&models.UserSession{},                // References User
		&models.UserActivity{},               // References User
		&models.ServiceArea{},                // References Tenant
		&models.PaymentMethod{},              // References Tenant
		&models.BankAccount{},                // References Tenant
		&models.TariffCategory{},             // References Tenant
		&models.ProgressiveRate{},            // References Tenant + TariffCategory
		&models.ReadingRoute{},               // References Tenant + User
		&models.Meter{},                      // References Tenant + Customer
		&models.MeterIssue{},                 // References Tenant + Meter + User
		&models.MeterHistory{},               // References Tenant + Meter + Customer + User
		&models.ReadingSession{},             // References Tenant + ReadingRoute + User
		&models.ReadingAnomaly{},             // References Tenant + WaterUsage + User
	)

	if err != nil {
		log.Fatalf("❌ Migrasi gagal: %v", err)
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
