export interface Customer {
  id: string;
  meter_number: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription_id: string;
  subscription: SubscriptionType;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionType {
  id: string;
  name: string;
  description?: string;
  registration_fee: number;
  monthly_fee: number;
  maintenance_fee: number;
  late_fee_per_day: number;
  max_late_fee: number;
  created_at: string;
  updated_at?: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'suspended';

export interface CreateCustomerDto {
  meter_number: string;
  name: string;
  email: string;
  password: string;
  subscription_id: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerDto {
  name: string;
  subscription_id: string;
  phone?: string;
  address?: string;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  subscriptionTypeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  hasOutstandingBalance?: boolean;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  suspendedCustomers: number;
  customersWithOutstandingBalance: number;
  totalOutstandingBalance: number;
}