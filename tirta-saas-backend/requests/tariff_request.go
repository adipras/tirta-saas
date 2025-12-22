package requests

type CreateTariffCategoryRequest struct {
	Code        string `json:"code" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=residential commercial industrial social government"`
	Description string `json:"description"`
}

type UpdateTariffCategoryRequest struct {
	Name         string `json:"name" binding:"required"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"display_order"`
	IsActive     *bool  `json:"is_active"`
}

type CreateProgressiveRateRequest struct {
	CategoryID   string   `json:"category_id" binding:"required"`
	MinVolume    float64  `json:"min_volume" binding:"required,gte=0"`
	MaxVolume    *float64 `json:"max_volume" binding:"omitempty,gtfield=MinVolume"`
	PricePerUnit float64  `json:"price_per_unit" binding:"required,gt=0"`
	DisplayOrder int      `json:"display_order"`
}

type UpdateProgressiveRateRequest struct {
	MinVolume    float64  `json:"min_volume" binding:"required,gte=0"`
	MaxVolume    *float64 `json:"max_volume" binding:"omitempty,gtfield=MinVolume"`
	PricePerUnit float64  `json:"price_per_unit" binding:"required,gt=0"`
	DisplayOrder int      `json:"display_order"`
	IsActive     *bool    `json:"is_active"`
}

type SimulateBillRequest struct {
	CategoryID   string  `json:"category_id" binding:"required"`
	UsageVolume  float64 `json:"usage_volume" binding:"required,gt=0"`
}
