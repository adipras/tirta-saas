package services

import (
	"errors"
	"testing"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

func TestCalculateProgressiveCharge_UsesTieredPricing(t *testing.T) {
	secondTierMax := 20.0
	rates := []models.ProgressiveRate{
		{MinVolume: 0, MaxVolume: &secondTierMax, PricePerUnit: 2000, DisplayOrder: 2},
		{MinVolume: 0, MaxVolume: floatPtr(10), PricePerUnit: 1000, DisplayOrder: 1},
		{MinVolume: 20, MaxVolume: nil, PricePerUnit: 3000, DisplayOrder: 3},
	}

	totalAmount, breakdown, err := CalculateProgressiveCharge(25, rates)
	if err != nil {
		t.Fatalf("expected progressive charge calculation to succeed, got error: %v", err)
	}

	if totalAmount != 45000 {
		t.Fatalf("expected total amount 45000, got %.0f", totalAmount)
	}

	if len(breakdown) != 3 {
		t.Fatalf("expected 3 breakdown rows, got %d", len(breakdown))
	}

	if breakdown[0].Volume != 10 || breakdown[0].Amount != 10000 {
		t.Fatalf("expected first tier 10 m3 / 10000, got %.0f / %.0f", breakdown[0].Volume, breakdown[0].Amount)
	}

	if breakdown[1].Volume != 10 || breakdown[1].Amount != 20000 {
		t.Fatalf("expected second tier 10 m3 / 20000, got %.0f / %.0f", breakdown[1].Volume, breakdown[1].Amount)
	}

	if breakdown[2].Volume != 5 || breakdown[2].Amount != 15000 {
		t.Fatalf("expected third tier 5 m3 / 15000, got %.0f / %.0f", breakdown[2].Volume, breakdown[2].Amount)
	}
}

func TestCalculateProgressiveCharge_DetectsIncompleteCoverage(t *testing.T) {
	firstTierMax := 10.0
	rates := []models.ProgressiveRate{
		{MinVolume: 0, MaxVolume: &firstTierMax, PricePerUnit: 1000},
		{MinVolume: 15, MaxVolume: nil, PricePerUnit: 3000},
	}

	_, _, err := CalculateProgressiveCharge(12, rates)
	if !errors.Is(err, ErrIncompleteProgressiveRates) {
		t.Fatalf("expected ErrIncompleteProgressiveRates, got %v", err)
	}
}

func TestCalculateWaterUsageCharge_UsesFlatRateWhenNoCategory(t *testing.T) {
	rate := models.WaterRate{
		Amount: 2500,
	}

	totalAmount, err := CalculateWaterUsageCharge(nil, uuid.Nil, rate, 12)
	if err != nil {
		t.Fatalf("expected flat-rate calculation to succeed, got error: %v", err)
	}

	if totalAmount != 30000 {
		t.Fatalf("expected total amount 30000, got %.0f", totalAmount)
	}
}

func floatPtr(value float64) *float64 {
	return &value
}
