package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// HandleTrailingSlash removes trailing slashes from URLs
// Works in conjunction with RedirectTrailingSlash = false
func HandleTrailingSlash() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		
		// If URL ends with slash (except root), remove it
		if len(path) > 1 && strings.HasSuffix(path, "/") {
			c.Request.URL.Path = strings.TrimSuffix(path, "/")
		}
		
		c.Next()
	}
}
