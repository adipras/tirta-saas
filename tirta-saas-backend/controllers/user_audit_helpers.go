package controllers

import (
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/google/uuid"
)

func uuidPointerString(id *uuid.UUID) string {
	if id == nil {
		return ""
	}

	return id.String()
}

func managedUserAuditValues(user models.User) map[string]interface{} {
	return map[string]interface{}{
		"id":            user.ID.String(),
		"name":          user.Name,
		"username":      user.Username,
		"email":         utils.StringValue(user.Email),
		"role":          user.Role,
		"tenant_id":     uuidPointerString(user.TenantID),
		"created_by_id": uuidPointerString(user.CreatedByID),
	}
}

func managedUserProfileAuditValues(profile models.UserProfile) map[string]interface{} {
	values := map[string]interface{}{
		"id":           profile.ID.String(),
		"user_id":      profile.UserID.String(),
		"full_name":    profile.FullName,
		"phone_number": profile.PhoneNumber,
		"address":      profile.Address,
		"avatar_url":   profile.AvatarURL,
		"position":     profile.Position,
		"department":   profile.Department,
		"notes":        profile.Notes,
	}

	if profile.DateOfBirth != nil {
		values["date_of_birth"] = profile.DateOfBirth.Format("2006-01-02")
	} else {
		values["date_of_birth"] = ""
	}

	return values
}

func managedRoleAuditValues(roles []models.Role) []map[string]interface{} {
	values := make([]map[string]interface{}, 0, len(roles))
	for _, role := range roles {
		values = append(values, map[string]interface{}{
			"id":           role.ID.String(),
			"name":         role.Name,
			"display_name": role.DisplayName,
			"is_system":    role.IsSystem,
			"is_active":    role.IsActive,
		})
	}

	return values
}

func managedUserWithProfileAuditValues(user models.User, profile *models.UserProfile, roles []models.Role) map[string]interface{} {
	values := managedUserAuditValues(user)
	values["roles"] = managedRoleAuditValues(roles)

	if profile != nil {
		values["profile"] = managedUserProfileAuditValues(*profile)
	}

	return values
}
