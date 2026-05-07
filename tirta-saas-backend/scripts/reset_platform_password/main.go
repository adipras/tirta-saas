package main

import (
	"fmt"
	"log"

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

	// Get platform admin
	var admin models.User
	if err := config.DB.Where("role = ?", string(constants.RolePlatformOwner)).First(&admin).Error; err != nil {
		log.Fatalf("❌ Platform admin not found: %v", err)
	}

	// Set new password
	newPassword := "admin123"
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		log.Fatalf("❌ Failed to hash password: %v", err)
	}

	// Update password
	if err := config.DB.Model(&admin).Update("password", hashedPassword).Error; err != nil {
		log.Fatalf("❌ Failed to update password: %v", err)
	}

	fmt.Println("✅ Platform admin password reset successfully!")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("📧 Email: %s\n", admin.Email)
	fmt.Printf("🔑 New Password: %s\n", newPassword)
	fmt.Printf("👤 Name: %s\n", admin.Name)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}
