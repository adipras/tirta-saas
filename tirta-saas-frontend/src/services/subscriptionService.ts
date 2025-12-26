import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type { 
  SubscriptionType,
  CreateSubscriptionTypeDto,
  UpdateSubscriptionTypeDto,
  SubscriptionTypeStats
} from '../types/subscription';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class SubscriptionService {
  async getSubscriptionTypes(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<SubscriptionType>> {
    const params = {
      page,
      limit,
      ...(search && { search }),
    };

    const data = await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_TYPES.LIST, {
      params,
    });
    
    // Handle both array response and paginated response
    if (Array.isArray(data)) {
      return {
        data: data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }
    
    return data;
  }

  async getAllSubscriptionTypes(): Promise<SubscriptionType[]> {
    const data = await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_TYPES.LIST, {
      params: { limit: 1000 },
    });
    return Array.isArray(data) ? data : data.data || [];
  }

  async getSubscriptionType(id: string): Promise<SubscriptionType> {
    return await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_TYPES.DETAIL(id));
  }

  async createSubscriptionType(
    data: CreateSubscriptionTypeDto
  ): Promise<SubscriptionType> {
    return await apiClient.post(API_ENDPOINTS.SUBSCRIPTION_TYPES.CREATE, data);
  }

  async updateSubscriptionType(
    id: string,
    data: UpdateSubscriptionTypeDto
  ): Promise<SubscriptionType> {
    return await apiClient.put(API_ENDPOINTS.SUBSCRIPTION_TYPES.UPDATE(id), data);
  }

  async deleteSubscriptionType(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SUBSCRIPTION_TYPES.DELETE(id));
  }

  async getStats(): Promise<SubscriptionTypeStats> {
    return await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_TYPES.STATS);
  }
}

export const subscriptionService = new SubscriptionService();
