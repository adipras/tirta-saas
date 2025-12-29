import { apiClient } from './apiClient';

export interface SubscriptionPayment {
  id: string;
  tenantId: string;
  tenant?: {
    id: string;
    organizationName: string;
    villageCode: string;
  };
  subscriptionPlan: string;
  billingPeriod: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  accountNumber?: string;
  accountName: string;
  referenceNumber?: string;
  proofUrl: string;
  notes?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyPaymentRequest {
  notes?: string;
}

export interface RejectPaymentRequest {
  reason: string;
}

class PlatformSubscriptionService {
  private readonly BASE_URL = '/api/platform/subscription-payments';

  async getSubscriptionPayments(status?: string): Promise<SubscriptionPayment[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get(this.BASE_URL, { params });
    return response;
  }

  async getSubscriptionPaymentDetail(id: string): Promise<SubscriptionPayment> {
    const response = await apiClient.get(`${this.BASE_URL}/${id}`);
    return response;
  }

  async verifyPayment(id: string, data: VerifyPaymentRequest): Promise<void> {
    await apiClient.put(`${this.BASE_URL}/${id}/verify`, data);
  }

  async rejectPayment(id: string, data: RejectPaymentRequest): Promise<void> {
    await apiClient.put(`${this.BASE_URL}/${id}/reject`, data);
  }
}

export const platformSubscriptionService = new PlatformSubscriptionService();
