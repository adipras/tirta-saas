package responses

import (
	"github.com/adipras/tirta-saas-backend/models"
	"github.com/google/uuid"
)

type ServiceAreaResponse struct {
	ID            uuid.UUID              `json:"id"`
	Code          string                 `json:"code"`
	Name          string                 `json:"name"`
	Type          string                 `json:"type"`
	Description   string                 `json:"description"`
	Population    int                    `json:"population"`
	CustomerCount int                    `json:"customer_count"`
	CoverageArea  string                 `json:"coverage_area"`
	IsActive      bool                   `json:"is_active"`
	Parent        *ServiceAreaResponse   `json:"parent,omitempty"`
	Children      []ServiceAreaResponse  `json:"children,omitempty"`
}

func ToServiceAreaResponse(area *models.ServiceArea) ServiceAreaResponse {
	response := ServiceAreaResponse{
		ID:            area.ID,
		Code:          area.Code,
		Name:          area.Name,
		Type:          area.Type,
		Description:   area.Description,
		Population:    area.Population,
		CustomerCount: area.CustomerCount,
		CoverageArea:  area.CoverageArea,
		IsActive:      area.IsActive,
	}

	if area.Parent != nil {
		parent := ToServiceAreaResponse(area.Parent)
		response.Parent = &parent
	}

	if len(area.Children) > 0 {
		response.Children = make([]ServiceAreaResponse, len(area.Children))
		for i, child := range area.Children {
			response.Children[i] = ToServiceAreaResponse(&child)
		}
	}

	return response
}
