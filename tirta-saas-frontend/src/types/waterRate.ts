export interface WaterRate {
  id: string;
  amount: number;
  effective_date: string;
  active: boolean;
  subscription_id: string;
  subscription?: {
    id: string;
    name: string;
    description?: string;
    registration_fee: number;
    monthly_fee: number;
    maintenance_fee: number;
    late_fee_per_day: number;
    max_late_fee: number;
  };
  category_id?: string;
  category?: {
    id: string;
    name: string;
    code: string;
  };
  description?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWaterRateDto {
  amount: number;
  effective_date: string;
  subscription_id: string;
  category_id?: string;
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
  subscription_id?: string;
  category_id?: string;
  active?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface RateHistory {
  id: string;
  subscriptionName: string;
  amount: number;
  effective_date: string;
  active: boolean;
  created_at: string;
}
