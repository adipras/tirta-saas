package responses

import (
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

type ReadingRouteResponse struct {
	ID            uuid.UUID `json:"id"`
	Code          string    `json:"code"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	AssignedUser  *string   `json:"assigned_user,omitempty"`
	ScheduleDay   int       `json:"schedule_day"`
	EstDuration   int       `json:"est_duration"`
	CustomerCount int       `json:"customer_count"`
	IsActive      bool      `json:"is_active"`
}

type ReadingSessionResponse struct {
	ID             uuid.UUID  `json:"id"`
	Route          ReadingRouteResponse `json:"route"`
	ReaderName     string     `json:"reader_name"`
	ScheduledDate  time.Time  `json:"scheduled_date"`
	StartTime      *time.Time `json:"start_time"`
	EndTime        *time.Time `json:"end_time"`
	Status         string     `json:"status"`
	TotalCustomers int        `json:"total_customers"`
	CompletedCount int        `json:"completed_count"`
	AnomalyCount   int        `json:"anomaly_count"`
	Notes          string     `json:"notes,omitempty"`
}

type ReadingAnomalyResponse struct {
	ID            uuid.UUID  `json:"id"`
	CustomerName  string     `json:"customer_name"`
	MeterNumber   string     `json:"meter_number"`
	UsageMonth    string     `json:"usage_month"`
	AnomalyType   string     `json:"anomaly_type"`
	ExpectedValue float64    `json:"expected_value"`
	ActualValue   float64    `json:"actual_value"`
	Deviation     float64    `json:"deviation"`
	Status        string     `json:"status"`
	ResolvedBy    *string    `json:"resolved_by,omitempty"`
	ResolvedAt    *time.Time `json:"resolved_at,omitempty"`
	Resolution    string     `json:"resolution,omitempty"`
	Notes         string     `json:"notes,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

func ToReadingRouteResponse(route *models.ReadingRoute) ReadingRouteResponse {
	response := ReadingRouteResponse{
		ID:            route.ID,
		Code:          route.Code,
		Name:          route.Name,
		Description:   route.Description,
		ScheduleDay:   route.ScheduleDay,
		EstDuration:   route.EstDuration,
		CustomerCount: route.CustomerCount,
		IsActive:      route.IsActive,
	}
	
	if route.AssignedUser != nil {
		assignedUser := route.AssignedUser.Email
		response.AssignedUser = &assignedUser
	}
	
	return response
}

func ToReadingSessionResponse(session *models.ReadingSession) ReadingSessionResponse {
	return ReadingSessionResponse{
		ID:             session.ID,
		Route:          ToReadingRouteResponse(&session.Route),
		ReaderName:     session.Reader.Email,
		ScheduledDate:  session.ScheduledDate,
		StartTime:      session.StartTime,
		EndTime:        session.EndTime,
		Status:         session.Status,
		TotalCustomers: session.TotalCustomers,
		CompletedCount: session.CompletedCount,
		AnomalyCount:   session.AnomalyCount,
		Notes:          session.Notes,
	}
}

func ToReadingAnomalyResponse(anomaly *models.ReadingAnomaly) ReadingAnomalyResponse {
	response := ReadingAnomalyResponse{
		ID:            anomaly.ID,
		CustomerName:  anomaly.WaterUsage.Customer.Name,
		MeterNumber:   anomaly.WaterUsage.Customer.MeterNumber,
		UsageMonth:    anomaly.WaterUsage.UsageMonth,
		AnomalyType:   anomaly.AnomalyType,
		ExpectedValue: anomaly.ExpectedValue,
		ActualValue:   anomaly.ActualValue,
		Deviation:     anomaly.Deviation,
		Status:        anomaly.Status,
		Notes:         anomaly.Notes,
		CreatedAt:     anomaly.CreatedAt,
	}
	
	if anomaly.Resolver != nil {
		resolvedBy := anomaly.Resolver.Email
		response.ResolvedBy = &resolvedBy
		response.ResolvedAt = anomaly.ResolvedAt
		response.Resolution = anomaly.Resolution
	}
	
	return response
}
