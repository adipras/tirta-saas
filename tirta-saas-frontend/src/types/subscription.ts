export interface SubscriptionType {
  id: string;
  name: string;
  description?: string;
  registrationFee: number;
  monthlyFee: number;
  maintenanceFee: number;
  lateFeePercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionTypeDto {
  name: string;
  description?: string;
  registrationFee: number;
  monthlyFee: number;
  maintenanceFee: number;
  lateFeePercentage: number;
}

export interface UpdateSubscriptionTypeDto extends Partial<CreateSubscriptionTypeDto> {
  isActive?: boolean;
}

export interface SubscriptionTypeFormData {
  name: string;
  description: string;
  registrationFee: string;
  monthlyFee: string;
  maintenanceFee: string;
  lateFeePercentage: string;
}

export interface SubscriptionTypeStats {
  totalTypes: number;
  activeTypes: number;
  totalCustomers: number;
  totalMonthlyRevenue: number;
}
