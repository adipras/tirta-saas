import { apiClient } from './apiClient';

export interface SubscriptionStatus {
  status: 'trial' | 'pending_verification' | 'active' | 'expired' | 'suspended';
  subscriptionPlan?: string;
  trialEndDate?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  daysRemaining: number;
  pendingPayment?: {
    id: string;
    status: string;
    submittedAt: string;
  };
}

export interface SubmitPaymentRequest {
  subscriptionPlan: string;
  billingPeriod: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  accountNumber?: string;
  accountName: string;
  referenceNumber?: string;
  notes?: string;
}

export interface SubmitPaymentResponse {
  id: string;
  confirmationId: string;
  status: string;
  message: string;
}

class SubscriptionPaymentService {
  private readonly BASE_URL = '/api/tenant/subscription';

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get(`${this.BASE_URL}/status`);
    return response;
  }

  async submitPayment(
    data: SubmitPaymentRequest,
    proofFile: File
  ): Promise<SubmitPaymentResponse> {
    const formData = new FormData();
    formData.append('subscription_plan', data.subscriptionPlan);
    formData.append('billing_period', data.billingPeriod.toString());
    formData.append('amount', data.amount.toString());
    formData.append('payment_date', data.paymentDate);
    formData.append('payment_method', data.paymentMethod);
    formData.append('account_name', data.accountName);
    
    if (data.accountNumber) {
      formData.append('account_number', data.accountNumber);
    }
    if (data.referenceNumber) {
      formData.append('reference_number', data.referenceNumber);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    formData.append('proof_file', proofFile);

    const response = await apiClient.post(`${this.BASE_URL}/payment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }
}

export const subscriptionPaymentService = new SubscriptionPaymentService();
