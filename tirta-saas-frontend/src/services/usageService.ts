import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type { 
  WaterPemakaian,
  CreateWaterPemakaianDto,
  UpdateWaterPemakaianDto,
  WaterPemakaianFilters,
  PemakaianHistory,
  PemakaianTrend,
  BulkImportRow
} from '../types/usage';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class PemakaianService {
  async getWaterPemakaians(
    page: number = 1,
    limit: number = 10,
    filters?: WaterPemakaianFilters
  ): Promise<PaginatedResponse<WaterPemakaian>> {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      page_size: limit,
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
    // response is the full backend body: { status, message, data: [...], meta: {...} }
    const raw = response;

    // Support both old shape ({ usage_records: [...] , total }) and new PaginatedResponse { status, message, data: [...], meta }
    let records: any[] = [];
    let total = 0;
    let resolvedPage = page;
    let resolvedLimit = limit;

    if (Array.isArray(raw)) {
      records = raw;
      total = raw.length;
    } else if (raw.usage_records && Array.isArray(raw.usage_records)) {
      // legacy format
      records = raw.usage_records;
      total = raw.total || records.length;
    } else if (raw.data && Array.isArray(raw.data)) {
      // standard paginated format: { status, message, data: [...], meta: {...} }
      records = raw.data;
      if (raw.meta) {
        total = raw.meta.total_items ?? raw.meta.total ?? records.length;
        resolvedPage = raw.meta.current_page ?? resolvedPage;
        resolvedLimit = raw.meta.page_size ?? resolvedLimit;
      } else {
        total = records.length;
      }
    } else {
      records = [];
      total = 0;
    }

    const mapped: WaterPemakaian[] = records.map((u: any) => ({
      id: u.id,
      customerId: u.customer_id ?? u.customerId,
      customer: u.customer ? {
        id: u.customer.id,
        name: u.customer.name ?? '',
        customerId: u.customer.id,
        meterNumber: u.customer.meter_number ?? u.customer.meterNumber ?? '',
        address: u.customer.address ?? '',
      } : undefined,
      customerName: u.customer?.name ?? u.customerName ?? '',
      meterNumber: u.customer?.meter_number ?? u.meterNumber ?? '',
      usageMonth: u.usage_month ?? u.usageMonth,
      meterStart: u.meter_start ?? u.meterStart ?? 0,
      meterEnd: u.meter_end ?? u.meterEnd ?? 0,
      usageM3: u.usage_m3 ?? u.usageM3 ?? 0,
      rateId: u.rate_id ?? u.rateId ?? '',
      ratePerM3: u.rate_per_m3 ?? u.ratePerM3 ?? 0,
      amountCalculated: u.amount_calculated ?? u.amountCalculated ?? 0,
      isAnomaly: u.is_anomaly ?? u.isAnomaly ?? false,
      notes: u.notes ?? '',
      createdAt: u.created_at ?? u.createdAt ?? '',
      updatedAt: u.updated_at ?? u.updatedAt ?? '',
    }));

    return {
      data: mapped,
      total,
      totalPages: Math.ceil(total / resolvedLimit) || 1,
      page: resolvedPage,
      limit: resolvedLimit,
    };
  }

  async getWaterPemakaian(id: string): Promise<WaterPemakaian> {
    const response = await apiClient.get(
      API_ENDPOINTS.WATER_USAGE.DETAIL(id)
    );
    return response.data || response;
  }

  async getCustomerPemakaianHistoryById(customerId: string): Promise<PemakaianHistory[]> {
    const response = await apiClient.get(API_ENDPOINTS.WATER_USAGE.LIST, {
      params: { customer_id: customerId, page_size: 12 },
    });
    
    const data = response;
    // Backend returns paginated format: { status, message, data: [...], meta: {...} }
    const usageArray: any[] = data.data || data.usage_records || (Array.isArray(data) ? data : []);
    
    // Transform to PemakaianHistory format, already sorted DESC by usage_month from backend
    return usageArray.map((usage: any) => ({
      month: usage.usage_month || usage.usageMonth,
      meterStart: usage.meter_start ?? usage.meterStart ?? 0,
      meterEnd: usage.meter_end ?? usage.meterEnd ?? 0,
      usageM3: usage.usage_m3 ?? usage.usageM3 ?? 0,
      amount: usage.amount_calculated ?? usage.amountCalculated ?? 0,
    }));
  }

  async getPemakaianTrends(
    customerId?: string,
    months: number = 6
  ): Promise<PemakaianTrend[]> {
    const filters: WaterPemakaianFilters = {};
    if (customerId) {
      filters.customerId = customerId;
    }

    const response = await this.getWaterPemakaians(1, months, filters);
    
    return response.data.map((usage: WaterPemakaian) => ({
      month: usage.usageMonth,
      usage: usage.usageM3,
    })).reverse();
  }

  async createWaterPemakaian(data: CreateWaterPemakaianDto): Promise<WaterPemakaian> {
    const response = await apiClient.post(
      API_ENDPOINTS.WATER_USAGE.CREATE,
      {
        customer_id: data.customerId,
        usage_month: data.usageMonth,
        meter_end: data.meterEnd,
        notes: data.notes,
      }
    );
    return response.data || response;
  }

  async updateWaterPemakaian(
    id: string,
    data: UpdateWaterPemakaianDto
  ): Promise<WaterPemakaian> {
    const response = await apiClient.put(
      API_ENDPOINTS.WATER_USAGE.UPDATE(id),
      {
        meter_end: data.meterEnd,
        notes: data.notes,
      }
    );
    return response.data || response;
  }

  async deleteWaterPemakaian(id: string): Promise<void> {
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
    return response.data || response;
  }

  async bulkImportWaterPemakaian(usageMonth: string, records: Array<{ meter_number?: string; customer_id?: string; meter_end: number; notes?: string }>): Promise<{
    success: number;
    failed: number;
    total: number;
    errors: Array<{ row: number; meter_number: string; error: string }>;
  }> {
    const response = await apiClient.post(
      API_ENDPOINTS.WATER_USAGE.BULK_IMPORT,
      { usage_month: usageMonth, records }
    );
    return response.data || response;
  }

  // Legacy support
  getPemakaianList() {
    return this.getWaterPemakaians();
  }

  // Customer-specific usage methods
  async getCustomerPemakaianHistory(period: '6months' | '12months' | 'all' = '6months'): Promise<WaterPemakaian[]> {
    const params: Record<string, string> = { period };
    const response = await apiClient.get('/customer/usage/history', { params });
    const data = response.data || response;
    return Array.isArray(data) ? data : [];
  }

  async getCurrentPemakaian(): Promise<WaterPemakaian> {
    const response = await apiClient.get('/customer/usage/current');
    return response.data || response;
  }

  async getPemakaianStats(): Promise<{
    currentMonth: number;
    lastMonth: number;
    average: number;
    total: number;
    trend: string;
  }> {
    const response = await apiClient.get('/customer/usage/stats');
    return response.data || response;
  }
}

export const usageService = new PemakaianService();
export default usageService;
