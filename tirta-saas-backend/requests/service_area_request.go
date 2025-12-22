package requests

type CreateServiceAreaRequest struct {
	Code         string  `json:"code" binding:"required"`
	Name         string  `json:"name" binding:"required"`
	Type         string  `json:"type" binding:"required,oneof=RT RW Blok Zone"`
	ParentID     *string `json:"parent_id"`
	Description  string  `json:"description"`
	Population   int     `json:"population"`
	CoverageArea string  `json:"coverage_area"`
}

type UpdateServiceAreaRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	Population   int     `json:"population"`
	CoverageArea string  `json:"coverage_area"`
	IsActive     *bool   `json:"is_active"`
}
