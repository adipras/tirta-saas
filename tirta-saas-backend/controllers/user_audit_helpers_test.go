package controllers

import (
	"testing"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

func TestManagedUserAuditValuesOmitsPasswordAndFormatsPointers(t *testing.T) {
	tenantID := uuid.New()
	createdByID := uuid.New()
	email := "operator@example.com"

	user := models.User{
		BaseModel:   models.BaseModel{ID: uuid.New()},
		Name:        "Operator Tirta",
		Username:    "operator.tirta",
		Email:       &email,
		Password:    "hashed-secret",
		Role:        "finance",
		TenantID:    &tenantID,
		CreatedByID: &createdByID,
	}

	values := managedUserAuditValues(user)

	if _, exists := values["password"]; exists {
		t.Fatalf("password should not be included in audit values")
	}

	if values["email"] != email {
		t.Fatalf("expected email %q, got %#v", email, values["email"])
	}

	if values["tenant_id"] != tenantID.String() {
		t.Fatalf("expected tenant_id %q, got %#v", tenantID.String(), values["tenant_id"])
	}

	if values["created_by_id"] != createdByID.String() {
		t.Fatalf("expected created_by_id %q, got %#v", createdByID.String(), values["created_by_id"])
	}
}

func TestManagedUserWithProfileAuditValuesIncludesProfileAndRoles(t *testing.T) {
	userID := uuid.New()
	profileID := uuid.New()
	dateOfBirth := time.Date(1990, time.January, 2, 0, 0, 0, 0, time.UTC)

	user := models.User{
		BaseModel: models.BaseModel{ID: userID},
		Name:      "Admin Tirta",
		Username:  "admin.tirta",
		Role:      "tenant_admin",
	}

	profile := models.UserProfile{
		BaseModel:   models.BaseModel{ID: profileID},
		UserID:      userID,
		FullName:    "Admin Tirta",
		PhoneNumber: "08123456789",
		Department:  "Operasional",
		DateOfBirth: &dateOfBirth,
	}

	roles := []models.Role{
		{
			BaseModel:   models.BaseModel{ID: uuid.New()},
			Name:        "finance",
			DisplayName: "Finance",
			IsActive:    true,
		},
	}

	values := managedUserWithProfileAuditValues(user, &profile, roles)

	roleValues, ok := values["roles"].([]map[string]interface{})
	if !ok || len(roleValues) != 1 {
		t.Fatalf("expected one role value, got %#v", values["roles"])
	}

	profileValues, ok := values["profile"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected profile values map, got %#v", values["profile"])
	}

	if profileValues["date_of_birth"] != "1990-01-02" {
		t.Fatalf("expected formatted date_of_birth, got %#v", profileValues["date_of_birth"])
	}
}
