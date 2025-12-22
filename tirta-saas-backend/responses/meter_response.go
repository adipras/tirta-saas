package responses

import (
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

type MeterResponse struct {
	ID             uuid.UUID  `json:"id"`
	MeterNumber    string     `json:"meter_number"`
	Brand          string     `json:"brand"`
	Model          string     `json:"model"`
	InstallDate    time.Time  `json:"install_date"`
	LastCalibDate  *time.Time `json:"last_calib_date"`
	NextCalibDate  *time.Time `json:"next_calib_date"`
	InitialReading float64    `json:"initial_reading"`
	Status         string     `json:"status"`
	Notes          string     `json:"notes"`
	CustomerName   string     `json:"customer_name,omitempty"`
}

type MeterIssueResponse struct {
	ID          uuid.UUID  `json:"id"`
	Meter       MeterResponse `json:"meter"`
	IssueType   string     `json:"issue_type"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	PhotoURL    string     `json:"photo_url,omitempty"`
	ReportedBy  string     `json:"reported_by"`
	ResolvedBy  *string    `json:"resolved_by,omitempty"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
	Resolution  string     `json:"resolution,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type MeterHistoryResponse struct {
	ID          uuid.UUID `json:"id"`
	MeterNumber string    `json:"meter_number"`
	CustomerName string   `json:"customer_name"`
	Action      string    `json:"action"`
	OldValue    string    `json:"old_value,omitempty"`
	NewValue    string    `json:"new_value,omitempty"`
	PerformedBy string    `json:"performed_by"`
	Notes       string    `json:"notes,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

func ToMeterResponse(meter *models.Meter) MeterResponse {
	response := MeterResponse{
		ID:             meter.ID,
		MeterNumber:    meter.MeterNumber,
		Brand:          meter.Brand,
		Model:          meter.Model,
		InstallDate:    meter.InstallDate,
		LastCalibDate:  meter.LastCalibDate,
		NextCalibDate:  meter.NextCalibDate,
		InitialReading: meter.InitialReading,
		Status:         meter.Status,
		Notes:          meter.Notes,
	}
	
	if meter.Customer.Name != "" {
		response.CustomerName = meter.Customer.Name
	}
	
	return response
}

func ToMeterIssueResponse(issue *models.MeterIssue) MeterIssueResponse {
	response := MeterIssueResponse{
		ID:          issue.ID,
		Meter:       ToMeterResponse(&issue.Meter),
		IssueType:   issue.IssueType,
		Description: issue.Description,
		Status:      issue.Status,
		Priority:    issue.Priority,
		PhotoURL:    issue.PhotoURL,
		ReportedBy:  issue.Reporter.Email,
		CreatedAt:   issue.CreatedAt,
	}
	
	if issue.Resolver != nil {
		resolvedBy := issue.Resolver.Email
		response.ResolvedBy = &resolvedBy
		response.ResolvedAt = issue.ResolvedAt
		response.Resolution = issue.Resolution
	}
	
	return response
}
