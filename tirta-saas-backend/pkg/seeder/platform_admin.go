package seeder

import (
	"log"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/constants"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
	"gorm.io/gorm"
)

type PlatformAdminSeeder struct {
	Email     string
	Password  string
	FirstName string
	LastName  string
}

// SeedDefaultPlatformAdmin creates a default platform admin if none exists
func SeedDefaultPlatformAdmin() error {
	db := config.DB

	// Check if platform admin already exists
	var count int64
	err := db.Model(&models.User{}).
		Where("role = ?", constants.RolePlatformOwner).
		Count(&count).Error
	
	if err != nil {
		return err
	}

	// If admin exists, skip seeding
	if count > 0 {
		log.Printf("✓ Platform Admin already exists (count: %d)", count)
		return nil
	}

	// Create default admin
	seeder := PlatformAdminSeeder{
		Email:     "admin@tirtasaas.com",
		Password:  "admin123",
		FirstName: "Platform",
		LastName:  "Administrator",
	}

	return seeder.Seed(db)
}

// SeedCustomPlatformAdmin creates a custom platform admin
func SeedCustomPlatformAdmin(email, password, firstName, lastName string) error {
	seeder := PlatformAdminSeeder{
		Email:     email,
		Password:  password,
		FirstName: firstName,
		LastName:  lastName,
	}

	return seeder.Seed(config.DB)
}

// Seed executes the seeding
func (s *PlatformAdminSeeder) Seed(db *gorm.DB) error {
	// Hash password
	hashedPassword, err := utils.HashPassword(s.Password)
	if err != nil {
		return err
	}

	// Create platform admin user
	admin := models.User{
		Name:     s.FirstName + " " + s.LastName,
		Email:    s.Email,
		Password: hashedPassword,
		Role:     string(constants.RolePlatformOwner),
		TenantID: nil, // Platform owner doesn't belong to a tenant
	}

	err = db.Create(&admin).Error
	if err != nil {
		return err
	}

	log.Printf("✓ Platform Admin created successfully:")
	log.Printf("  Email: %s", s.Email)
	log.Printf("  Password: %s", s.Password)
	log.Printf("  Name: %s %s", s.FirstName, s.LastName)
	log.Printf("  ⚠️  IMPORTANT: Change this password immediately after first login!")

	return nil
}

// SeedMultiplePlatformAdmins seeds multiple admins at once
func SeedMultiplePlatformAdmins(admins []PlatformAdminSeeder) error {
	db := config.DB

	for _, admin := range admins {
		// Check if email already exists
		var existing models.User
		err := db.Where("email = ?", admin.Email).First(&existing).Error
		
		if err == nil {
			log.Printf("⚠️  Admin with email %s already exists, skipping...", admin.Email)
			continue
		}

		if err != gorm.ErrRecordNotFound {
			return err
		}

		// Seed the admin
		err = admin.Seed(db)
		if err != nil {
			log.Printf("❌ Failed to create admin %s: %v", admin.Email, err)
			return err
		}
	}

	return nil
}
