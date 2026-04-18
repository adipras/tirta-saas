import { apiClient } from './apiClient';

const STATIC_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api').replace('/api', '');

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

function mapSubscriptionPayment(payment: any): SubscriptionPayment {
  return {
    id: payment.id,
    tenantId: payment.tenant_id,
    tenant: payment.tenant_name
      ? {
          id: payment.tenant_id,
          organizationName: payment.tenant_name,
          villageCode: payment.tenant_village_code || '-',
        }
      : undefined,
    subscriptionPlan: payment.subscription_plan,
    billingPeriod: payment.billing_period,
    amount: payment.amount,
    paymentDate: payment.payment_date,
    paymentMethod: payment.payment_method,
    accountNumber: payment.account_number,
    accountName: payment.account_name,
    referenceNumber: payment.reference_number,
    proofUrl: payment.proof_url ? `${STATIC_BASE}${payment.proof_url}` : '',
    notes: payment.notes,
    status: payment.status,
    verifiedBy: payment.verified_by,
    verifiedAt: payment.verified_at,
    rejectionReason: payment.rejection_reason,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
}

export interface VerifyPaymentRequest {
  notes?: string;
}

export interface RejectPaymentRequest {
  reason: string;
}

class PlatformSubscriptionService {
  private readonly BASE_URL = '/platform/subscription-payments';

  async getSubscriptionPayments(status?: string): Promise<SubscriptionPayment[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get<{ data: SubscriptionPayment[] }>(this.BASE_URL, { params });
    return ((response.data as any[]) || []).map(mapSubscriptionPayment);
  }

  async getSubscriptionPaymentDetail(id: string): Promise<SubscriptionPayment> {
    const response = await apiClient.get<{ data: SubscriptionPayment }>(`${this.BASE_URL}/${id}`);
    return mapSubscriptionPayment(response.data);
  }

  async verifyPayment(id: string, data: VerifyPaymentRequest): Promise<void> {
    await apiClient.put(`${this.BASE_URL}/${id}/verify`, data);
  }

  async rejectPayment(id: string, data: RejectPaymentRequest): Promise<void> {
    await apiClient.put(`${this.BASE_URL}/${id}/reject`, data);
  }
}

export const platformSubscriptionService = new PlatformSubscriptionService();
