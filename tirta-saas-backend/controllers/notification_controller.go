package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListNotificationTemplates lists all notification templates for a tenant
func ListNotificationTemplates(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var templates []models.NotificationTemplate
	query := config.DB.Where("tenant_id = ?", tenantID)
	
	// Filter by channel if provided
	if channel := c.Query("channel"); channel != "" {
		query = query.Where("channel = ?", channel)
	}
	
	// Filter by active status
	if c.Query("include_inactive") != "true" {
		query = query.Where("is_active = ?", true)
	}
	
	query = query.Order("name ASC")
	
	if err := query.Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to fetch notification templates",
			Error:   err.Error(),
		})
		return
	}
	
	// Transform to response
	var templateList []responses.NotificationTemplateResponse
	for _, tmpl := range templates {
		var variables []string
		if tmpl.Variables != "" {
			json.Unmarshal([]byte(tmpl.Variables), &variables)
		}
		
		templateList = append(templateList, responses.NotificationTemplateResponse{
			ID:          tmpl.ID,
			TenantID:    tmpl.TenantID,
			Code:        tmpl.Code,
			Name:        tmpl.Name,
			Description: tmpl.Description,
			Channel:     string(tmpl.Channel),
			Subject:     tmpl.Subject,
			Body:        tmpl.Body,
			HTMLBody:    tmpl.HTMLBody,
			Variables:   variables,
			IsActive:    tmpl.IsActive,
			Language:    tmpl.Language,
			CreatedAt:   tmpl.CreatedAt,
			UpdatedAt:   tmpl.UpdatedAt,
		})
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Notification templates retrieved successfully",
		Data:    templateList,
	})
}

// CreateNotificationTemplate creates a new notification template
func CreateNotificationTemplate(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var req requests.CreateNotificationTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	// Check if template code already exists for this tenant
	var existingTemplate models.NotificationTemplate
	if err := config.DB.Where("tenant_id = ? AND code = ?", tenantID, req.Code).First(&existingTemplate).Error; err == nil {
		c.JSON(http.StatusConflict, responses.ErrorResponse{
			Status:  "error",
			Message: "Template with this code already exists",
			Error:   "Duplicate template code",
		})
		return
	}
	
	// Convert variables to JSON
	variablesJSON, _ := json.Marshal(req.Variables)
	
	template := models.NotificationTemplate{
		TenantID:    tenantID,
		Code:        strings.ToUpper(req.Code),
		Name:        req.Name,
		Description: req.Description,
		Channel:     models.NotificationChannel(req.Channel),
		Subject:     req.Subject,
		Body:        req.Body,
		HTMLBody:    req.HTMLBody,
		Variables:   string(variablesJSON),
		IsActive:    true,
		Language:    req.Language,
	}
	
	// Set default language if not provided
	if template.Language == "" {
		template.Language = "id"
	}
	
	if err := config.DB.Create(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to create notification template",
			Error:   err.Error(),
		})
		return
	}
	
	var variables []string
	json.Unmarshal([]byte(template.Variables), &variables)
	
	c.JSON(http.StatusCreated, responses.SuccessResponse{
		Status:  "success",
		Message: "Notification template created successfully",
		Data: responses.NotificationTemplateResponse{
			ID:          template.ID,
			TenantID:    template.TenantID,
			Code:        template.Code,
			Name:        template.Name,
			Description: template.Description,
			Channel:     string(template.Channel),
			Subject:     template.Subject,
			Body:        template.Body,
			HTMLBody:    template.HTMLBody,
			Variables:   variables,
			IsActive:    template.IsActive,
			Language:    template.Language,
			CreatedAt:   template.CreatedAt,
			UpdatedAt:   template.UpdatedAt,
		},
	})
}

// UpdateNotificationTemplate updates an existing notification template
func UpdateNotificationTemplate(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	templateID := c.Param("id")
	
	var template models.NotificationTemplate
	if err := config.DB.Where("id = ? AND tenant_id = ?", templateID, tenantID).First(&template).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Notification template not found",
			Error:   err.Error(),
		})
		return
	}
	
	var req requests.UpdateNotificationTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	// Update fields
	if req.Name != "" {
		template.Name = req.Name
	}
	if req.Description != "" {
		template.Description = req.Description
	}
	if req.Subject != "" {
		template.Subject = req.Subject
	}
	if req.Body != "" {
		template.Body = req.Body
	}
	if req.HTMLBody != "" {
		template.HTMLBody = req.HTMLBody
	}
	if req.Variables != nil {
		variablesJSON, _ := json.Marshal(req.Variables)
		template.Variables = string(variablesJSON)
	}
	if req.IsActive != nil {
		template.IsActive = *req.IsActive
	}
	if req.Language != "" {
		template.Language = req.Language
	}
	
	if err := config.DB.Save(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to update notification template",
			Error:   err.Error(),
		})
		return
	}
	
	var variables []string
	json.Unmarshal([]byte(template.Variables), &variables)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Notification template updated successfully",
		Data: responses.NotificationTemplateResponse{
			ID:          template.ID,
			TenantID:    template.TenantID,
			Code:        template.Code,
			Name:        template.Name,
			Description: template.Description,
			Channel:     string(template.Channel),
			Subject:     template.Subject,
			Body:        template.Body,
			HTMLBody:    template.HTMLBody,
			Variables:   variables,
			IsActive:    template.IsActive,
			Language:    template.Language,
			CreatedAt:   template.CreatedAt,
			UpdatedAt:   template.UpdatedAt,
		},
	})
}

// DeleteNotificationTemplate deletes (soft delete) a notification template
func DeleteNotificationTemplate(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	templateID := c.Param("id")
	
	var template models.NotificationTemplate
	if err := config.DB.Where("id = ? AND tenant_id = ?", templateID, tenantID).First(&template).Error; err != nil {
		c.JSON(http.StatusNotFound, responses.ErrorResponse{
			Status:  "error",
			Message: "Notification template not found",
			Error:   err.Error(),
		})
		return
	}
	
	// Soft delete
	if err := config.DB.Delete(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to delete notification template",
			Error:   err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Notification template deleted successfully",
		Data:    nil,
	})
}

// SendNotification sends a notification to a recipient
func SendNotification(c *gin.Context) {
	tenantID := c.MustGet("tenant_id").(uuid.UUID)
	
	var req requests.SendNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}
	
	var template *models.NotificationTemplate
	var subject, body string
	
	// Get template if template code is provided
	if req.TemplateCode != "" {
		var tmpl models.NotificationTemplate
		if err := config.DB.Where("tenant_id = ? AND code = ? AND is_active = ?", tenantID, req.TemplateCode, true).First(&tmpl).Error; err != nil {
			c.JSON(http.StatusNotFound, responses.ErrorResponse{
				Status:  "error",
				Message: "Notification template not found or inactive",
				Error:   err.Error(),
			})
			return
		}
		template = &tmpl
		subject = template.Subject
		body = template.Body
		
		// Replace variables in template
		if req.Variables != nil {
			for key, value := range req.Variables {
				placeholder := fmt.Sprintf("{{%s}}", key)
				subject = strings.ReplaceAll(subject, placeholder, fmt.Sprint(value))
				body = strings.ReplaceAll(body, placeholder, fmt.Sprint(value))
			}
		}
	} else {
		// Use custom subject and body
		subject = req.CustomSubject
		body = req.CustomBody
	}
	
	// Get recipient information
	var recipientName, destination string
	
	if req.RecipientType == "USER" {
		var user models.User
		if err := config.DB.Where("id = ? AND tenant_id = ?", req.RecipientID, tenantID).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, responses.ErrorResponse{
				Status:  "error",
				Message: "Recipient user not found",
				Error:   err.Error(),
			})
			return
		}
		recipientName = user.Name
		if req.Channel == "EMAIL" {
			destination = user.Email
		}
	} else if req.RecipientType == "CUSTOMER" {
		var customer models.Customer
		if err := config.DB.Where("id = ? AND tenant_id = ?", req.RecipientID, tenantID).First(&customer).Error; err != nil {
			c.JSON(http.StatusNotFound, responses.ErrorResponse{
				Status:  "error",
				Message: "Recipient customer not found",
				Error:   err.Error(),
			})
			return
		}
		recipientName = customer.Name
		if req.Channel == "EMAIL" {
			destination = customer.Email
		} else if req.Channel == "SMS" {
			destination = customer.Phone
		}
	}
	
	if destination == "" {
		c.JSON(http.StatusBadRequest, responses.ErrorResponse{
			Status:  "error",
			Message: "Recipient does not have contact information for this channel",
			Error:   fmt.Sprintf("No %s information for recipient", req.Channel),
		})
		return
	}
	
	// Create notification log
	notificationLog := models.NotificationLog{
		TenantID:      tenantID,
		RecipientType: req.RecipientType,
		RecipientID:   req.RecipientID,
		RecipientName: recipientName,
		Channel:       models.NotificationChannel(req.Channel),
		Destination:   destination,
		Subject:       subject,
		Body:          body,
		Status:        "PENDING",
	}
	
	if template != nil {
		notificationLog.TemplateID = &template.ID
	}
	
	if err := config.DB.Create(&notificationLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, responses.ErrorResponse{
			Status:  "error",
			Message: "Failed to create notification log",
			Error:   err.Error(),
		})
		return
	}
	
	// TODO: Actual sending logic (email, SMS, etc.) would go here
	// For now, we'll just mark it as sent
	now := time.Now()
	notificationLog.Status = "SENT"
	notificationLog.SentAt = &now
	config.DB.Save(&notificationLog)
	
	c.JSON(http.StatusOK, responses.SuccessResponse{
		Status:  "success",
		Message: "Notification sent successfully (queued for delivery)",
		Data: responses.NotificationLogResponse{
			ID:            notificationLog.ID,
			TenantID:      notificationLog.TenantID,
			TemplateID:    notificationLog.TemplateID,
			RecipientType: notificationLog.RecipientType,
			RecipientID:   notificationLog.RecipientID,
			RecipientName: notificationLog.RecipientName,
			Channel:       string(notificationLog.Channel),
			Destination:   notificationLog.Destination,
			Subject:       notificationLog.Subject,
			Status:        notificationLog.Status,
			SentAt:        notificationLog.SentAt,
			DeliveredAt:   notificationLog.DeliveredAt,
			FailedAt:      notificationLog.FailedAt,
			ErrorMessage:  notificationLog.ErrorMessage,
			RetryCount:    notificationLog.RetryCount,
			CreatedAt:     notificationLog.CreatedAt,
		},
	})
}
