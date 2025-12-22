package requests

type CreateReadingRouteRequest struct {
	Code        string  `json:"code" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	AssignedTo  *string `json:"assigned_to"`
	ScheduleDay int     `json:"schedule_day" binding:"required,min=1,max=31"`
	EstDuration int     `json:"est_duration"`
}

type UpdateReadingRouteRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	AssignedTo  *string `json:"assigned_to"`
	ScheduleDay int     `json:"schedule_day" binding:"required,min=1,max=31"`
	EstDuration int     `json:"est_duration"`
	IsActive    *bool   `json:"is_active"`
}

type StartReadingSessionRequest struct {
	RouteID       string `json:"route_id" binding:"required"`
	ScheduledDate string `json:"scheduled_date" binding:"required"`
}

type RecordMeterReadingRequest struct {
	CustomerID    string  `json:"customer_id" binding:"required"`
	MeterID       *string `json:"meter_id"`
	SessionID     *string `json:"session_id"`
	UsageMonth    string  `json:"usage_month" binding:"required"`
	MeterReading  float64 `json:"meter_reading" binding:"required,gte=0"`
	PhotoURL      string  `json:"photo_url"`
	ReadingMethod string  `json:"reading_method" binding:"omitempty,oneof=manual automatic estimated"`
	Notes         string  `json:"notes"`
}

type BatchRecordReadingsRequest struct {
	SessionID *string                      `json:"session_id"`
	Readings  []RecordMeterReadingRequest `json:"readings" binding:"required,min=1,dive"`
}

type ResolveAnomalyRequest struct {
	Resolution string `json:"resolution" binding:"required"`
	Notes      string `json:"notes"`
}
