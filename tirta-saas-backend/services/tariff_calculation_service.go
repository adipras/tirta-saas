package services

import (
	"errors"
	"fmt"
	"sort"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrNoActiveProgressiveRates   = errors.New("tarif progresif aktif tidak ditemukan untuk kategori tarif ini")
	ErrIncompleteProgressiveRates = errors.New("konfigurasi tarif progresif belum menutup seluruh rentang pemakaian")
)

type ProgressiveChargeBreakdown struct {
	MinVolume    float64
	MaxVolume    *float64
	Volume       float64
	PricePerUnit float64
	Amount       float64
}

func LoadActiveProgressiveRates(db *gorm.DB, tenantID uuid.UUID, categoryID uuid.UUID) ([]models.ProgressiveRate, error) {
	var rates []models.ProgressiveRate
	if err := db.
		Where("tenant_id = ? AND category_id = ? AND is_active = ?", tenantID, categoryID, true).
		Order("min_volume ASC, display_order ASC").
		Find(&rates).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch progressive rates: %w", err)
	}

	if len(rates) == 0 {
		return nil, ErrNoActiveProgressiveRates
	}

	return rates, nil
}

func CalculateProgressiveCharge(usageM3 float64, rates []models.ProgressiveRate) (float64, []ProgressiveChargeBreakdown, error) {
	if usageM3 < 0 {
		return 0, nil, errors.New("pemakaian tidak boleh bernilai negatif")
	}

	if usageM3 == 0 {
		return 0, nil, nil
	}

	if len(rates) == 0 {
		return 0, nil, ErrNoActiveProgressiveRates
	}

	sortedRates := append([]models.ProgressiveRate(nil), rates...)
	sort.Slice(sortedRates, func(i, j int) bool {
		if sortedRates[i].MinVolume == sortedRates[j].MinVolume {
			return sortedRates[i].DisplayOrder < sortedRates[j].DisplayOrder
		}
		return sortedRates[i].MinVolume < sortedRates[j].MinVolume
	})

	totalAmount := 0.0
	coveredUntil := 0.0
	breakdown := make([]ProgressiveChargeBreakdown, 0, len(sortedRates))

	for _, rate := range sortedRates {
		tierStart := rate.MinVolume
		if tierStart < coveredUntil {
			tierStart = coveredUntil
		}

		if usageM3 <= tierStart {
			continue
		}

		tierEnd := usageM3
		if rate.MaxVolume != nil && *rate.MaxVolume < tierEnd {
			tierEnd = *rate.MaxVolume
		}

		if tierEnd <= tierStart {
			continue
		}

		volumeInTier := tierEnd - tierStart
		tierAmount := volumeInTier * rate.PricePerUnit
		totalAmount += tierAmount
		coveredUntil = tierEnd

		breakdown = append(breakdown, ProgressiveChargeBreakdown{
			MinVolume:    rate.MinVolume,
			MaxVolume:    rate.MaxVolume,
			Volume:       volumeInTier,
			PricePerUnit: rate.PricePerUnit,
			Amount:       tierAmount,
		})
	}

	if coveredUntil+1e-9 < usageM3 {
		return 0, nil, ErrIncompleteProgressiveRates
	}

	return totalAmount, breakdown, nil
}

func CalculateTariffCategoryCharge(db *gorm.DB, tenantID uuid.UUID, categoryID uuid.UUID, usageM3 float64) (float64, []ProgressiveChargeBreakdown, error) {
	rates, err := LoadActiveProgressiveRates(db, tenantID, categoryID)
	if err != nil {
		return 0, nil, err
	}

	return CalculateProgressiveCharge(usageM3, rates)
}

func CalculateWaterUsageCharge(db *gorm.DB, tenantID uuid.UUID, rate models.WaterRate, usageM3 float64) (float64, error) {
	if usageM3 < 0 {
		return 0, errors.New("pemakaian tidak boleh bernilai negatif")
	}

	if rate.CategoryID == nil {
		return usageM3 * rate.Amount, nil
	}

	totalAmount, _, err := CalculateTariffCategoryCharge(db, tenantID, *rate.CategoryID, usageM3)
	if err != nil {
		return 0, err
	}

	return totalAmount, nil
}
