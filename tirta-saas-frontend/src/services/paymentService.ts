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
  async getPembayaran(
    page: number = 1,
    limit: number = 10,
    filters?: PaymentFilters
  ): Promise<PaginatedResponse<Payment>> {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get<any>(
      API_ENDPOINTS.PAYMENTS.LIST,
      { params }
    );
    
    const raw = response.data || response;
    
    // Backend returns a raw array
    const rawList: any[] = Array.isArray(raw)
      ? raw
      : raw?.payments || raw?.data || [];

    const mapped: Payment[] = rawList.map((p: any) => ({
      id: p.id,
      invoiceId: p.invoice_id,
      customerId: p.invoice?.customer_id || '',
      customerName: p.invoice?.customer?.name || '-',
      invoiceNumber: p.invoice?.invoice_number || '',
      amount: p.amount || 0,
      paymentMethod: p.payment_method?.type || p.payment_method_type || 'cash',
      paymentDate: p.paid_at || p.created_at || '',
      referenceNumber: p.reference_number || '',
      notes: p.notes || '',
      status: (p.status as any) || 'completed',
      createdAt: p.created_at || '',
      updatedAt: p.updated_at || '',
    }));

    return {
      data: mapped,
      pagination: {
        total: raw?.total || mapped.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil((raw?.total || mapped.length) / limit) || 1,
        currentPage: page,
      }
    };
  }

  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.PAYMENTS.GET.replace(':id', String(id))
    );
    return response.data || response;
  }

  async getPembayaranByInvoice(invoiceId: number): Promise<Payment[]> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.PAYMENTS.BY_INVOICE.replace(':invoiceId', String(invoiceId))
    );
    const data = response.data || response;
    return Array.isArray(data) ? data : [];
  }

  async getOutstandingTagihan(customerId?: string): Promise<OutstandingInvoice[]> {
    const params = customerId ? { customer_id: customerId } : {};
    const response = await apiClient.get<any>(
      API_ENDPOINTS.PAYMENTS.OUTSTANDING_INVOICES,
      { params }
    );
    const data = response.data || response;
    if (!Array.isArray(data)) return [];
    // Map backend snake_case fields to frontend camelCase
    return data.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number || '',
      invoiceDate: inv.created_at || '',
      dueDate: inv.due_date || '',
      totalAmount: inv.total_amount || 0,
      paidAmount: inv.total_paid || 0,
      remainingAmount: inv.remaining_amount ?? ((inv.total_amount || 0) - (inv.total_paid || 0)),
      status: inv.payment_status || (inv.is_paid ? 'paid' : 'unpaid'),
      usageMonth: inv.usage_month,
    }));
  }

  async createPayment(data: PaymentFormData): Promise<Payment> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.PAYMENTS.CREATE,
      {
        invoice_id: data.invoiceId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        payment_date: data.paymentDate,
        reference_number: data.referenceNumber,
        notes: data.notes,
      }
    );
    return response.data || response;
  }

  async updatePayment(id: string, data: Partial<PaymentFormData>): Promise<Payment> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.PAYMENTS.UPDATE.replace(':id', String(id)),
      data
    );
    return response.data || response;
  }

  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.PAYMENTS.DELETE.replace(':id', String(id))
    );
  }

  async voidPayment(id: string, reason?: string): Promise<Payment> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.PAYMENTS.VOID.replace(':id', String(id)),
      { reason }
    );
    return response.data || response;
  }

  async generateReceipt(paymentId: string): Promise<PaymentReceipt> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.PAYMENTS.GENERATE_RECEIPT.replace(':id', String(paymentId))
    );
    return response.data || response;
  }

  async getReceipt(paymentId: string): Promise<PaymentReceipt> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.PAYMENTS.GET_RECEIPT.replace(':id', String(paymentId))
    );
    return response.data || response;
  }

  async exportPembayaran(filters?: PaymentFilters): Promise<Blob> {
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
    const response = await apiClient.post<any>('/customer/payments', data);
    return response.data || response;
  }

  async getCustomerPembayaran(): Promise<Payment[]> {
    const response = await apiClient.get<any>('/customer/payments');
    const data = response.data || response;
    return Array.isArray(data) ? data : [];
  }

  async getCustomerPaymentReceipt(paymentId: number): Promise<PaymentReceipt> {
    const response = await apiClient.get<any>(`/customer/payments/${paymentId}/receipt`);
    return response.data || response;
  }
}

export const paymentService = new PaymentService();
