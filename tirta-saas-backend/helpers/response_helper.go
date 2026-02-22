package helpers

import (
	"net/http"

	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
)

// RespondSuccess sends a successful response with data
func RespondSuccess(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	})
}

// RespondCreated sends a created response with data
func RespondCreated(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusCreated, responses.SuccessResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	})
}

// RespondError sends an error response
func RespondError(c *gin.Context, statusCode int, message string, err error) {
	errorMsg := ""
	if err != nil {
		errorMsg = err.Error()
	}
	c.JSON(statusCode, responses.ErrorResponse{
		Status:  "error",
		Message: message,
		Error:   errorMsg,
	})
}

// RespondPaginated sends a paginated response
func RespondPaginated(c *gin.Context, message string, data interface{}, page, pageSize, totalItems int) {
	totalPages := totalItems / pageSize
	if totalItems%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, responses.PaginatedResponse{
		Status:  "success",
		Message: message,
		Data:    data,
		Meta: responses.PaginationMeta{
			CurrentPage: page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			TotalItems:  totalItems,
		},
	})
}
