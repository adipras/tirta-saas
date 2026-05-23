import { API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';
import { asArray, asRecord, getNumber, getString, unwrapResponseData } from '../utils/dataTransform';

const STATIC_BASE = API_ORIGIN;

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

function mapSubscriptionPayment(payment: unknown): SubscriptionPayment {
  const data = asRecord(payment);

  return {
    id: getString(data.id),
    tenantId: getString(data.tenant_id),
    tenant: getString(data.tenant_name)
      ? {
          id: getString(data.tenant_id),
          organizationName: getString(data.tenant_name),
          villageCode: getString(data.tenant_village_code, '-'),
        }
      : undefined,
    subscriptionPlan: getString(data.subscription_plan),
    billingPeriod: getNumber(data.billing_period),
    amount: getNumber(data.amount),
    paymentDate: getString(data.payment_date),
    paymentMethod: getString(data.payment_method),
    accountNumber: getString(data.account_number),
    accountName: getString(data.account_name),
    referenceNumber: getString(data.reference_number),
    proofUrl: getString(data.proof_url) ? `${STATIC_BASE}${getString(data.proof_url)}` : '',
    notes: getString(data.notes),
    status: getString(data.status) as SubscriptionPayment['status'],
    verifiedBy: getString(data.verified_by),
    verifiedAt: getString(data.verified_at),
    rejectionReason: getString(data.rejection_reason),
    createdAt: getString(data.created_at),
    updatedAt: getString(data.updated_at),
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

  private extractPayload<T>(response: unknown): T {
    return unwrapResponseData(response) as T;
  }

  private toRelativeProofUrl(proofUrl: string): string {
    try {
      const url = new URL(proofUrl, STATIC_BASE);
      return `${url.pathname.replace(/^\/api/, '')}${url.search}`;
    } catch {
      return proofUrl.replace(/^\/api/, '');
    }
  }

  async getSubscriptionPembayaran(status?: string): Promise<SubscriptionPayment[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get(this.BASE_URL, { params });
    const data = this.extractPayload<unknown>(response);
    return asArray(data).map(mapSubscriptionPayment);
  }

  async getSubscriptionPaymentDetail(id: string): Promise<SubscriptionPayment> {
    const response = await apiClient.get(`${this.BASE_URL}/${id}`);
    return mapSubscriptionPayment(this.extractPayload(response));
  }

  async getPaymentProofBlob(proofUrl: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(this.toRelativeProofUrl(proofUrl), {
      responseType: 'blob',
    });
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
