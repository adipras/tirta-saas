import { apiClient } from './apiClient';

export interface SubscriptionStatus {
  status: 'trial' | 'pending_approval' | 'pending_payment' | 'pending_verification' | 'active' | 'expired' | 'suspended';
  subscriptionPlan?: string;
  trialEndDate?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  daysRemaining: number;
  selectedPlan?: {
    id: string;
    plan: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    maxUsers: number;
    maxCustomers: number;
    maxStorageGB: number;
    maxApiCallsPerDay: number;
    features: string[];
  };
  registrationInvoice?: {
    id: string;
    invoiceNumber: string;
    type: string;
    status: string;
    subscriptionPlan: string;
    planName: string;
    billingPeriod: number;
    amount: number;
    description: string;
    issuedAt: string;
    dueDate?: string;
    paidAt?: string;
  };
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
  private readonly BASE_URL = '/tenant/subscription';

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get(`${this.BASE_URL}/status`);

    return {
      status: (response.status || '').toLowerCase() as SubscriptionStatus['status'],
      subscriptionPlan: response.subscription_plan,
      trialEndDate: response.trial_end_date,
      subscriptionStart: response.subscription_start,
      subscriptionEnd: response.subscription_end,
      daysRemaining: response.days_remaining ?? 0,
      selectedPlan: response.selected_plan
        ? {
            id: response.selected_plan.id,
            plan: response.selected_plan.plan,
            name: response.selected_plan.name,
            description: response.selected_plan.description,
            monthlyPrice: response.selected_plan.monthly_price,
            yearlyPrice: response.selected_plan.yearly_price,
            maxUsers: response.selected_plan.max_users,
            maxCustomers: response.selected_plan.max_customers,
            maxStorageGB: response.selected_plan.max_storage_gb,
            maxApiCallsPerDay: response.selected_plan.max_api_calls_per_day,
            features: response.selected_plan.features || [],
          }
        : undefined,
      registrationInvoice: response.registration_invoice
        ? {
            id: response.registration_invoice.id,
            invoiceNumber: response.registration_invoice.invoice_number,
            type: response.registration_invoice.type,
            status: response.registration_invoice.status,
            subscriptionPlan: response.registration_invoice.subscription_plan,
            planName: response.registration_invoice.plan_name,
            billingPeriod: response.registration_invoice.billing_period,
            amount: response.registration_invoice.amount,
            description: response.registration_invoice.description,
            issuedAt: response.registration_invoice.issued_at,
            dueDate: response.registration_invoice.due_date,
            paidAt: response.registration_invoice.paid_at,
          }
        : undefined,
      pendingPayment: response.pending_payment
        ? {
            id: response.pending_payment.id,
            status: response.pending_payment.status,
            submittedAt: response.pending_payment.submitted_at,
          }
        : undefined,
    };
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
