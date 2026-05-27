package services

import (
	"errors"
	"time"

	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
	ErrSessionExpired      = errors.New("session expired")
)

type AuthService struct {
	db *gorm.DB
}

type AuthUserProfile struct {
	ID            string     `json:"id"`
	Username      string     `json:"username"`
	Email         string     `json:"email"`
	Name          string     `json:"name"`
	Role          string     `json:"role"`
	TenantID      *string    `json:"tenant_id,omitempty"`
	TenantName    *string    `json:"tenant_name,omitempty"`
	TenantLogoURL *string    `json:"tenant_logo_url,omitempty"`
	TrialEndsAt   *time.Time `json:"trial_ends_at,omitempty"`
	TenantStatus  *string    `json:"tenant_status,omitempty"`
}

type AuthSessionPayload struct {
	Token         string          `json:"token"`
	RefreshToken  string          `json:"refresh_token"`
	User          AuthUserProfile `json:"user"`
	Role          string          `json:"role"`
	TenantID      *string         `json:"tenant_id,omitempty"`
	TenantName    *string         `json:"tenant_name,omitempty"`
	TenantLogoURL *string         `json:"tenant_logo_url,omitempty"`
	TrialEndsAt   *time.Time      `json:"trial_ends_at,omitempty"`
	TenantStatus  *string         `json:"tenant_status,omitempty"`
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) BuildUserProfile(user models.User) (AuthUserProfile, error) {
	profile := AuthUserProfile{
		ID:       user.ID.String(),
		Username: user.Username,
		Email:    utils.StringValue(user.Email),
		Name:     user.Name,
		Role:     user.Role,
	}

	if user.TenantID == nil {
		return profile, nil
	}

	tenantID := user.TenantID.String()
	profile.TenantID = &tenantID

	var tenant models.Tenant
	if err := s.db.Select("name, trial_ends_at, status").First(&tenant, "id = ?", user.TenantID).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return AuthUserProfile{}, err
	} else if err == nil {
		profile.TenantName = &tenant.Name
		profile.TrialEndsAt = tenant.TrialEndsAt
		status := string(tenant.Status)
		profile.TenantStatus = &status
	}

	var settings models.TenantSettings
	if err := s.db.Select("logo_url").First(&settings, "tenant_id = ?", user.TenantID).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return AuthUserProfile{}, err
	} else if err == nil && settings.LogoURL != "" {
		profile.TenantLogoURL = &settings.LogoURL
	}

	return profile, nil
}

func (s *AuthService) CreateSession(user models.User, ipAddress, userAgent string) (*AuthSessionPayload, error) {
	accessToken, err := utils.GenerateJWT(user.ID, user.TenantID, user.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, expiresAt, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	session := models.UserSession{
		UserID:    user.ID,
		Token:     refreshToken,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		ExpiresAt: expiresAt,
		IsActive:  true,
		LastUsed:  time.Now(),
	}

	if err := s.db.Create(&session).Error; err != nil {
		return nil, err
	}

	return s.buildSessionPayload(user, accessToken, refreshToken)
}

func (s *AuthService) RefreshSession(refreshToken, ipAddress, userAgent string) (*AuthSessionPayload, error) {
	claims, err := utils.ParseTokenClaims(refreshToken)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	tokenType, _ := claims["token_type"].(string)
	if tokenType != "refresh" {
		return nil, ErrInvalidRefreshToken
	}

	userIDStr, ok := claims["user_id"].(string)
	if !ok || userIDStr == "" {
		return nil, ErrInvalidRefreshToken
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	var session models.UserSession
	if err := s.db.Where("user_id = ? AND token = ? AND is_active = ?", userID, refreshToken, true).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidRefreshToken
		}
		return nil, err
	}

	if session.ExpiresAt.Before(time.Now()) {
		_ = s.db.Model(&session).Updates(map[string]interface{}{
			"is_active":  false,
			"updated_at": time.Now(),
		}).Error
		return nil, ErrSessionExpired
	}

	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	accessToken, err := utils.GenerateJWT(user.ID, user.TenantID, user.Role)
	if err != nil {
		return nil, err
	}

	newRefreshToken, expiresAt, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	if err := s.db.Model(&session).Updates(map[string]interface{}{
		"token":      newRefreshToken,
		"ip_address": ipAddress,
		"user_agent": userAgent,
		"expires_at": expiresAt,
		"last_used":  time.Now(),
		"updated_at": time.Now(),
	}).Error; err != nil {
		return nil, err
	}

	return s.buildSessionPayload(user, accessToken, newRefreshToken)
}

func (s *AuthService) InvalidateUserSessions(userID uuid.UUID) error {
	return s.db.Model(&models.UserSession{}).
		Where("user_id = ? AND is_active = ?", userID, true).
		Updates(map[string]interface{}{
			"is_active":  false,
			"updated_at": time.Now(),
		}).Error
}

func (s *AuthService) buildSessionPayload(user models.User, accessToken, refreshToken string) (*AuthSessionPayload, error) {
	profile, err := s.BuildUserProfile(user)
	if err != nil {
		return nil, err
	}

	return &AuthSessionPayload{
		Token:         accessToken,
		RefreshToken:  refreshToken,
		User:          profile,
		Role:          profile.Role,
		TenantID:      profile.TenantID,
		TenantName:    profile.TenantName,
		TenantLogoURL: profile.TenantLogoURL,
		TrialEndsAt:   profile.TrialEndsAt,
		TenantStatus:  profile.TenantStatus,
	}, nil
}
