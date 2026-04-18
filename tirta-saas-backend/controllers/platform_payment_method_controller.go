package controllers

import (
	"fmt"
	"net/http"

	"github.com/adipras/tirta-saas-backend/config"
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/adipras/tirta-saas-backend/requests"
	"github.com/adipras/tirta-saas-backend/responses"
	"github.com/adipras/tirta-saas-backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func unsetOtherPlatformBankAccountPrimaries(tx *gorm.DB, excludeID *uuid.UUID) error {
	query := tx.Model(&models.PlatformBankAccount{}).Where("1 = 1")
	if excludeID != nil {
		query = query.Where("id <> ?", *excludeID)
	}

	return query.Update("is_primary", false).Error
}

func unsetOtherPlatformQRCodePrimaries(tx *gorm.DB, excludeID *uuid.UUID) error {
	query := tx.Model(&models.PlatformQRCode{}).Where("1 = 1")
	if excludeID != nil {
		query = query.Where("id <> ?", *excludeID)
	}

	return query.Update("is_primary", false).Error
}

// GetPlatformBankAccounts lists all platform bank accounts
func GetPlatformBankAccounts(c *gin.Context) {
	var accounts []models.PlatformBankAccount
	if err := config.DB.Order("is_primary DESC, bank_name ASC").Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch platform bank accounts"})
		return
	}

	result := make([]responses.BankAccountResponse, len(accounts))
	for i, a := range accounts {
		result[i] = responses.BankAccountResponse{
			ID:            a.ID,
			BankName:      a.BankName,
			AccountNumber: a.AccountNumber,
			AccountName:   a.AccountName,
			BankBranch:    a.BankBranch,
			SwiftCode:     a.SwiftCode,
			IsPrimary:     a.IsPrimary,
			IsActive:      a.IsActive,
			Notes:         a.Notes,
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreatePlatformBankAccount creates a new platform bank account
func CreatePlatformBankAccount(c *gin.Context) {
	var req requests.CreateBankAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account := models.PlatformBankAccount{
		BankName:      req.BankName,
		AccountNumber: req.AccountNumber,
		AccountName:   req.AccountName,
		BankBranch:    req.BankBranch,
		SwiftCode:     req.SwiftCode,
		Notes:         req.Notes,
		IsPrimary:     req.IsPrimary,
		IsActive:      true,
	}

	if err := config.DB.Transaction(func(tx *gorm.DB) error {
		if req.IsPrimary {
			if err := unsetOtherPlatformBankAccountPrimaries(tx, nil); err != nil {
				return err
			}
		}

		return tx.Create(&account).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create platform bank account"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Platform bank account created successfully",
		"data": responses.BankAccountResponse{
			ID: account.ID, BankName: account.BankName, AccountNumber: account.AccountNumber,
			AccountName: account.AccountName, BankBranch: account.BankBranch, SwiftCode: account.SwiftCode,
			IsPrimary: account.IsPrimary, IsActive: account.IsActive, Notes: account.Notes,
		},
	})
}

// UpdatePlatformBankAccount updates a platform bank account
func UpdatePlatformBankAccount(c *gin.Context) {
	parsedID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bank account ID"})
		return
	}

	var req requests.UpdateBankAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var account models.PlatformBankAccount
	if err := config.DB.First(&account, parsedID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platform bank account not found"})
		return
	}

	account.BankName = req.BankName
	account.AccountNumber = req.AccountNumber
	account.AccountName = req.AccountName
	account.BankBranch = req.BankBranch
	account.SwiftCode = req.SwiftCode
	account.Notes = req.Notes
	if req.IsActive != nil {
		account.IsActive = *req.IsActive
	}
	account.IsPrimary = req.IsPrimary

	if err := config.DB.Transaction(func(tx *gorm.DB) error {
		if req.IsPrimary {
			if err := unsetOtherPlatformBankAccountPrimaries(tx, &parsedID); err != nil {
				return err
			}
		}

		return tx.Save(&account).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update platform bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Platform bank account updated successfully",
		"data": responses.BankAccountResponse{
			ID: account.ID, BankName: account.BankName, AccountNumber: account.AccountNumber,
			AccountName: account.AccountName, BankBranch: account.BankBranch, SwiftCode: account.SwiftCode,
			IsPrimary: account.IsPrimary, IsActive: account.IsActive, Notes: account.Notes,
		},
	})
}

// SetPrimaryPlatformBankAccount sets a platform bank account as primary
func SetPrimaryPlatformBankAccount(c *gin.Context) {
	parsedID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bank account ID"})
		return
	}

	var account models.PlatformBankAccount
	if err := config.DB.First(&account, parsedID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platform bank account not found"})
		return
	}

	if err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := unsetOtherPlatformBankAccountPrimaries(tx, &parsedID); err != nil {
			return err
		}

		account.IsPrimary = true
		return tx.Save(&account).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set primary platform bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Primary platform bank account set successfully"})
}

// DeletePlatformBankAccount deletes a platform bank account
func DeletePlatformBankAccount(c *gin.Context) {
	parsedID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bank account ID"})
		return
	}

	var account models.PlatformBankAccount
	if err := config.DB.First(&account, parsedID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platform bank account not found"})
		return
	}

	if err := config.DB.Delete(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete platform bank account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Platform bank account deleted successfully"})
}

// GetPlatformQRCodes lists all platform QR codes
func GetPlatformQRCodes(c *gin.Context) {
	var qrCodes []models.PlatformQRCode
	if err := config.DB.Order("is_primary DESC, created_at ASC").Find(&qrCodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch platform QR codes"})
		return
	}

	result := make([]responses.QRCodeResponse, len(qrCodes))
	for i, qr := range qrCodes {
		result[i] = responses.QRCodeResponse{
			ID: qr.ID, Type: qr.Type, ImageURL: qr.ImageURL,
			IsPrimary: qr.IsPrimary, IsActive: qr.IsActive, Notes: qr.Notes,
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

// CreatePlatformQRCode creates a new platform QR code with optional image upload
func CreatePlatformQRCode(c *gin.Context) {
	var req requests.CreateQRCodeRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imageURL := ""
	file, fileErr := c.FormFile("image")
	if fileErr == nil {
		uploadConfig := utils.DefaultImageUploadConfig()
		uploadConfig.MaxSize = 2 * 1024 * 1024
		uploadConfig.UploadDir = "uploads/platform/qr"
		filePath, uploadErr := utils.SaveUploadedFile(file, uploadConfig)
		if uploadErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image upload failed: " + uploadErr.Error()})
			return
		}
		imageURL = filePath
	}

	qrCode := models.PlatformQRCode{
		Type: req.Type, ImageURL: imageURL,
		IsPrimary: req.IsPrimary, IsActive: req.IsActive, Notes: req.Notes,
	}

	if err := config.DB.Transaction(func(tx *gorm.DB) error {
		if req.IsPrimary {
			if err := unsetOtherPlatformQRCodePrimaries(tx, nil); err != nil {
				return err
			}
		}

		return tx.Create(&qrCode).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create platform QR code"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Platform QR code created successfully",
		"data": responses.QRCodeResponse{
			ID: qrCode.ID, Type: qrCode.Type, ImageURL: qrCode.ImageURL,
			IsPrimary: qrCode.IsPrimary, IsActive: qrCode.IsActive, Notes: qrCode.Notes,
		},
	})
}

// UpdatePlatformQRCode updates a platform QR code
func UpdatePlatformQRCode(c *gin.Context) {
	parsedID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid QR code ID"})
		return
	}

	var qrCode models.PlatformQRCode
	if err := config.DB.First(&qrCode, parsedID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platform QR code not found"})
		return
	}

	var req requests.UpdateQRCodeRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	file, fileErr := c.FormFile("image")
	if fileErr == nil {
		uploadConfig := utils.DefaultImageUploadConfig()
		uploadConfig.MaxSize = 2 * 1024 * 1024
		uploadConfig.UploadDir = fmt.Sprintf("uploads/platform/qr")
		filePath, uploadErr := utils.SaveUploadedFile(file, uploadConfig)
		if uploadErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image upload failed: " + uploadErr.Error()})
			return
		}
		utils.DeleteFile(qrCode.ImageURL)
		qrCode.ImageURL = filePath
	}

	qrCode.Type = req.Type
	qrCode.IsPrimary = req.IsPrimary
	qrCode.Notes = req.Notes
	if req.IsActive != nil {
		qrCode.IsActive = *req.IsActive
	}

	if err := config.DB.Transaction(func(tx *gorm.DB) error {
		if req.IsPrimary {
			if err := unsetOtherPlatformQRCodePrimaries(tx, &parsedID); err != nil {
				return err
			}
		}

		return tx.Save(&qrCode).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update platform QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Platform QR code updated successfully",
		"data": responses.QRCodeResponse{
			ID: qrCode.ID, Type: qrCode.Type, ImageURL: qrCode.ImageURL,
			IsPrimary: qrCode.IsPrimary, IsActive: qrCode.IsActive, Notes: qrCode.Notes,
		},
	})
}

// SetPrimaryPlatformQRCode sets a platform QR code as primary
func SetPrimaryPlatformQRCode(c *gin.Context) {
	parsedID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid QR code ID"})
		return
	}

	var qrCode models.PlatformQRCode
	if err := config.DB.First(&qrCode, parsedID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platform QR code not found"})
		return
	}

	if err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := unsetOtherPlatformQRCodePrimaries(tx, &parsedID); err != nil {
			return err
		}

		qrCode.IsPrimary = true
		return tx.Save(&qrCode).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set primary platform QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Primary platform QR code set successfully"})
}

// DeletePlatformQRCode deletes a platform QR code and its image file
func DeletePlatformQRCode(c *gin.Context) {
	parsedID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid QR code ID"})
		return
	}

	var qrCode models.PlatformQRCode
	if err := config.DB.First(&qrCode, parsedID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platform QR code not found"})
		return
	}

	utils.DeleteFile(qrCode.ImageURL)

	if err := config.DB.Delete(&qrCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete platform QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Platform QR code deleted successfully"})
}
