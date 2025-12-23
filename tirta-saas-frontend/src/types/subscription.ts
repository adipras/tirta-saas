export interface SubscriptionType {
  id: string;
  name: string;
  description?: string;
  registration_fee: number;
  monthly_fee: number;
  maintenance_fee: number;
  late_fee_per_day: number;
  max_late_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionTypeDto {
  name: string;
  description?: string;
  registration_fee: number;
  monthly_fee: number;
  maintenance_fee: number;
  late_fee_per_day: number;
  max_late_fee: number;
}

export interface UpdateSubscriptionTypeDto extends Partial<CreateSubscriptionTypeDto> {
  is_active?: boolean;
}

export interface SubscriptionTypeFormData {
  name: string;
  description: string;
  registration_fee: string;
  monthly_fee: string;
  maintenance_fee: string;
  late_fee_per_day: string;
  max_late_fee: string;
}

export interface SubscriptionTypeStats {
  totalTypes: number;
  activeTypes: number;
  totalCustomers: number;
  totalMonthlyRevenue: number;
}
