package services

import (
	"fmt"
	"log"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
)

// InvoiceScheduler manages scheduled invoice generation
type InvoiceScheduler struct {
	cron      *cron.Cron
	generator *InvoiceGenerationService
}

// NewInvoiceScheduler creates new invoice scheduler
func NewInvoiceScheduler() *InvoiceScheduler {
	return &InvoiceScheduler{
		cron:      cron.New(),
		generator: NewInvoiceGenerationService(),
	}
}

// Start starts the scheduler
func (s *InvoiceScheduler) Start() error {
	// Evaluate scheduled invoice generation every day.
	// Each tenant is generated only when today matches their configured billing day.
	_, err := s.cron.AddFunc("0 0 * * *", func() {
		log.Println("🕐 Evaluating scheduled invoice generation...")
		s.runMonthlyGeneration()
	})
	if err != nil {
		return fmt.Errorf("failed to schedule monthly generation: %w", err)
	}

	// Schedule daily overdue update
	// Run every day at 01:00 to update overdue invoices
	_, err = s.cron.AddFunc("0 1 * * *", func() {
		log.Println("🕐 Updating overdue invoice statuses...")
		s.updateOverdueInvoices()
	})
	if err != nil {
		return fmt.Errorf("failed to schedule overdue update: %w", err)
	}

	// Start the cron scheduler
	s.cron.Start()
	log.Println("✅ Invoice scheduler started successfully")
	log.Println("📅 Scheduled generation check: every day at 00:00")
	log.Println("📅 Overdue update: Every day at 01:00")

	return nil
}

// Stop stops the scheduler
func (s *InvoiceScheduler) Stop() {
	s.cron.Stop()
	log.Println("🛑 Invoice scheduler stopped")
}

// runMonthlyGeneration generates invoices for all active tenants
func (s *InvoiceScheduler) runMonthlyGeneration() {
	// Get previous month (the month we're generating invoices for)
	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0)
	usageMonth := lastMonth.Format("2006-01") // YYYY-MM

	log.Printf("📊 Generating invoices for period: %s", usageMonth)

	// Get all active tenants
	var tenants []models.Tenant
	if err := config.DB.Where("status = ?", "ACTIVE").Find(&tenants).Error; err != nil {
		log.Printf("❌ Failed to fetch active tenants: %v", err)
		return
	}

	log.Printf("👥 Found %d active tenants", len(tenants))

	successCount := 0
	failCount := 0

	// Generate invoices only for tenants whose configured billing day matches today.
	for _, tenant := range tenants {
		var settings models.TenantSettings
		if err := config.DB.Where("tenant_id = ?", tenant.ID).First(&settings).Error; err != nil {
			settings = models.TenantSettings{TenantID: tenant.ID}
		}
		settings.ApplyBillingDefaults()
		location := utils.ResolveLocation(settings.TimeZone)
		if now.In(location).Day() != settings.InvoiceGenerationDay {
			continue
		}

		result, err := s.generator.GenerateInvoices(InvoiceGenerationRequest{
			TenantID:    tenant.ID,
			UsageMonth:  usageMonth,
			CustomerIDs: []uuid.UUID{}, // Empty = all customers
			DryRun:      false,
		})

		if err != nil {
			log.Printf("❌ Failed to generate invoices for tenant %s: %v", tenant.Name, err)
			failCount++
			s.logGenerationHistory(tenant.ID, usageMonth, 0, 0, 0, err.Error())
			continue
		}

		log.Printf("✅ Tenant %s: Generated %d, Skipped %d, Failed %d",
			tenant.Name, result.Success, result.Skipped, result.Failed)

		successCount++

		// Log generation history
		s.logGenerationHistory(tenant.ID, usageMonth, result.Success, result.Skipped, result.Failed, "")
	}

	log.Printf("🎉 Monthly generation completed: %d tenants succeeded, %d failed", successCount, failCount)
}

// updateOverdueInvoices updates payment status for all overdue invoices
func (s *InvoiceScheduler) updateOverdueInvoices() {
	var tenants []models.Tenant
	if err := config.DB.Where("status = ?", "ACTIVE").Find(&tenants).Error; err != nil {
		log.Printf("❌ Failed to fetch active tenants: %v", err)
		return
	}

	totalUpdated := 0

	for _, tenant := range tenants {
		err := s.generator.UpdateOverdueInvoices(tenant.ID)
		if err != nil {
			log.Printf("❌ Failed to update overdue for tenant %s: %v", tenant.Name, err)
			continue
		}
		totalUpdated++
	}

	log.Printf("✅ Updated overdue status for %d tenants", totalUpdated)
}

// logGenerationHistory logs invoice generation history
func (s *InvoiceScheduler) logGenerationHistory(tenantID uuid.UUID, month string, success, skipped, failed int, errorMsg string) {
	history := models.InvoiceGenerationHistory{
		TenantID:     tenantID,
		GeneratedFor: month,
		SuccessCount: success,
		SkippedCount: skipped,
		FailedCount:  failed,
		GeneratedAt:  time.Now(),
		Status:       "success",
		ErrorMessage: errorMsg,
	}

	if errorMsg != "" {
		history.Status = "failed"
	}

	if err := config.DB.Create(&history).Error; err != nil {
		log.Printf("⚠️  Failed to log generation history: %v", err)
	}
}

// RunManualGeneration manually triggers invoice generation for specific tenant and month
func (s *InvoiceScheduler) RunManualGeneration(tenantID uuid.UUID, usageMonth string) (*InvoiceGenerationResult, error) {
	result, err := s.generator.GenerateInvoices(InvoiceGenerationRequest{
		TenantID:    tenantID,
		UsageMonth:  usageMonth,
		CustomerIDs: []uuid.UUID{},
		DryRun:      false,
	})

	if err != nil {
		s.logGenerationHistory(tenantID, usageMonth, 0, 0, 0, err.Error())
		return nil, err
	}

	s.logGenerationHistory(tenantID, usageMonth, result.Success, result.Skipped, result.Failed, "")
	return result, nil
}
