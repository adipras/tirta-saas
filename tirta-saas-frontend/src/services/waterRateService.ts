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
      if (filters.subscription_id) params.subscription_id = filters.subscription_id;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.active !== undefined) params.active = filters.active;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
    }

    const response = await apiClient.get(API_ENDPOINTS.WATER_RATES.LIST, {
      params,
    });
    
    // Backend returns array directly, not wrapped
    const data = Array.isArray(response) ? response : response.data || [];
    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    };
  }

  async getWaterRate(id: string): Promise<WaterRate> {
    const response = await apiClient.get(
      API_ENDPOINTS.WATER_RATES.DETAIL(id)
    );
    return response;
  }

  async getCurrentRate(subscriptionId: string): Promise<WaterRate | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.WATER_RATES.CURRENT, {
        params: { subscription_id: subscriptionId },
      });
      return response;
    } catch (error) {
      return null;
    }
  }

  async createWaterRate(data: CreateWaterRateDto): Promise<WaterRate> {
    const response = await apiClient.post(
      API_ENDPOINTS.WATER_RATES.CREATE,
      data
    );
    return response;
  }

  async updateWaterRate(
    id: string,
    data: UpdateWaterRateDto
  ): Promise<WaterRate> {
    const response = await apiClient.put(
      API_ENDPOINTS.WATER_RATES.UPDATE(id),
      data
    );
    return response;
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

    // Backend returns array directly
    const rates = Array.isArray(response) ? response : response.data || [];
    
    // Transform to RateHistory format
    const data: RateHistory[] = rates.map((rate: WaterRate) => ({
      id: rate.id,
      subscriptionName: rate.subscription?.name || 'Unknown',
      amount: rate.amount,
      effective_date: rate.effective_date,
      active: rate.active,
      created_at: rate.created_at,
    }));

    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    };
  }
}

export const waterRateService = new WaterRateService();
