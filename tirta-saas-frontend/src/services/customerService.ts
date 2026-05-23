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
import { asArray, asRecord, getNumber, unwrapResponseData } from '../utils/dataTransform';

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
  async getPelanggan(
    page: number = 1,
    limit: number = 10,
    filters?: CustomerFilters
  ): Promise<PaginatedResponse<Customer>> {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get(
      API_ENDPOINTS.CUSTOMERS.LIST,
      { params }
    );
    const data = asRecord(unwrapResponseData(response));

    return {
      data: asArray<Customer>(data.customers),
      pagination: {
        total: getNumber(data.total),
        page,
        limit,
        totalPages: Math.ceil(getNumber(data.total) / limit),
        currentPage: page,
      }
    };
  }

  async getCustomerById(id: string): Promise<Customer> {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.DETAIL(id));
    return unwrapResponseData(response) as Customer;
  }

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    const response = await apiClient.post(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return unwrapResponseData(response) as Customer;
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

  async searchPelanggan(query: string): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>(
      API_ENDPOINTS.CUSTOMERS.SEARCH,
      { params: { q: query } }
    );
    return response;
  }

  async exportPelanggan(filters?: CustomerFilters): Promise<Blob> {
    return apiClient.get<Blob>(
      API_ENDPOINTS.CUSTOMERS.EXPORT,
      {
        params: filters,
        responseType: 'blob',
      }
    );
  }

  async bulkUpdateStatus(
    customerIds: string[],
    isActive: boolean
  ): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CUSTOMERS.BULK_UPDATE_STATUS, {
      customerIds,
      isActive,
    });
  }

  async getSubscriptionTypes(): Promise<SubscriptionType[]> {
    const response = await apiClient.get(
      API_ENDPOINTS.SUBSCRIPTION_TYPES.LIST
    );
    return asArray<SubscriptionType>(unwrapResponseData(response));
  }

  async bulkImportPelanggan(file: File): Promise<{
    totalRecords: number;
    successCount: number;
    failureCount: number;
    skippedCount: number;
    errors: string[];
    durationMs: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      API_ENDPOINTS.CUSTOMERS.BULK_IMPORT,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const data = asRecord(unwrapResponseData(response));
    return {
      totalRecords: getNumber(data.total_records ?? data.totalRecords),
      successCount: getNumber(data.success_count ?? data.successCount),
      failureCount: getNumber(data.failure_count ?? data.failureCount),
      skippedCount: getNumber(data.skipped_count ?? data.skippedCount),
      errors: asArray<string>(data.errors),
      durationMs: getNumber(data.duration_ms ?? data.durationMs),
    };
  }

  async exportPelangganCSV(): Promise<Blob> {
    return apiClient.get<Blob>(
      API_ENDPOINTS.CUSTOMERS.EXPORT,
      { responseType: 'blob' }
    );
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