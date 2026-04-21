import { API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';

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
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submitted_at: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

function withProofUrl(proof: any): PaymentProof {
  return {
    ...proof,
    proof_image_url: proof.proof_image_url ? `${STATIC_BASE}${proof.proof_image_url}` : '',
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
  private baseUrl = '/payment-proofs';

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
    return withProofUrl(response);
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
    return {
      ...response,
      payment_proofs: (response.payment_proofs || []).map(withProofUrl),
    };
  }

  /**
   * Get payment proof by ID
   */
  async getPaymentProof(id: string): Promise<PaymentProof> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return withProofUrl(response);
  }

  /**
   * Verify payment proof (Admin only)
   */
  async verifyPaymentProof(id: string, data: VerifyPaymentData): Promise<PaymentProof> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/verify`, data);
    return withProofUrl(response);
  }

  /**
   * Reject payment proof (Admin only)
   */
  async rejectPaymentProof(id: string, data: RejectPaymentData): Promise<PaymentProof> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/reject`, data);
    return withProofUrl(response);
  }
}

export default new PaymentProofService();
