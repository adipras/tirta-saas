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
import { asArray, asRecord, getBoolean, getNumber, getString, mapArray } from '../utils/dataTransform';

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

    const response = await apiClient.get(API_ENDPOINTS.WATER_USAGE.LIST, { params });
    const raw = asRecord(response);

    // Support both old shape ({ usage_records: [...] , total }) and new PaginatedResponse { status, message, data: [...], meta }
    let records: unknown[] = [];
    let total = 0;
    let resolvedPage = page;
    let resolvedLimit = limit;

    if (Array.isArray(response)) {
      records = response;
      total = response.length;
    } else if (Array.isArray(raw.usage_records)) {
      // legacy format
      records = raw.usage_records;
      total = getNumber(raw.total, records.length);
    } else if (Array.isArray(raw.data)) {
      // standard paginated format: { status, message, data: [...], meta: {...} }
      records = raw.data;
      const meta = asRecord(raw.meta);
      if (Object.keys(meta).length > 0) {
        total = getNumber(meta.total_items ?? meta.total, records.length);
        resolvedPage = getNumber(meta.current_page, resolvedPage);
        resolvedLimit = getNumber(meta.page_size, resolvedLimit);
      } else {
        total = records.length;
      }
    } else {
      records = [];
      total = 0;
    }

    const mapped = mapArray(records, (usage) => {
      const customer = asRecord(usage.customer);

      return {
        id: getString(usage.id),
        customerId: getString(usage.customer_id ?? usage.customerId),
        customer: Object.keys(customer).length > 0
          ? {
              id: getString(customer.id),
              name: getString(customer.name),
              customerId: getString(customer.id),
              meterNumber: getString(customer.meter_number ?? customer.meterNumber),
              meterLocationName: getString(customer.meter_location_name ?? customer.meterLocationName),
              address: getString(customer.address),
            }
          : undefined,
        customerName: getString(customer.name ?? usage.customerName),
        meterNumber: getString(customer.meter_number ?? usage.meterNumber),
        usageMonth: getString(usage.usage_month ?? usage.usageMonth),
        meterStart: getNumber(usage.meter_start ?? usage.meterStart),
        meterEnd: getNumber(usage.meter_end ?? usage.meterEnd),
        usageM3: getNumber(usage.usage_m3 ?? usage.usageM3),
        rateId: getString(usage.rate_id ?? usage.rateId),
        ratePerM3: getNumber(usage.rate_per_m3 ?? usage.ratePerM3),
        amountCalculated: getNumber(usage.amount_calculated ?? usage.amountCalculated),
        isAnomaly: getBoolean(usage.is_anomaly ?? usage.isAnomaly),
        notes: getString(usage.notes),
        createdAt: getString(usage.created_at ?? usage.createdAt),
        updatedAt: getString(usage.updated_at ?? usage.updatedAt),
      };
    });

    return {
      data: mapped,
      total,
      totalPages: Math.ceil(total / resolvedLimit) || 1,
      page: resolvedPage,
      limit: resolvedLimit,
    };
  }

  async getWaterPemakaian(id: string): Promise<WaterPemakaian> {
    const response = await apiClient.get(API_ENDPOINTS.WATER_USAGE.DETAIL(id));
    return response as WaterPemakaian;
  }

  async getCustomerPemakaianHistoryById(customerId: string): Promise<PemakaianHistory[]> {
    const response = await apiClient.get(API_ENDPOINTS.WATER_USAGE.LIST, {
      params: { customer_id: customerId, page_size: 12 },
    });
    
    const data = asRecord(response);
    const usageArray = data.data ?? data.usage_records ?? response;
    
    // Transform to PemakaianHistory format, already sorted DESC by usage_month from backend
    return mapArray(usageArray, (usage) => ({
      month: getString(usage.usage_month ?? usage.usageMonth),
      meterStart: getNumber(usage.meter_start ?? usage.meterStart),
      meterEnd: getNumber(usage.meter_end ?? usage.meterEnd),
      usageM3: getNumber(usage.usage_m3 ?? usage.usageM3),
      amount: getNumber(usage.amount_calculated ?? usage.amountCalculated),
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
        meter_id: data.meterId,
        usage_month: data.usageMonth,
        meter_end: data.meterEnd,
        notes: data.notes,
      }
    );
    return response as WaterPemakaian;
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
    return response as WaterPemakaian;
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
    return response as {
      success: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    };
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
    return response as {
      success: number;
      failed: number;
      total: number;
      errors: Array<{ row: number; meter_number: string; error: string }>;
    };
  }

  // Legacy support
  getPemakaianList() {
    return this.getWaterPemakaians();
  }

  // Customer-specific usage methods
  async getCustomerPemakaianHistory(period: '6months' | '12months' | 'all' = '6months'): Promise<WaterPemakaian[]> {
    const params: Record<string, string> = { period };
    const response = await apiClient.get('/customer/usage/history', { params });
    return asArray<WaterPemakaian>(response);
  }

  async getCurrentPemakaian(): Promise<WaterPemakaian> {
    const response = await apiClient.get('/customer/usage/current');
    return response as WaterPemakaian;
  }

  async getPemakaianStats(): Promise<{
    currentMonth: number;
    lastMonth: number;
    average: number;
    total: number;
    trend: string;
  }> {
    const response = await apiClient.get('/customer/usage/stats');
    return response as {
      currentMonth: number;
      lastMonth: number;
      average: number;
      total: number;
      trend: string;
    };
  }
}

export const usageService = new PemakaianService();
export default usageService;
