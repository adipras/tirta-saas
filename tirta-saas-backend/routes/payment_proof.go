package routes

import (
	"github.com/adipras/tirta-saas-backend/controllers"
	"github.com/adipras/tirta-saas-backend/middleware"
	"github.com/gin-gonic/gin"
)

func PaymentProofRoutes(r *gin.Engine) {
	group := r.Group("/api/payment-proofs")
	group.Use(middleware.JWTAuthMiddleware(), middleware.CheckTenantStatus())

	// Customer can submit payment proof
	group.POST("", controllers.SubmitPaymentProof)

	// Both customer and admin can view
	group.GET("", controllers.GetPaymentProofs)
	group.GET("/:id", controllers.GetPaymentProof)
	group.GET("/:id/file/*filename", controllers.DownloadPaymentProofFile)

	// Admin only - verify/reject
	group.POST("/:id/verify", middleware.AdminOnly(), controllers.VerifyPaymentProof)
	group.POST("/:id/reject", middleware.AdminOnly(), controllers.RejectPaymentProof)
}
