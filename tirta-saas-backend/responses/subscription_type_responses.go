package responses

import (
	"time"

	"github.com/google/uuid"
)

type SubscriptionTypeResponse struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	RegistrationFee float64   `json:"registration_fee"`
	MonthlyFee      float64   `json:"monthly_fee"`
	MaintenanceFee  float64   `json:"maintenance_fee"`
	LateFeePerDay   float64   `json:"late_fee_per_day"`
	MaxLateFee      float64   `json:"max_late_fee"`
	CreatedAt       time.Time `json:"created_at"`
}
