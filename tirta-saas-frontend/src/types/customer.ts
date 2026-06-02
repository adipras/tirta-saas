export interface Meter {
  id: string;
  meter_number: string;
  status: string;
  subscription_type_id?: string;
  subscription_type?: SubscriptionType;
  install_date: string;
  initial_reading: number;
  brand?: string;
  model?: string;
  notes?: string;
  latest_usage_month?: string;
  latest_meter_end?: number;
  latest_usage_m3?: number;
}

export interface MeterInput {
  meter_number: string;
  subscription_type_id: string;
  install_date: string;
  initial_reading?: number;
  brand?: string;
  model?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription_id: string;
  subscription: SubscriptionType;
  service_area_id?: string;
  service_area_name?: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  meters?: Meter[];
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

export interface CreateCustomerDto {
  name: string;
  email?: string;
  password: string;
  phone?: string;
  address?: string;
  service_area_id?: string;
  reading_route_id?: string;
  meters: MeterInput[];
}

export interface CreateCustomerResponse {
  customer: Customer;
  meters: Meter[];
  registration_invoices: Invoice[];
}

export interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  type: string;
  payment_status: string;
}

export interface UpdateCustomerDto {
  name: string;
  phone?: string;
  address?: string;
  service_area_id?: string;
  reading_route_id?: string;
}

export interface AddMeterDto {
  meter_number: string;
  subscription_type_id: string;
  install_date: string;
  initial_reading?: number;
  brand?: string;
  model?: string;
  notes?: string;
}

export interface MeterStartResolution {
  value: number;
  source: string;
  description: string;
  month: string;
}

export interface CustomerFilters {
  isActive?: boolean;
  subscriptionTypeId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  hasOutstandingBalance?: boolean;
}

export interface CustomerStats {
  totalPelanggan: number;
  activePelanggan: number;
  inactivePelanggan: number;
  suspendedPelanggan: number;
  customersWithOutstandingBalance: number;
  totalOutstandingBalance: number;
}