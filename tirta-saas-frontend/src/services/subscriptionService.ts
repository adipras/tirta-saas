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

    const response = await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_TYPES.LIST, {
      params,
    });
    return response.data;
  }

  async getAllSubscriptionTypes(): Promise<SubscriptionType[]> {
    const response = await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_TYPES.LIST, {
      params: { limit: 1000 },
    });
    return response.data.data || response.data;
  }

  async getSubscriptionType(id: string): Promise<SubscriptionType> {
    const response = await apiClient.get(
      API_ENDPOINTS.SUBSCRIPTION_TYPES.DETAIL(id)
    );
    return response.data;
  }

  async createSubscriptionType(
    data: CreateSubscriptionTypeDto
  ): Promise<SubscriptionType> {
    const response = await apiClient.post(
      API_ENDPOINTS.SUBSCRIPTION_TYPES.CREATE,
      data
    );
    return response.data;
  }

  async updateSubscriptionType(
    id: string,
    data: UpdateSubscriptionTypeDto
  ): Promise<SubscriptionType> {
    const response = await apiClient.put(
      API_ENDPOINTS.SUBSCRIPTION_TYPES.UPDATE(id),
      data
    );
    return response.data;
  }

  async deleteSubscriptionType(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SUBSCRIPTION_TYPES.DELETE(id));
  }

  async getStats(): Promise<SubscriptionTypeStats> {
    // This endpoint might not exist yet in backend, return mock data for now
    return {
      totalTypes: 0,
      activeTypes: 0,
      totalCustomers: 0,
      totalMonthlyRevenue: 0,
    };
  }
}

export const subscriptionService = new SubscriptionService();
