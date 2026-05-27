package main

import (
	"fmt"
	"log"
	"os"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database connection
	config.ConnectDB()

	// Check if platform admin already exists
	var count int64
	config.DB.Model(&models.User{}).Where("role = ?", string(constants.RolePlatformOwner)).Count(&count)

	if count > 0 {
		fmt.Println("✅ Platform admin already exists")

		// Show existing platform admin
		var admin models.User
		config.DB.Where("role = ?", string(constants.RolePlatformOwner)).First(&admin)
		fmt.Printf("📧 Email: %s\n", utils.StringValue(admin.Email))
		fmt.Printf("👤 Username: %s\n", admin.Username)
		fmt.Printf("👤 Name: %s\n", admin.Name)
		return
	}

	// Create platform admin
	email := os.Getenv("PLATFORM_ADMIN_EMAIL")
	password := os.Getenv("PLATFORM_ADMIN_PASSWORD")
	name := os.Getenv("PLATFORM_ADMIN_NAME")

	// Use defaults if not set
	if email == "" {
		email = "admin@platform.local"
	}
	if password == "" {
		password = "admin123456"
	}
	if name == "" {
		name = "Platform Administrator"
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Fatalf("❌ Failed to hash password: %v", err)
	}

	admin := models.User{
		Name:     name,
		Username: utils.NormalizeUsername(name),
		Email:    utils.StringPointerOrNil(email),
		Password: hashedPassword,
		Role:     string(constants.RolePlatformOwner),
		TenantID: nil,
	}

	if err := config.DB.Create(&admin).Error; err != nil {
		log.Fatalf("❌ Failed to create platform admin: %v", err)
	}

	fmt.Println("✅ Platform admin created successfully!")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("📧 Email: %s\n", email)
	fmt.Printf("👤 Username: %s\n", admin.Username)
	fmt.Printf("🔑 Password: %s\n", password)
	fmt.Printf("👤 Name: %s\n", name)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("⚠️  Please change the password after first login!")
}
