import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type {
  Payment,
  PaymentFormData,
  PaymentReceipt,
  OutstandingInvoice,
} from '../types/payment';
import type { PaginatedResponse } from './customerService';

export interface PaymentFilters {
  customerId?: string;
  invoiceId?: string;
  paymentMethod?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

class PaymentService {
  async getPayments(
    page: number = 1,
    limit: number = 10,
    filters?: PaymentFilters
  ): Promise<PaginatedResponse<Payment>> {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get<PaginatedResponse<Payment>>(
      API_ENDPOINTS.PAYMENTS.LIST,
      { params }
    );
    return response;
  }

  async getPaymentById(id: number): Promise<Payment> {
    const response = await apiClient.get<Payment>(
      API_ENDPOINTS.PAYMENTS.GET.replace(':id', String(id))
    );
    return response;
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(
      API_ENDPOINTS.PAYMENTS.BY_INVOICE.replace(':invoiceId', String(invoiceId))
    );
    return response;
  }

  async getOutstandingInvoices(customerId?: number): Promise<OutstandingInvoice[]> {
    const params = customerId ? { customerId } : {};
    const response = await apiClient.get<OutstandingInvoice[]>(
      API_ENDPOINTS.PAYMENTS.OUTSTANDING_INVOICES,
      { params }
    );
    return response;
  }

  async createPayment(data: PaymentFormData): Promise<Payment> {
    const response = await apiClient.post<Payment>(
      API_ENDPOINTS.PAYMENTS.CREATE,
      data
    );
    return response;
  }

  async updatePayment(id: number, data: Partial<PaymentFormData>): Promise<Payment> {
    const response = await apiClient.put<Payment>(
      API_ENDPOINTS.PAYMENTS.UPDATE.replace(':id', String(id)),
      data
    );
    return response;
  }

  async deletePayment(id: number): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.PAYMENTS.DELETE.replace(':id', String(id))
    );
  }

  async voidPayment(id: number, reason?: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(
      API_ENDPOINTS.PAYMENTS.VOID.replace(':id', String(id)),
      { reason }
    );
    return response;
  }

  async generateReceipt(paymentId: number): Promise<PaymentReceipt> {
    const response = await apiClient.post<PaymentReceipt>(
      API_ENDPOINTS.PAYMENTS.GENERATE_RECEIPT.replace(':id', String(paymentId))
    );
    return response;
  }

  async getReceipt(paymentId: number): Promise<PaymentReceipt> {
    const response = await apiClient.get<PaymentReceipt>(
      API_ENDPOINTS.PAYMENTS.GET_RECEIPT.replace(':id', String(paymentId))
    );
    return response;
  }

  async exportPayments(filters?: PaymentFilters): Promise<Blob> {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.EXPORT, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  // Customer-specific payment methods
  async createCustomerPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<Payment> {
    const response = await apiClient.post<Payment>('/customer/payments', data);
    return response;
  }

  async getCustomerPayments(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/customer/payments');
    return response;
  }

  async getCustomerPaymentReceipt(paymentId: number): Promise<PaymentReceipt> {
    const response = await apiClient.get<PaymentReceipt>(`/customer/payments/${paymentId}/receipt`);
    return response;
  }
}

export const paymentService = new PaymentService();
