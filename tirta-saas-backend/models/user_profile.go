package models

import (
	"time"

	"github.com/google/uuid"
)

type UserProfile struct {
	BaseModel
	UserID      uuid.UUID  `gorm:"type:char(36);uniqueIndex;not null" json:"user_id"`
	FullName    string     `gorm:"type:varchar(150);not null" json:"full_name"`
	PhoneNumber string     `gorm:"type:varchar(20)" json:"phone_number"`
	Address     string     `gorm:"type:text" json:"address"`
	AvatarURL   string     `gorm:"type:varchar(500)" json:"avatar_url"`
	DateOfBirth *time.Time `gorm:"type:date" json:"date_of_birth"`
	Position    string     `gorm:"type:varchar(100)" json:"position"`
	Department  string     `gorm:"type:varchar(100)" json:"department"`
	Notes       string     `gorm:"type:text" json:"notes"`

	// Relationships
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

type UserSession struct {
	BaseModel
	UserID    uuid.UUID `gorm:"type:char(36);not null;index:idx_user_session" json:"user_id"`
	Token     string    `gorm:"type:varchar(500);uniqueIndex;not null" json:"token"`
	IPAddress string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent string    `gorm:"type:varchar(500)" json:"user_agent"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	IsActive  bool      `gorm:"default:true;not null" json:"is_active"`
	LastUsed  time.Time `gorm:"not null" json:"last_used"`

	// Relationships
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

type UserActivity struct {
	BaseModel
	UserID      uuid.UUID `gorm:"type:char(36);not null;index:idx_user_activity" json:"user_id"`
	Action      string    `gorm:"type:varchar(100);not null" json:"action"`
	Category    string    `gorm:"type:varchar(50);not null;index" json:"category"`
	Description string    `gorm:"type:text" json:"description"`
	IPAddress   string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent   string    `gorm:"type:varchar(500)" json:"user_agent"`
	Metadata    string    `gorm:"type:json" json:"metadata"`

	// Relationships
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

// Activity categories
const (
	ActivityCategoryAuth     = "auth"
	ActivityCategoryCustomer = "customer"
	ActivityCategoryInvoice  = "invoice"
	ActivityCategoryPayment  = "payment"
	ActivityCategorySettings = "settings"
	ActivityCategoryReport   = "report"
)
