export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  meterNumber?: string;
  subscriptionType: SubscriptionType;
  status: CustomerStatus;
  registrationDate: string;
  lastPaymentDate?: string;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionType {
  id: string;
  name: string;
  registrationFee: number;
  monthlyFee: number;
  maintenanceFee: number;
  lateFeePercentage: number;
  description?: string;
  isActive: boolean;
}

export type CustomerStatus = 'active' | 'inactive' | 'suspended';

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  meterNumber?: string;
  subscriptionTypeId: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  status?: CustomerStatus;
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