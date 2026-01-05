package services

import (
	"fmt"
	"log"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/robfig/cron/v3"
)

// TrialExpiryScheduler manages scheduled trial expiry checks
type TrialExpiryScheduler struct {
	cron *cron.Cron
}

// NewTrialExpiryScheduler creates new trial expiry scheduler
func NewTrialExpiryScheduler() *TrialExpiryScheduler {
	return &TrialExpiryScheduler{
		cron: cron.New(),
	}
}

// Start starts the scheduler
func (s *TrialExpiryScheduler) Start() error {
	// Schedule daily trial expiry check
	// Run every day at 02:00 to check and update expired trials
	_, err := s.cron.AddFunc("0 2 * * *", func() {
		log.Println("🕐 Checking for expired trial tenants...")
		s.checkAndUpdateExpiredTrials()
	})
	if err != nil {
		return fmt.Errorf("failed to schedule trial expiry check: %w", err)
	}

	// Start the cron scheduler
	s.cron.Start()
	log.Println("✅ Trial expiry scheduler started successfully")
	log.Println("📅 Trial expiry check: Every day at 02:00")

	return nil
}

// Stop stops the scheduler
func (s *TrialExpiryScheduler) Stop() {
	s.cron.Stop()
	log.Println("🛑 Trial expiry scheduler stopped")
}

// checkAndUpdateExpiredTrials finds and updates all expired trial tenants
func (s *TrialExpiryScheduler) checkAndUpdateExpiredTrials() {
	now := time.Now()
	
	// Find all tenants with TRIAL status where trial_ends_at is before now
	var expiredTenants []models.Tenant
	err := config.DB.Where(
		"status = ? AND trial_ends_at IS NOT NULL AND trial_ends_at < ?",
		models.TenantStatusTrial,
		now,
	).Find(&expiredTenants).Error

	if err != nil {
		log.Printf("❌ Failed to fetch expired trial tenants: %v", err)
		return
	}

	if len(expiredTenants) == 0 {
		log.Println("✅ No expired trial tenants found")
		return
	}

	log.Printf("⚠️  Found %d expired trial tenant(s)", len(expiredTenants))

	successCount := 0
	failCount := 0

	// Update each expired tenant
	for _, tenant := range expiredTenants {
		err := s.expireTenant(tenant)
		if err != nil {
			log.Printf("❌ Failed to expire tenant %s (ID: %s): %v", 
				tenant.Name, tenant.ID.String(), err)
			failCount++
		} else {
			log.Printf("✅ Expired tenant: %s (ID: %s, Trial ended: %s)",
				tenant.Name, tenant.ID.String(), tenant.TrialEndsAt.Format("2006-01-02"))
			successCount++
		}
	}

	log.Printf("🎉 Trial expiry check completed: %d expired, %d failed", 
		successCount, failCount)
}

// expireTenant updates a single tenant to EXPIRED status
func (s *TrialExpiryScheduler) expireTenant(tenant models.Tenant) error {
	return config.DB.Model(&tenant).Updates(map[string]interface{}{
		"status": models.TenantStatusExpired,
	}).Error
}

// CheckExpiredTrialsNow immediately runs the trial expiry check (for manual trigger)
func (s *TrialExpiryScheduler) CheckExpiredTrialsNow() (int, error) {
	now := time.Now()
	
	var expiredTenants []models.Tenant
	err := config.DB.Where(
		"status = ? AND trial_ends_at IS NOT NULL AND trial_ends_at < ?",
		models.TenantStatusTrial,
		now,
	).Find(&expiredTenants).Error

	if err != nil {
		return 0, fmt.Errorf("failed to fetch expired trial tenants: %w", err)
	}

	successCount := 0
	for _, tenant := range expiredTenants {
		if err := s.expireTenant(tenant); err != nil {
			log.Printf("❌ Failed to expire tenant %s: %v", tenant.Name, err)
			continue
		}
		successCount++
	}

	return successCount, nil
}

// GetExpiringTrials returns list of tenants with trials expiring within specified days
func GetExpiringTrials(daysAhead int) ([]models.Tenant, error) {
	now := time.Now()
	futureDate := now.AddDate(0, 0, daysAhead)
	
	var tenants []models.Tenant
	err := config.DB.Where(
		"status = ? AND trial_ends_at IS NOT NULL AND trial_ends_at BETWEEN ? AND ?",
		models.TenantStatusTrial,
		now,
		futureDate,
	).Order("trial_ends_at ASC").Find(&tenants).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch expiring trials: %w", err)
	}

	return tenants, nil
}
