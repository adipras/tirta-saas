import { API_ENDPOINTS, API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';
import { asArray, asRecord, getNumber, unwrapResponseData } from '../utils/dataTransform';

const STATIC_BASE = API_ORIGIN;

export interface PaymentProof {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  account_name: string;
  account_number?: string;
  reference_number?: string;
  proof_image_url: string;
  notes?: string;
  snapshot_sub_total: number;
  snapshot_penalty_amount: number;
  snapshot_total_amount: number;
  snapshot_remaining_amount: number;
  snapshot_captured_at: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submitted_at: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

function withProofUrl(proof: Record<string, unknown>): PaymentProof {
  const normalizedProof = proof as Partial<PaymentProof>;

  return {
    ...(normalizedProof as PaymentProof),
    proof_image_url:
      typeof normalizedProof.proof_image_url === 'string'
        ? `${STATIC_BASE}${normalizedProof.proof_image_url}`
        : '',
  };
}

export interface PaymentProofListResponse {
  payment_proofs: PaymentProof[];
  total: number;
  page: number;
  per_page: number;
}

export interface SubmitPaymentProofData {
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  account_name: string;
  account_number?: string;
  reference_number?: string;
  notes?: string;
  proof_image: File;
}

export interface VerifyPaymentData {
  notes?: string;
}

export interface RejectPaymentData {
  rejection_reason: string;
}

class PaymentProofService {
  private baseUrl = API_ENDPOINTS.PAYMENT_PROOFS.LIST;

  /**
   * Submit payment proof with image upload
   */
  async submitPaymentProof(data: SubmitPaymentProofData): Promise<PaymentProof> {
    const formData = new FormData();
    formData.append('invoice_id', data.invoice_id);
    formData.append('amount', data.amount.toString());
    formData.append('payment_date', data.payment_date);
    formData.append('payment_method', data.payment_method);
    formData.append('account_name', data.account_name);
    
    if (data.account_number) {
      formData.append('account_number', data.account_number);
    }
    if (data.reference_number) {
      formData.append('reference_number', data.reference_number);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    formData.append('proof_image', data.proof_image);

    const response = await apiClient.post(this.baseUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return withProofUrl(asRecord(unwrapResponseData(response)));
  }

  /**
   * Get list of payment proofs with filters
   */
  async getPaymentProofs(params?: {
    status?: string;
    invoice_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaymentProofListResponse> {
    const response = await apiClient.get(this.baseUrl, { params });
    const payload = asRecord(unwrapResponseData(response));
    return {
      payment_proofs: asArray<Record<string, unknown>>(payload.payment_proofs).map(withProofUrl),
      total: getNumber(payload.total),
      page: getNumber(payload.page, params?.page ?? 1),
      per_page: getNumber(payload.per_page, params?.per_page ?? 10),
    };
  }

  /**
   * Get payment proof by ID
   */
  async getPaymentProof(id: string): Promise<PaymentProof> {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENT_PROOFS.DETAIL(id));
    return withProofUrl(asRecord(unwrapResponseData(response)));
  }

  /**
   * Verify payment proof (Admin only)
   */
  async verifyPaymentProof(id: string, data: VerifyPaymentData): Promise<PaymentProof> {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENT_PROOFS.VERIFY(id), data);
    return withProofUrl(asRecord(unwrapResponseData(response)));
  }

  /**
   * Reject payment proof (Admin only)
   */
  async rejectPaymentProof(id: string, data: RejectPaymentData): Promise<PaymentProof> {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENT_PROOFS.REJECT(id), data);
    return withProofUrl(asRecord(unwrapResponseData(response)));
  }
}

export default new PaymentProofService();
