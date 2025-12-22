package requests

type CreateSubscriptionTypeRequest struct {
	Name            string  `json:"name" binding:"required" minLength:"3" maxLength:"100" doc:"Subscription type name" example:"Residential Standard"`
	Description     string  `json:"description" maxLength:"500" doc:"Description of this subscription type" example:"Standard residential water subscription with basic features"`
	RegistrationFee float64 `json:"registration_fee" binding:"required" minimum:"0" doc:"One-time registration fee in IDR" example:"500000"`
	MonthlyFee      float64 `json:"monthly_fee" binding:"required" minimum:"0" doc:"Monthly subscription fee in IDR" example:"50000"`
	MaintenanceFee  float64 `json:"maintenance_fee" minimum:"0" doc:"Monthly maintenance fee in IDR" example:"10000"`
	LateFeePerDay   float64 `json:"late_fee_per_day" minimum:"0" doc:"Daily late payment fee in IDR" example:"5000"`
	MaxLateFee      float64 `json:"max_late_fee" minimum:"0" doc:"Maximum late fee cap in IDR" example:"100000"`
}

type UpdateSubscriptionTypeRequest struct {
	Name            string  `json:"name" minLength:"3" maxLength:"100" doc:"Subscription type name" example:"Residential Standard"`
	Description     string  `json:"description" maxLength:"500" doc:"Description of this subscription type" example:"Standard residential water subscription with basic features"`
	RegistrationFee float64 `json:"registration_fee" minimum:"0" doc:"One-time registration fee in IDR" example:"500000"`
	MonthlyFee      float64 `json:"monthly_fee" minimum:"0" doc:"Monthly subscription fee in IDR" example:"50000"`
	MaintenanceFee  float64 `json:"maintenance_fee" minimum:"0" doc:"Monthly maintenance fee in IDR" example:"10000"`
	LateFeePerDay   float64 `json:"late_fee_per_day" minimum:"0" doc:"Daily late payment fee in IDR" example:"5000"`
	MaxLateFee      float64 `json:"max_late_fee" minimum:"0" doc:"Maximum late fee cap in IDR" example:"100000"`
}
