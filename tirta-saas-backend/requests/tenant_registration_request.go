package requests

// PublicTenantRegistrationRequest represents public tenant registration
type PublicTenantRegistrationRequest struct {
	// Organization Information
	OrganizationName string `json:"organization_name" binding:"required,min=3,max=100"`
	VillageCode      string `json:"village_code" binding:"required,min=3,max=20"`
	Address          string `json:"address" binding:"required"`
	Phone            string `json:"phone" binding:"required"`
	Email            string `json:"email" binding:"required,email"`
	
	// Admin User Information
	AdminName     string `json:"admin_name" binding:"required,min=3,max=100"`
	AdminEmail    string `json:"admin_email" binding:"required,email"`
	AdminPhone    string `json:"admin_phone" binding:"required"`
	AdminPassword string `json:"admin_password" binding:"required,min=6"`
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
