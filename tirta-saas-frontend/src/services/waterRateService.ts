import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type { 
  WaterRate,
  CreateWaterRateDto,
  UpdateWaterRateDto,
  WaterRateFilters,
  RateHistory
} from '../types/waterRate';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class WaterRateService {
  async getWaterRates(
    page: number = 1,
    limit: number = 10,
    filters?: WaterRateFilters
  ): Promise<PaginatedResponse<WaterRate>> {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      limit,
    };

    if (filters) {
      if (filters.subscriptionId) params.subscription_id = filters.subscriptionId;
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.active !== undefined) params.active = filters.active;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
    }

    const response = await apiClient.get(API_ENDPOINTS.WATER_RATES.LIST, {
      params,
    });
    return response.data;
  }

  async getWaterRate(id: string): Promise<WaterRate> {
    const response = await apiClient.get(
      API_ENDPOINTS.WATER_RATES.DETAIL(id)
    );
    return response.data;
  }

  async getCurrentRate(subscriptionId: string): Promise<WaterRate | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.WATER_RATES.CURRENT, {
        params: { subscription_id: subscriptionId },
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createWaterRate(data: CreateWaterRateDto): Promise<WaterRate> {
    const response = await apiClient.post(
      API_ENDPOINTS.WATER_RATES.CREATE,
      data
    );
    return response.data;
  }

  async updateWaterRate(
    id: string,
    data: UpdateWaterRateDto
  ): Promise<WaterRate> {
    const response = await apiClient.put(
      API_ENDPOINTS.WATER_RATES.UPDATE(id),
      data
    );
    return response.data;
  }

  async deleteWaterRate(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.WATER_RATES.DELETE(id));
  }

  async activateWaterRate(id: string): Promise<WaterRate> {
    return this.updateWaterRate(id, { active: true });
  }

  async deactivateWaterRate(id: string): Promise<WaterRate> {
    return this.updateWaterRate(id, { active: false });
  }

  async getRateHistory(
    subscriptionId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<RateHistory>> {
    const params: Record<string, string | number | undefined> = {
      page,
      limit,
    };

    if (subscriptionId) {
      params.subscription_id = subscriptionId;
    }

    const response = await apiClient.get(API_ENDPOINTS.WATER_RATES.LIST, {
      params: { ...params, sort: 'effective_date:desc' },
    });

    // Transform to RateHistory format
    const data: RateHistory[] = response.data.data.map((rate: WaterRate) => ({
      id: rate.id,
      subscriptionName: rate.subscription?.name || 'Unknown',
      amount: rate.amount,
      effectiveDate: rate.effectiveDate,
      active: rate.active,
      createdAt: rate.createdAt,
    }));

    return {
      ...response.data,
      data,
    };
  }
}

export const waterRateService = new WaterRateService();
