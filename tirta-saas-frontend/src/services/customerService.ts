import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type { 
  Customer, 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerFilters,
  CustomerStats,
  SubscriptionType 
} from '../types/customer';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    currentPage: number;
  };
}

class CustomerService {
  async getCustomers(
    page: number = 1,
    limit: number = 10,
    filters?: CustomerFilters
  ): Promise<PaginatedResponse<Customer>> {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get<PaginatedResponse<Customer>>(
      API_ENDPOINTS.CUSTOMERS.LIST,
      { params }
    );
    return response;
  }

  async getCustomerById(id: string): Promise<Customer> {
    const response = await apiClient.get<Customer>(API_ENDPOINTS.CUSTOMERS.DETAIL(id));
    return response;
  }

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    const response = await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return response;
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
    const response = await apiClient.put<Customer>(
      API_ENDPOINTS.CUSTOMERS.UPDATE(id),
      data
    );
    return response;
  }

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id));
  }

  async activateCustomer(id: string): Promise<Customer> {
    const response = await apiClient.post<Customer>(
      API_ENDPOINTS.CUSTOMERS.ACTIVATE(id)
    );
    return response;
  }

  async deactivateCustomer(id: string): Promise<Customer> {
    const response = await apiClient.post<Customer>(
      API_ENDPOINTS.CUSTOMERS.DEACTIVATE(id)
    );
    return response;
  }

  async suspendCustomer(id: string, reason?: string): Promise<Customer> {
    const response = await apiClient.post<Customer>(
      API_ENDPOINTS.CUSTOMERS.SUSPEND(id),
      { reason }
    );
    return response;
  }

  async getCustomerStats(): Promise<CustomerStats> {
    const response = await apiClient.get<CustomerStats>(
      API_ENDPOINTS.CUSTOMERS.STATS
    );
    return response;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>(
      API_ENDPOINTS.CUSTOMERS.SEARCH,
      { params: { q: query } }
    );
    return response;
  }

  async exportCustomers(filters?: CustomerFilters): Promise<Blob> {
    const response = await apiClient.get(
      API_ENDPOINTS.CUSTOMERS.EXPORT,
      {
        params: filters,
        responseType: 'blob',
      }
    );
    return response;
  }

  async bulkUpdateStatus(
    customerIds: string[],
    status: Customer['status']
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CUSTOMERS.BULK_UPDATE_STATUS, {
      customerIds,
      status,
    });
  }

  async getSubscriptionTypes(): Promise<SubscriptionType[]> {
    const response = await apiClient.get<SubscriptionType[]>(
      API_ENDPOINTS.SUBSCRIPTION_TYPES.LIST
    );
    return response;
  }

  async assignMeter(customerId: string, meterNumber: string): Promise<Customer> {
    const response = await apiClient.post<Customer>(
      API_ENDPOINTS.CUSTOMERS.ASSIGN_METER(customerId),
      { meterNumber }
    );
    return response;
  }
}

const customerServiceInstance = new CustomerService();
export default customerServiceInstance;
export const customerService = customerServiceInstance;