import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type { 
  WaterUsage,
  CreateWaterUsageDto,
  UpdateWaterUsageDto,
  WaterUsageFilters,
  UsageHistory,
  UsageTrend,
  BulkImportRow
} from '../types/usage';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UsageService {
  async getWaterUsages(
    page: number = 1,
    limit: number = 10,
    filters?: WaterUsageFilters
  ): Promise<PaginatedResponse<WaterUsage>> {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      limit,
    };

    if (filters) {
      if (filters.customerId) params.customer_id = filters.customerId;
      if (filters.usageMonth) params.usage_month = filters.usageMonth;
      if (filters.startMonth) params.start_month = filters.startMonth;
      if (filters.endMonth) params.end_month = filters.endMonth;
      if (filters.isAnomaly !== undefined) params.is_anomaly = filters.isAnomaly;
    }

    const response = await apiClient.get(API_ENDPOINTS.WATER_USAGE.LIST, {
      params,
    });
    return response.data;
  }

  async getWaterUsage(id: string): Promise<WaterUsage> {
    const response = await apiClient.get(
      API_ENDPOINTS.WATER_USAGE.DETAIL(id)
    );
    return response.data;
  }

  async getCustomerUsageHistoryById(customerId: string): Promise<UsageHistory[]> {
    const response = await apiClient.get(
      API_ENDPOINTS.WATER_USAGE.BY_CUSTOMER(customerId)
    );
    
    // Transform to UsageHistory format
    return response.data.map((usage: WaterUsage) => ({
      month: usage.usageMonth,
      meterStart: usage.meterStart,
      meterEnd: usage.meterEnd,
      usageM3: usage.usageM3,
      amount: usage.amountCalculated,
    }));
  }

  async getUsageTrends(
    customerId?: string,
    months: number = 6
  ): Promise<UsageTrend[]> {
    const filters: WaterUsageFilters = {};
    if (customerId) {
      filters.customerId = customerId;
    }

    const response = await this.getWaterUsages(1, months, filters);
    
    return response.data.map((usage: WaterUsage) => ({
      month: usage.usageMonth,
      usage: usage.usageM3,
    })).reverse();
  }

  async createWaterUsage(data: CreateWaterUsageDto): Promise<WaterUsage> {
    const response = await apiClient.post(
      API_ENDPOINTS.WATER_USAGE.CREATE,
      data
    );
    return response.data;
  }

  async updateWaterUsage(
    id: string,
    data: UpdateWaterUsageDto
  ): Promise<WaterUsage> {
    const response = await apiClient.put(
      API_ENDPOINTS.WATER_USAGE.UPDATE(id),
      data
    );
    return response.data;
  }

  async deleteWaterUsage(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.WATER_USAGE.DELETE(id));
  }

  async bulkImport(rows: BulkImportRow[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const response = await apiClient.post(
      API_ENDPOINTS.WATER_USAGE.BULK_IMPORT,
      { data: rows }
    );
    return response.data;
  }

  // Legacy support
  getUsageList() {
    return this.getWaterUsages();
  }

  // Customer-specific usage methods
  async getCustomerUsageHistory(period: '6months' | '12months' | 'all' = '6months'): Promise<WaterUsage[]> {
    const params: Record<string, string> = { period };
    const response = await apiClient.get('/customer/usage/history', { params });
    return response.data;
  }

  async getCurrentUsage(): Promise<WaterUsage> {
    const response = await apiClient.get('/customer/usage/current');
    return response.data;
  }

  async getUsageStats(): Promise<{
    currentMonth: number;
    lastMonth: number;
    average: number;
    total: number;
    trend: string;
  }> {
    const response = await apiClient.get('/customer/usage/stats');
    return response.data;
  }
}

export const usageService = new UsageService();
export default usageService;
