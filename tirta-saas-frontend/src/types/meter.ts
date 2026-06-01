import type { SubscriptionType } from './customer';

export interface Meter {
  id: string;
  tenant_id: string;
  customer_id: string;
  meter_number: string;
  subscription_type_id?: string;
  subscription_type?: SubscriptionType;
  brand?: string;
  model?: string;
  install_date: string;
  last_calib_date?: string;
  next_calib_date?: string;
  initial_reading: number;
  status: 'active' | 'inactive' | 'broken' | 'replaced';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMeterDto {
  meter_number: string;
  subscription_type_id: string;
  brand?: string;
  model?: string;
  install_date: string;
  initial_reading?: number;
  notes?: string;
}

export interface UpdateMeterDto {
  meter_number?: string;
  subscription_type_id?: string;
  brand?: string;
  model?: string;
  install_date?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'broken' | 'replaced';
}
