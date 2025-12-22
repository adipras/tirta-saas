package models

import (
	"time"

	"github.com/google/uuid"
)

type ReadingRoute struct {
	BaseModel
	TenantID     uuid.UUID  `gorm:"type:char(36);not null;index:idx_tenant_route" json:"tenant_id"`
	Code         string     `gorm:"type:varchar(20);not null" json:"code"`
	Name         string     `gorm:"type:varchar(100);not null" json:"name"`
	Description  string     `gorm:"type:text" json:"description"`
	AssignedTo   *uuid.UUID `gorm:"type:char(36);index" json:"assigned_to"`
	ScheduleDay  int        `gorm:"type:int;comment:'Day of month (1-31)'" json:"schedule_day"`
	EstDuration  int        `gorm:"type:int;comment:'Estimated duration in minutes'" json:"est_duration"`
	CustomerCount int       `gorm:"default:0" json:"customer_count"`
	IsActive     bool       `gorm:"default:true;not null" json:"is_active"`

	// Relationships
	Tenant       Tenant                `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	AssignedUser *User                 `gorm:"foreignKey:AssignedTo" json:"assigned_user,omitempty"`
	Customers    []Customer            `gorm:"foreignKey:ReadingRouteID" json:"-"`
	Sessions     []ReadingSession      `gorm:"foreignKey:RouteID" json:"-"`
}

type ReadingSession struct {
	BaseModel
	TenantID        uuid.UUID  `gorm:"type:char(36);not null;index:idx_tenant_reading_session" json:"tenant_id"`
	RouteID         uuid.UUID  `gorm:"type:char(36);not null;index:idx_route_session" json:"route_id"`
	ReaderID        uuid.UUID  `gorm:"type:char(36);not null" json:"reader_id"`
	ScheduledDate   time.Time  `gorm:"type:date;not null" json:"scheduled_date"`
	StartTime       *time.Time `gorm:"type:datetime" json:"start_time"`
	EndTime         *time.Time `gorm:"type:datetime" json:"end_time"`
	Status          string     `gorm:"type:varchar(20);default:'scheduled';not null" json:"status"`
	TotalCustomers  int        `gorm:"default:0" json:"total_customers"`
	CompletedCount  int        `gorm:"default:0" json:"completed_count"`
	AnomalyCount    int        `gorm:"default:0" json:"anomaly_count"`
	Notes           string     `gorm:"type:text" json:"notes"`

	// Relationships
	Tenant  Tenant        `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	Route   ReadingRoute  `gorm:"foreignKey:RouteID;constraint:OnDelete:CASCADE" json:"route"`
	Reader  User          `gorm:"foreignKey:ReaderID" json:"reader"`
	Readings []WaterUsage `gorm:"foreignKey:ReadingSessionID" json:"-"`
}

type ReadingAnomaly struct {
	BaseModel
	TenantID       uuid.UUID  `gorm:"type:char(36);not null;index:idx_tenant_anomaly" json:"tenant_id"`
	WaterUsageID   uuid.UUID  `gorm:"type:char(36);not null;index:idx_usage_anomaly" json:"water_usage_id"`
	AnomalyType    string     `gorm:"type:varchar(50);not null" json:"anomaly_type"` // high_usage, low_usage, no_usage, negative
	ExpectedValue  float64    `gorm:"type:decimal(10,2)" json:"expected_value"`
	ActualValue    float64    `gorm:"type:decimal(10,2)" json:"actual_value"`
	Deviation      float64    `gorm:"type:decimal(10,2)" json:"deviation"`
	Status         string     `gorm:"type:varchar(20);default:'pending';not null" json:"status"`
	ResolvedBy     *uuid.UUID `gorm:"type:char(36)" json:"resolved_by"`
	ResolvedAt     *time.Time `gorm:"type:datetime" json:"resolved_at"`
	Resolution     string     `gorm:"type:text" json:"resolution"`
	Notes          string     `gorm:"type:text" json:"notes"`

	// Relationships
	Tenant     Tenant      `gorm:"foreignKey:TenantID;constraint:OnDelete:CASCADE" json:"-"`
	WaterUsage WaterUsage  `gorm:"foreignKey:WaterUsageID;constraint:OnDelete:CASCADE" json:"water_usage"`
	Resolver   *User       `gorm:"foreignKey:ResolvedBy" json:"resolver,omitempty"`
}

// Reading session status
const (
	ReadingSessionScheduled   = "scheduled"
	ReadingSessionInProgress  = "in_progress"
	ReadingSessionCompleted   = "completed"
	ReadingSessionCancelled   = "cancelled"
)

// Anomaly types
const (
	AnomalyTypeHighUsage  = "high_usage"
	AnomalyTypeLowUsage   = "low_usage"
	AnomalyTypeNoUsage    = "no_usage"
	AnomalyTypeNegative   = "negative"
	AnomalyTypeStuck      = "stuck"
)

// Anomaly status
const (
	AnomalyStatusPending   = "pending"
	AnomalyStatusInvestigating = "investigating"
	AnomalyStatusResolved  = "resolved"
	AnomalyStatusIgnored   = "ignored"
)
