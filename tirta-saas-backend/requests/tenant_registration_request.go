package requests

// PublicTenantRegistrationRequest represents public tenant registration
type PublicTenantRegistrationRequest struct {
	// Organization Information
	OrganizationName string `json:"organization_name" form:"organization_name" binding:"required,min=3,max=100"`
	VillageCode      string `json:"village_code" form:"village_code" binding:"required,min=3,max=20"`
	Address          string `json:"address" form:"address" binding:"required"`
	Phone            string `json:"phone" form:"phone" binding:"required"`
	Email            string `json:"email" form:"email" binding:"required,email"`
	
	// Admin User Information
	AdminName     string `json:"admin_name" form:"admin_name" binding:"required,min=3,max=100"`
	AdminEmail    string `json:"admin_email" form:"admin_email" binding:"required,email"`
	AdminPhone    string `json:"admin_phone" form:"admin_phone" binding:"required"`
	AdminPassword string `json:"admin_password" form:"admin_password" binding:"required,min=6"`
}

// TenantApprovalRequest represents tenant approval by platform owner
type TenantApprovalRequest struct {
	SubscriptionPlan string `json:"subscription_plan"` // Optional: can be set during approval
	Notes            string `json:"notes"`
}

// TenantRejectionRequest represents tenant rejection
type TenantRejectionRequest struct {
	Reason string `json:"reason" binding:"required"`
}

// TenantSuspensionRequest represents tenant suspension
type TenantSuspensionRequest struct {
	Reason string `json:"reason" binding:"required"`
}
