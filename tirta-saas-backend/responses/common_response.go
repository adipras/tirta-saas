package responses

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Status  string      `json:"status" enum:"success" doc:"Response status" example:"success"`
	Message string      `json:"message" doc:"Success message" example:"Operation completed successfully"`
	Data    interface{} `json:"data,omitempty" doc:"Response data"`
}

// ErrorResponse represents an error API response
type ErrorResponse struct {
	Status  string `json:"status" enum:"error" doc:"Response status" example:"error"`
	Message string `json:"message" doc:"Error message" example:"Invalid input"`
	Error   string `json:"error,omitempty" doc:"Detailed error information" example:"validation failed"`
}

// PaginationMeta represents pagination metadata
type PaginationMeta struct {
	CurrentPage int `json:"current_page" minimum:"1" doc:"Current page number" example:"1"`
	PageSize    int `json:"page_size" minimum:"1" maximum:"100" doc:"Number of items per page" example:"20"`
	TotalPages  int `json:"total_pages" minimum:"0" doc:"Total number of pages" example:"5"`
	TotalItems  int `json:"total_items" minimum:"0" doc:"Total number of items" example:"95"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Status  string         `json:"status" enum:"success" doc:"Response status" example:"success"`
	Message string         `json:"message" doc:"Success message" example:"Data retrieved successfully"`
	Data    interface{}    `json:"data" doc:"Response data (array of items)"`
	Meta    PaginationMeta `json:"meta" doc:"Pagination metadata"`
}
