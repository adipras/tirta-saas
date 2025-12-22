package models

import (
	"time"

	"github.com/google/uuid"
)

type Meter struct {
	BaseModel
	TenantID       uuid.UUID  `gorm:"type:char(36);not null;index:idx_tenant_meter" json:"tenant_id"`
	CustomerID     uuid.UUID  `gorm:"type:char(36);not null;index:idx_customer_meter" json:"customer_id"`
	MeterNumber    string     `gorm:"type:varchar(50);not null" json:"meter_number"`
	Brand          string     `gorm:"type:varchar(100)" json:"brand"`
	Model          string     `gorm:"type:varchar(100)" json:"model"`
	InstallDate    time.Time  `gorm:"type:date;not null" json:"install_date"`
	LastCalibDate  *time.Time `gorm:"type:date" json:"last_calib_date"`
	NextCalibDate  *time.Time `gorm:"type:date" json:"next_calib_date"`
	InitialReading float64    `gorm:"type:decimal(10,2);default:0" json:"initial_reading"`
	Status         string     `gorm:"type:varchar(20);default:'active';not null" json:"status"`
	Notes          string     `gorm:"type:text" json:"notes"`

	// Relationships
	Tenant      Tenant            `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Customer    Customer          `gorm:"foreignKey:CustomerID;constraint:OnDelete:CASCADE" json:"customer"`
	Readings    []WaterUsage      `gorm:"foreignKey:MeterID" json:"-"`
	Issues      []MeterIssue      `gorm:"foreignKey:MeterID" json:"-"`
	History     []MeterHistory    `gorm:"foreignKey:MeterID" json:"-"`
}

type MeterIssue struct {
	BaseModel
	TenantID    uuid.UUID  `gorm:"type:char(36);not null;index:idx_tenant_meter_issue" json:"tenant_id"`
	MeterID     uuid.UUID  `gorm:"type:char(36);not null;index:idx_meter_issue" json:"meter_id"`
	ReportedBy  uuid.UUID  `gorm:"type:char(36);not null" json:"reported_by"`
	IssueType   string     `gorm:"type:varchar(50);not null" json:"issue_type"` // broken, leak, stuck, incorrect
	Description string     `gorm:"type:text;not null" json:"description"`
	Status      string     `gorm:"type:varchar(20);default:'open';not null" json:"status"`
	Priority    string     `gorm:"type:varchar(20);default:'normal';not null" json:"priority"`
	ResolvedBy  *uuid.UUID `gorm:"type:char(36)" json:"resolved_by"`
	ResolvedAt  *time.Time `gorm:"type:datetime" json:"resolved_at"`
	Resolution  string     `gorm:"type:text" json:"resolution"`
	PhotoURL    string     `gorm:"type:varchar(500)" json:"photo_url"`

	// Relationships
	Tenant   Tenant   `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Meter    Meter    `gorm:"foreignKey:MeterID;constraint:OnDelete:CASCADE" json:"meter"`
	Reporter User     `gorm:"foreignKey:ReportedBy" json:"reporter"`
	Resolver *User    `gorm:"foreignKey:ResolvedBy" json:"resolver,omitempty"`
}

type MeterHistory struct {
	BaseModel
	TenantID    uuid.UUID `gorm:"type:char(36);not null;index:idx_tenant_meter_history" json:"tenant_id"`
	MeterID     uuid.UUID `gorm:"type:char(36);not null;index:idx_meter_history" json:"meter_id"`
	CustomerID  uuid.UUID `gorm:"type:char(36);not null" json:"customer_id"`
	Action      string    `gorm:"type:varchar(50);not null" json:"action"` // install, replace, remove, calibrate
	OldValue    string    `gorm:"type:text" json:"old_value"`
	NewValue    string    `gorm:"type:text" json:"new_value"`
	PerformedBy uuid.UUID `gorm:"type:char(36);not null" json:"performed_by"`
	Notes       string    `gorm:"type:text" json:"notes"`

	// Relationships
	Tenant    Tenant   `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Meter     Meter    `gorm:"foreignKey:MeterID;constraint:OnDelete:CASCADE" json:"-"`
	Customer  Customer `gorm:"foreignKey:CustomerID;constraint:OnDelete:CASCADE" json:"customer"`
	User      User     `gorm:"foreignKey:PerformedBy" json:"user"`
}

// Meter status
const (
	MeterStatusActive    = "active"
	MeterStatusInactive  = "inactive"
	MeterStatusBroken    = "broken"
	MeterStatusReplaced  = "replaced"
)

// Meter issue types
const (
	MeterIssueBroken    = "broken"
	MeterIssueLeak      = "leak"
	MeterIssueStuck     = "stuck"
	MeterIssueIncorrect = "incorrect"
	MeterIssueOther     = "other"
)

// Meter issue status
const (
	MeterIssueStatusOpen       = "open"
	MeterIssueStatusInProgress = "in_progress"
	MeterIssueStatusResolved   = "resolved"
	MeterIssueStatusClosed     = "closed"
)

// Meter issue priority
const (
	MeterIssuePriorityLow      = "low"
	MeterIssuePriorityNormal   = "normal"
	MeterIssuePriorityHigh     = "high"
	MeterIssuePriorityCritical = "critical"
)
