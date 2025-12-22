// models/payment.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Payment struct {
	TenantID  uuid.UUID `gorm:"type:char(36);not null;index" json:"tenant_id"`
	InvoiceID uuid.UUID `gorm:"type:char(36);not null;index" json:"invoice_id"`
	Invoice   Invoice   `gorm:"foreignKey:InvoiceID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"invoice"`
	Amount    float64   `gorm:"not null" json:"amount"`
	Penalty   float64   `gorm:"default:0" json:"penalty"`
	PaidAt    time.Time `gorm:"not null" json:"paid_at"`
	
	// Additional fields for Phase 6
	PaymentMethodID *uuid.UUID     `gorm:"type:char(36);index" json:"payment_method_id"`
	PaymentMethod   *PaymentMethod `gorm:"foreignKey:PaymentMethodID" json:"payment_method,omitempty"`
	ReceivedBy      *uuid.UUID     `gorm:"type:char(36)" json:"received_by"`
	Receiver        *User          `gorm:"foreignKey:ReceivedBy" json:"receiver,omitempty"`
	ReferenceNumber string         `gorm:"type:varchar(100)" json:"reference_number"`
	ProofImageURL   string         `gorm:"type:varchar(500)" json:"proof_image_url"`
	Notes           string         `gorm:"type:text" json:"notes"`
	VerifiedBy      *uuid.UUID     `gorm:"type:char(36)" json:"verified_by"`
	VerifiedAt      *time.Time     `gorm:"type:datetime" json:"verified_at"`
	Status          string         `gorm:"type:varchar(20);default:'completed';not null" json:"status"`

	BaseModel
}

func (p *Payment) BeforeCreate(tx *gorm.DB) (err error) {
	if err = p.BaseModel.BeforeCreate(tx); err != nil {
		return
	}
	p.PaidAt = time.Now()
	return
}
