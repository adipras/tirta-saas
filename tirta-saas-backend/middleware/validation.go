package middleware

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
	
	// Register custom validators
	validate.RegisterValidation("phone", validatePhone)
	validate.RegisterValidation("customer_id", validateCustomerID)
	validate.RegisterValidation("usage_month", validateUsageMonth)
	validate.RegisterValidation("date", validateDate)
}

// Custom validator for phone numbers (Indonesian format)
func validatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	if phone == "" {
		return true // Allow empty phone numbers (optional field)
	}
	
	// Indonesian phone number format: +62xxx, 08xxx, or 62xxx
	phoneRegex := regexp.MustCompile(`^(\+62|62|0)8[1-9][0-9]{6,10}$`)
	return phoneRegex.MatchString(phone)
}

// Custom validator for customer ID format
func validateCustomerID(fl validator.FieldLevel) bool {
	customerID := fl.Field().String()
	if customerID == "" {
		return true
	}
	
	// Customer ID should be alphanumeric, 6-20 characters
	customerIDRegex := regexp.MustCompile(`^[A-Za-z0-9]{6,20}$`)
	return customerIDRegex.MatchString(customerID)
}

// Custom validator for usage month format (YYYY-MM)
func validateUsageMonth(fl validator.FieldLevel) bool {
	usageMonth := fl.Field().String()
	if usageMonth == "" {
		return true
	}
	
	usageMonthRegex := regexp.MustCompile(`^\d{4}-\d{2}$`)
	return usageMonthRegex.MatchString(usageMonth)
}

// Custom validator for date format (YYYY-MM-DD)
func validateDate(fl validator.FieldLevel) bool {
	date := fl.Field().String()
	if date == "" {
		return true
	}
	
	dateRegex := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	return dateRegex.MatchString(date)
}

// ValidationErrorMiddleware provides structured validation errors
func ValidationErrorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		
		// Check if there are any validation errors
		if len(c.Errors) > 0 {
			var validationErrors []gin.H
			
			for _, err := range c.Errors {
				if validationErr, ok := err.Err.(validator.ValidationErrors); ok {
					for _, fieldErr := range validationErr {
						validationErrors = append(validationErrors, gin.H{
							"field":   getJSONFieldName(fieldErr),
							"tag":     fieldErr.Tag(),
							"value":   fieldErr.Value(),
							"message": getValidationMessage(fieldErr),
						})
					}
				} else {
					validationErrors = append(validationErrors, gin.H{
						"message": err.Error(),
					})
				}
			}
			
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Validation failed",
				"details": validationErrors,
			})
			c.Abort()
		}
	}
}

// Helper function to get JSON field name from struct tag
func getJSONFieldName(fieldErr validator.FieldError) string {
	field := fieldErr.Field()
	
	// Convert PascalCase to snake_case for API consistency
	var result strings.Builder
	for i, r := range field {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	
	return strings.ToLower(result.String())
}

// Helper function to provide user-friendly validation messages
func getValidationMessage(fieldErr validator.FieldError) string {
	field := getJSONFieldName(fieldErr)
	
	switch fieldErr.Tag() {
	case "required":
		return field + " is required"
	case "email":
		return field + " must be a valid email address"
	case "min":
		return field + " must be at least " + fieldErr.Param() + " characters"
	case "max":
		return field + " must be at most " + fieldErr.Param() + " characters"
	case "phone":
		return field + " must be a valid Indonesian phone number"
	case "customer_id":
		return field + " must be alphanumeric and 6-20 characters long"
	case "usage_month":
		return field + " must be in YYYY-MM format"
	case "date":
		return field + " must be in YYYY-MM-DD format"
	case "gt":
		return field + " must be greater than " + fieldErr.Param()
	case "gte":
		return field + " must be greater than or equal to " + fieldErr.Param()
	case "lt":
		return field + " must be less than " + fieldErr.Param()
	case "lte":
		return field + " must be less than or equal to " + fieldErr.Param()
	case "uuid":
		return field + " must be a valid UUID"
	default:
		return field + " is invalid"
	}
}

// InputSanitizationMiddleware sanitizes input data
func InputSanitizationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Limit request body size (10MB)
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20)
		
		c.Next()
	}
}

// BusinessRuleValidation provides domain-specific validation
func BusinessRuleValidation() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		
		// Add any business rule validations here
		// This can be extended based on specific business requirements
	}
}

// Helper function to validate struct using custom validator
func ValidateStruct(s interface{}) error {
	return validate.Struct(s)
}

// Helper function to validate meter readings business rules
func ValidateMeterReading(startReading, endReading float64) error {
	if endReading < startReading {
		return &BusinessValidationError{
			Field:   "EndReading",
			Tag:     "meter_reading",
			Message: "end reading must be greater than or equal to start reading",
		}
	}
	return nil
}

// Helper function to validate amount ranges
func ValidateAmount(amount float64, minAmount, maxAmount float64) error {
	if amount < minAmount || amount > maxAmount {
		return &BusinessValidationError{
			Field:   "Amount",
			Tag:     "amount_range",
			Message: "amount is out of allowed range",
		}
	}
	return nil
}

// Custom business validation error type
type BusinessValidationError struct {
	Field   string
	Tag     string
	Message string
}

func (e *BusinessValidationError) Error() string {
	return e.Message
}