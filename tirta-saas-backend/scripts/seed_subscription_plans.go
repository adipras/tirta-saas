package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database connection
	config.ConnectDB()

	// Check if subscription plans already exist
	var count int64
	config.DB.Model(&models.SubscriptionPlanDetails{}).Count(&count)
	
	if count > 0 {
		fmt.Printf("⚠️  Found %d existing subscription plans. Do you want to continue? (y/n): ", count)
		var response string
		fmt.Scanln(&response)
		if response != "y" && response != "Y" {
			fmt.Println("Aborted.")
			return
		}
	}

	// Define subscription plans
	plans := []struct {
		Plan              models.SubscriptionPlan
		Name              string
		Description       string
		MonthlyPrice      float64
		YearlyPrice       float64
		MaxUsers          int
		MaxCustomers      int
		MaxStorageGB      int
		MaxAPICallsPerDay int
		Features          []string
		TrialDays         int
		DisplayOrder      int
		IsActive          bool
	}{
		{
			Plan:              models.PlanBasic,
			Name:              "Basic",
			Description:       "Paket dasar untuk RT/RW kecil dengan kebutuhan standar",
			MonthlyPrice:      500000,  // Rp 500.000/bulan
			YearlyPrice:       5000000, // Rp 5.000.000/tahun (hemat 2 bulan)
			MaxUsers:          3,
			MaxCustomers:      100,
			MaxStorageGB:      5,
			MaxAPICallsPerDay: 10000,
			Features: []string{
				"Manajemen hingga 100 pelanggan",
				"3 user akses",
				"Invoice otomatis",
				"Laporan dasar",
				"Email support",
				"5 GB storage",
			},
			TrialDays:    0, // Trial diberikan saat registrasi tenant, bukan per paket
			DisplayOrder: 1,
			IsActive:     true,
		},
		{
			Plan:              models.PlanPremium,
			Name:              "Premium",
			Description:       "Paket lengkap untuk RT/RW menengah hingga besar",
			MonthlyPrice:      1000000,  // Rp 1.000.000/bulan
			YearlyPrice:       10000000, // Rp 10.000.000/tahun (hemat 2 bulan)
			MaxUsers:          10,
			MaxCustomers:      500,
			MaxStorageGB:      20,
			MaxAPICallsPerDay: 50000,
			Features: []string{
				"Manajemen hingga 500 pelanggan",
				"10 user akses",
				"Semua fitur Basic",
				"WhatsApp notifications",
				"Laporan lengkap & analytics",
				"Export data (Excel, PDF)",
				"Payment gateway integration",
				"Support prioritas",
				"20 GB storage",
			},
			TrialDays:    0, // Trial diberikan saat registrasi tenant, bukan per paket
			DisplayOrder: 2,
			IsActive:     true,
		},
		{
			Plan:              models.PlanEnterprise,
			Name:              "Enterprise",
			Description:       "Solusi kustom untuk organisasi besar dengan kebutuhan khusus",
			MonthlyPrice:      2500000,  // Rp 2.500.000/bulan
			YearlyPrice:       25000000, // Rp 25.000.000/tahun
			MaxUsers:          25,
			MaxCustomers:      2000,
			MaxStorageGB:      100,
			MaxAPICallsPerDay: 200000,
			Features: []string{
				"Manajemen hingga 2000 pelanggan",
				"25 user akses",
				"Semua fitur Premium",
				"Custom features development",
				"Multi-branch support",
				"API access untuk integrasi",
				"WhatsApp & SMS notifications",
				"Training & onboarding",
				"Dedicated account manager",
				"100 GB storage",
				"SLA 99.9% uptime",
			},
			TrialDays:    0, // Trial diberikan saat registrasi tenant, bukan per paket
			DisplayOrder: 3,
			IsActive:     true,
		},
	}

	// Insert plans
	fmt.Println("\n🚀 Seeding subscription plans...")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	for _, planData := range plans {
		// Convert features to JSON
		featuresJSON, err := json.Marshal(planData.Features)
		if err != nil {
			log.Printf("❌ Failed to marshal features for plan '%s': %v\n", planData.Name, err)
			continue
		}

		plan := models.SubscriptionPlanDetails{
			BaseModel:         models.BaseModel{ID: uuid.New()},
			Plan:              planData.Plan,
			Name:              planData.Name,
			Description:       planData.Description,
			MonthlyPrice:      planData.MonthlyPrice,
			YearlyPrice:       planData.YearlyPrice,
			MaxUsers:          planData.MaxUsers,
			MaxCustomers:      planData.MaxCustomers,
			MaxStorageGB:      planData.MaxStorageGB,
			MaxAPICallsPerDay: planData.MaxAPICallsPerDay,
			Features:          string(featuresJSON),
			TrialDays:         planData.TrialDays,
			DisplayOrder:      planData.DisplayOrder,
			IsActive:          planData.IsActive,
		}

		// Check if plan already exists
		var existing models.SubscriptionPlanDetails
		result := config.DB.Where("plan = ?", plan.Plan).First(&existing)
		
		if result.Error == nil {
			fmt.Printf("⚠️  Plan '%s' already exists, updating...\n", plan.Name)
			// Update existing plan
			plan.ID = existing.ID // Keep the same ID
			if err := config.DB.Model(&existing).Updates(&plan).Error; err != nil {
				log.Printf("❌ Failed to update plan '%s': %v\n", plan.Name, err)
				continue
			}
			fmt.Printf("✅ Updated: %s\n", plan.Name)
		} else {
			// Create new plan
			if err := config.DB.Create(&plan).Error; err != nil {
				log.Printf("❌ Failed to create plan '%s': %v\n", plan.Name, err)
				continue
			}
			fmt.Printf("✅ Created: %s\n", plan.Name)
		}

		// Display plan details
		fmt.Printf("   📦 Plan Code: %s\n", plan.Plan)
		fmt.Printf("   💰 Monthly: Rp %s | Yearly: Rp %s\n", 
			formatRupiah(plan.MonthlyPrice), 
			formatRupiah(plan.YearlyPrice))
		fmt.Printf("   👥 Max Users: %d | Max Customers: %d\n", 
			plan.MaxUsers, 
			plan.MaxCustomers)
		fmt.Printf("   💾 Storage: %d GB | API Calls: %s/day\n", 
			plan.MaxStorageGB, 
			formatNumber(plan.MaxAPICallsPerDay))
		fmt.Printf("   🎁 Trial Days: %d\n", plan.TrialDays)
		fmt.Println("   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	}

	fmt.Println("\n✅ Subscription plans seeded successfully!")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("\n📝 Summary:")
	config.DB.Model(&models.SubscriptionPlanDetails{}).Count(&count)
	fmt.Printf("   Total Plans: %d\n", count)
	
	var activeCount int64
	config.DB.Model(&models.SubscriptionPlanDetails{}).Where("is_active = ?", true).Count(&activeCount)
	fmt.Printf("   Active Plans: %d\n", activeCount)
	
	fmt.Println("\n💡 Tips:")
	fmt.Println("   - Akses plans di: http://localhost:5174/admin/platform/subscription-plans")
	fmt.Println("   - Landing page akan otomatis menampilkan plans yang aktif")
	fmt.Println("   - Edit plans sesuai kebutuhan Anda melalui admin panel")
}

func formatRupiah(amount float64) string {
	if amount >= 1000000 {
		return fmt.Sprintf("%.1f Jt", amount/1000000)
	} else if amount >= 1000 {
		return fmt.Sprintf("%.0f Rb", amount/1000)
	}
	return fmt.Sprintf("%.0f", amount)
}

func formatNumber(num int) string {
	if num >= 1000000 {
		return fmt.Sprintf("%.1f M", float64(num)/1000000)
	} else if num >= 1000 {
		return fmt.Sprintf("%.1f K", float64(num)/1000)
	}
	return fmt.Sprintf("%d", num)
}
