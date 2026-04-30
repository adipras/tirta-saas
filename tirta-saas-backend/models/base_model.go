package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BaseModel struct {
	ID        uuid.UUID      `gorm:"type:char(36);primary_key" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (base *BaseModel) BeforeCreate(tx *gorm.DB) (err error) {
	// Only generate a new UUID if one is not already provided by the client.
	if base.ID == uuid.Nil {
		base.ID = uuid.New()
	}
	return
}
