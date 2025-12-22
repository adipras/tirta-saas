export interface WaterRate {
  id: string;
  amount: number;
  effectiveDate: string;
  active: boolean;
  subscriptionId: string;
  subscription?: {
    id: string;
    name: string;
  };
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    code: string;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaterRateDto {
  amount: number;
  effectiveDate: string;
  subscriptionId: string;
  categoryId?: string;
  description?: string;
}

export interface UpdateWaterRateDto extends Partial<CreateWaterRateDto> {
  active?: boolean;
}

export interface WaterRateFormData {
  amount: string;
  effectiveDate: string;
  subscriptionId: string;
  categoryId: string;
  description: string;
}

export interface WaterRateFilters {
  subscriptionId?: string;
  categoryId?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface RateHistory {
  id: string;
  subscriptionName: string;
  amount: number;
  effectiveDate: string;
  active: boolean;
  createdAt: string;
}
