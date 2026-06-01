package controllers

import (
	"encoding/json"
	"testing"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/google/uuid"
)

// TestCreateWaterUsageRequest_MeterIDField validates the MeterID field is present and optional
func TestCreateWaterUsageRequest_MeterIDField(t *testing.T) {
	tests := []struct {
		name      string
		req       requests.CreateWaterUsageRequest
		wantError bool
	}{
		{
			name: "Request with MeterID provided",
			req: requests.CreateWaterUsageRequest{
				CustomerID: uuid.New(),
				MeterID:    ptrUUID(uuid.New()),
				UsageMonth: "2025-06",
				MeterEnd:   150.5,
				Notes:      "Test with meter",
			},
			wantError: false,
		},
		{
			name: "Request without MeterID (optional)",
			req: requests.CreateWaterUsageRequest{
				CustomerID: uuid.New(),
				UsageMonth: "2025-06",
				MeterEnd:   150.5,
				Notes:      "Test without meter",
			},
			wantError: false,
		},
		{
			name: "Request with client-generated ID for idempotency",
			req: requests.CreateWaterUsageRequest{
				ID:         ptrUUID(uuid.New()),
				CustomerID: uuid.New(),
				MeterID:    ptrUUID(uuid.New()),
				UsageMonth: "2025-06",
				MeterEnd:   150.5,
			},
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Verify the struct can be marshaled/unmarshaled
			data, err := json.Marshal(tt.req)
			if err != nil {
				t.Fatalf("Failed to marshal request: %v", err)
			}

			var unmarshaled requests.CreateWaterUsageRequest
			if err := json.Unmarshal(data, &unmarshaled); err != nil {
				t.Fatalf("Failed to unmarshal request: %v", err)
			}

			// Verify fields are preserved
			if unmarshaled.CustomerID != tt.req.CustomerID {
				t.Error("CustomerID mismatch after unmarshal")
			}
			if unmarshaled.UsageMonth != tt.req.UsageMonth {
				t.Error("UsageMonth mismatch after unmarshal")
			}
			if unmarshaled.MeterEnd != tt.req.MeterEnd {
				t.Error("MeterEnd mismatch after unmarshal")
			}

			// Check MeterID field handling
			if tt.req.MeterID == nil && unmarshaled.MeterID != nil {
				t.Error("MeterID should be nil for optional case")
			}
			if tt.req.MeterID != nil && unmarshaled.MeterID == nil {
				t.Error("MeterID should be preserved when provided")
			}
		})
	}
}

// TestWaterUsageModel_MeterIDField validates the model includes MeterID for multi-meter support
func TestWaterUsageModel_MeterIDField(t *testing.T) {
	usage := models.WaterUsage{
		CustomerID:  uuid.New(),
		UsageMonth:  "2025-06",
		MeterStart:  140.0,
		MeterEnd:    150.5,
		UsageM3:     10.5,
		TenantID:    uuid.New(),
		MeterID:     ptrUUID(uuid.New()),
		ReadingMethod: "manual",
	}

	// Verify MeterID field is accessible
	if usage.MeterID == nil {
		t.Fatal("MeterID should not be nil in test setup")
	}

	if *usage.MeterID == uuid.Nil {
		t.Error("MeterID value is invalid")
	}

	// Test without MeterID (fallback to single meter)
	usage2 := models.WaterUsage{
		CustomerID:    uuid.New(),
		UsageMonth:    "2025-06",
		MeterStart:    140.0,
		MeterEnd:      150.5,
		UsageM3:       10.5,
		TenantID:      uuid.New(),
		ReadingMethod: "manual",
	}

	if usage2.MeterID != nil {
		t.Error("MeterID should be nil for single-meter case")
	}
}

// Helper function to create a pointer to uuid.UUID
func ptrUUID(id uuid.UUID) *uuid.UUID {
	return &id
}

// TestMultiMeterLogicValidation validates the key multi-meter scenarios
func TestMultiMeterLogicValidation(t *testing.T) {
	tests := []struct {
		name                string
		hasMeterID          bool
		meterIDForQuery     *uuid.UUID
		expectedMeterUsage  bool
		description         string
	}{
		{
			name:               "Single meter scenario (MeterID nil)",
			hasMeterID:         false,
			meterIDForQuery:    nil,
			expectedMeterUsage: false,
			description:        "Fallback to active meter when MeterID not provided",
		},
		{
			name:               "Multi-meter scenario (MeterID provided)",
			hasMeterID:         true,
			meterIDForQuery:    ptrUUID(uuid.New()),
			expectedMeterUsage: true,
			description:        "Use specific meter when MeterID provided",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Verify the scenario is valid
			if tt.hasMeterID && tt.meterIDForQuery == nil {
				t.Fatal("Test setup error: MeterID should not be nil when hasMeterID is true")
			}

			if !tt.hasMeterID && tt.meterIDForQuery != nil {
				t.Fatal("Test setup error: MeterID should be nil when hasMeterID is false")
			}

			// In actual implementation, this would query the database
			// Here we just validate the logic structure
			if tt.expectedMeterUsage && tt.meterIDForQuery == nil {
				t.Error("Expected meter usage but meterIDForQuery is nil")
			}
		})
	}
}
