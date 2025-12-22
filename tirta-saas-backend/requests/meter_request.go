package requests

type CreateMeterRequest struct {
	CustomerID     string  `json:"customer_id" binding:"required"`
	MeterNumber    string  `json:"meter_number" binding:"required"`
	Brand          string  `json:"brand"`
	Model          string  `json:"model"`
	InstallDate    string  `json:"install_date" binding:"required"`
	InitialReading float64 `json:"initial_reading" binding:"gte=0"`
	Notes          string  `json:"notes"`
}

type UpdateMeterRequest struct {
	Brand         string  `json:"brand"`
	Model         string  `json:"model"`
	LastCalibDate *string `json:"last_calib_date"`
	NextCalibDate *string `json:"next_calib_date"`
	Status        string  `json:"status" binding:"omitempty,oneof=active inactive broken replaced"`
	Notes         string  `json:"notes"`
}

type ReplaceMeterRequest struct {
	NewMeterNumber string  `json:"new_meter_number" binding:"required"`
	NewBrand       string  `json:"new_brand"`
	NewModel       string  `json:"new_model"`
	FinalReading   float64 `json:"final_reading" binding:"required,gte=0"`
	Reason         string  `json:"reason" binding:"required"`
	Notes          string  `json:"notes"`
}

type ReportMeterIssueRequest struct {
	MeterID     string `json:"meter_id" binding:"required"`
	IssueType   string `json:"issue_type" binding:"required,oneof=broken leak stuck incorrect other"`
	Description string `json:"description" binding:"required"`
	Priority    string `json:"priority" binding:"omitempty,oneof=low normal high critical"`
	PhotoURL    string `json:"photo_url"`
}

type ResolveMeterIssueRequest struct {
	Resolution string `json:"resolution" binding:"required"`
	Notes      string `json:"notes"`
}
