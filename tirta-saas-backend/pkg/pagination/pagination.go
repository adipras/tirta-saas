package pagination

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// PaginationParams holds pagination parameters
type PaginationParams struct {
	Page     int    `form:"page" binding:"min=1" json:"page"`
	PerPage  int    `form:"per_page" binding:"min=1,max=100" json:"per_page"`
	Sort     string `form:"sort" json:"sort"`
	Order    string `form:"order" json:"order"`
	Search   string `form:"search" json:"search"`
}

// PaginationResult holds pagination results and metadata
type PaginationResult struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"total_pages"`
	HasNext    bool        `json:"has_next"`
	HasPrev    bool        `json:"has_prev"`
}

// GetPaginationParams extracts pagination parameters from request
func GetPaginationParams(c *gin.Context) PaginationParams {
	page := 1
	perPage := 10
	sort := "created_at"
	order := "desc"

	// Parse page
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	// Parse per_page
	if perPageStr := c.Query("per_page"); perPageStr != "" {
		if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 && pp <= 100 {
			perPage = pp
		}
	}

	// Parse sort
	if sortStr := c.Query("sort"); sortStr != "" {
		sort = sortStr
	}

	// Parse order
	if orderStr := c.Query("order"); orderStr != "" {
		if orderStr == "asc" || orderStr == "desc" {
			order = orderStr
		}
	}

	// Parse search
	search := c.Query("search")

	return PaginationParams{
		Page:    page,
		PerPage: perPage,
		Sort:    sort,
		Order:   order,
		Search:  search,
	}
}

// Paginate applies pagination to a GORM query
func Paginate(db *gorm.DB, params PaginationParams, result interface{}) (*PaginationResult, error) {
	var total int64

	// Count total records
	if err := db.Model(result).Count(&total).Error; err != nil {
		return nil, err
	}

	// Calculate offset
	offset := (params.Page - 1) * params.PerPage

	// Apply sorting
	orderClause := params.Sort + " " + params.Order

	// Execute query with pagination
	if err := db.Offset(offset).Limit(params.PerPage).Order(orderClause).Find(result).Error; err != nil {
		return nil, err
	}

	// Calculate pagination metadata
	totalPages := int(math.Ceil(float64(total) / float64(params.PerPage)))
	hasNext := params.Page < totalPages
	hasPrev := params.Page > 1

	return &PaginationResult{
		Data:       result,
		Page:       params.Page,
		PerPage:    params.PerPage,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}, nil
}

// PaginateWithPreload applies pagination with preloading
func PaginateWithPreload(db *gorm.DB, params PaginationParams, result interface{}, preloads ...string) (*PaginationResult, error) {
	var total int64

	// Count total records (without preloads for performance)
	if err := db.Model(result).Count(&total).Error; err != nil {
		return nil, err
	}

	// Calculate offset
	offset := (params.Page - 1) * params.PerPage

	// Apply sorting
	orderClause := params.Sort + " " + params.Order

	// Apply preloads
	query := db
	for _, preload := range preloads {
		query = query.Preload(preload)
	}

	// Execute query with pagination
	if err := query.Offset(offset).Limit(params.PerPage).Order(orderClause).Find(result).Error; err != nil {
		return nil, err
	}

	// Calculate pagination metadata
	totalPages := int(math.Ceil(float64(total) / float64(params.PerPage)))
	hasNext := params.Page < totalPages
	hasPrev := params.Page > 1

	return &PaginationResult{
		Data:       result,
		Page:       params.Page,
		PerPage:    params.PerPage,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}, nil
}

// PaginateWithSearch applies pagination with search functionality
func PaginateWithSearch(db *gorm.DB, params PaginationParams, result interface{}, searchFields []string) (*PaginationResult, error) {
	query := db

	// Apply search if provided
	if params.Search != "" && len(searchFields) > 0 {
		searchQuery := ""
		searchArgs := make([]interface{}, 0)

		for i, field := range searchFields {
			if i > 0 {
				searchQuery += " OR "
			}
			searchQuery += field + " LIKE ?"
			searchArgs = append(searchArgs, "%"+params.Search+"%")
		}

		query = query.Where(searchQuery, searchArgs...)
	}

	var total int64

	// Count total records with search applied
	if err := query.Model(result).Count(&total).Error; err != nil {
		return nil, err
	}

	// Calculate offset
	offset := (params.Page - 1) * params.PerPage

	// Apply sorting
	orderClause := params.Sort + " " + params.Order

	// Execute query with pagination
	if err := query.Offset(offset).Limit(params.PerPage).Order(orderClause).Find(result).Error; err != nil {
		return nil, err
	}

	// Calculate pagination metadata
	totalPages := int(math.Ceil(float64(total) / float64(params.PerPage)))
	hasNext := params.Page < totalPages
	hasPrev := params.Page > 1

	return &PaginationResult{
		Data:       result,
		Page:       params.Page,
		PerPage:    params.PerPage,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}, nil
}

// GetValidSortFields returns valid sort fields for a model
func GetValidSortFields(model string) []string {
	switch model {
	case "customer":
		return []string{"created_at", "updated_at", "name", "email", "customer_id", "is_active"}
	case "invoice":
		return []string{"created_at", "updated_at", "usage_month", "total_amount", "is_paid"}
	case "payment":
		return []string{"created_at", "updated_at", "amount"}
	case "water_usage":
		return []string{"created_at", "updated_at", "usage_month", "usage_m3"}
	case "water_rate":
		return []string{"created_at", "updated_at", "effective_date", "amount", "active"}
	case "subscription_type":
		return []string{"created_at", "updated_at", "name", "registration_fee", "monthly_fee"}
	default:
		return []string{"created_at", "updated_at"}
	}
}

// ValidateSortField checks if a sort field is valid for a model
func ValidateSortField(model, sortField string) bool {
	validFields := GetValidSortFields(model)
	for _, field := range validFields {
		if field == sortField {
			return true
		}
	}
	return false
}

// SanitizePaginationParams sanitizes and validates pagination parameters
func SanitizePaginationParams(params *PaginationParams, model string) {
	// Validate page
	if params.Page < 1 {
		params.Page = 1
	}

	// Validate per_page
	if params.PerPage < 1 {
		params.PerPage = 10
	}
	if params.PerPage > 100 {
		params.PerPage = 100
	}

	// Validate sort field
	if !ValidateSortField(model, params.Sort) {
		params.Sort = "created_at"
	}

	// Validate order
	if params.Order != "asc" && params.Order != "desc" {
		params.Order = "desc"
	}

	// Sanitize search (limit length and remove dangerous characters)
	if len(params.Search) > 100 {
		params.Search = params.Search[:100]
	}
}

// PaginationMiddleware adds pagination support to request context
func PaginationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		params := GetPaginationParams(c)
		c.Set("pagination", params)
		c.Next()
	}
}

// GetPaginationFromContext retrieves pagination parameters from context
func GetPaginationFromContext(c *gin.Context) PaginationParams {
	if params, exists := c.Get("pagination"); exists {
		if p, ok := params.(PaginationParams); ok {
			return p
		}
	}
	return GetPaginationParams(c)
}