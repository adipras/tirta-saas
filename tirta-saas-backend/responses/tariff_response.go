package responses

import (
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

type TariffCategoryResponse struct {
	ID           uuid.UUID `json:"id"`
	Code         string    `json:"code"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Description  string    `json:"description"`
	DisplayOrder int       `json:"display_order"`
	IsActive     bool      `json:"is_active"`
}

type ProgressiveRateResponse struct {
	ID           uuid.UUID              `json:"id"`
	Category     TariffCategoryResponse `json:"category"`
	MinVolume    float64                `json:"min_volume"`
	MaxVolume    *float64               `json:"max_volume"`
	PricePerUnit float64                `json:"price_per_unit"`
	DisplayOrder int                    `json:"display_order"`
	IsActive     bool                   `json:"is_active"`
}

type BillSimulationResponse struct {
	Category       TariffCategoryResponse        `json:"category"`
	UsageVolume    float64                       `json:"usage_volume"`
	TotalAmount    float64                       `json:"total_amount"`
	Breakdown      []BillSimulationBreakdown     `json:"breakdown"`
}

type BillSimulationBreakdown struct {
	TierRange    string  `json:"tier_range"`
	Volume       float64 `json:"volume"`
	PricePerUnit float64 `json:"price_per_unit"`
	Amount       float64 `json:"amount"`
}

func ToTariffCategoryResponse(tc *models.TariffCategory) TariffCategoryResponse {
	return TariffCategoryResponse{
		ID:           tc.ID,
		Code:         tc.Code,
		Name:         tc.Name,
		Type:         tc.Type,
		Description:  tc.Description,
		DisplayOrder: tc.DisplayOrder,
		IsActive:     tc.IsActive,
	}
}

func ToProgressiveRateResponse(pr *models.ProgressiveRate) ProgressiveRateResponse {
	return ProgressiveRateResponse{
		ID:           pr.ID,
		Category:     ToTariffCategoryResponse(&pr.Category),
		MinVolume:    pr.MinVolume,
		MaxVolume:    pr.MaxVolume,
		PricePerUnit: pr.PricePerUnit,
		DisplayOrder: pr.DisplayOrder,
		IsActive:     pr.IsActive,
	}
}
