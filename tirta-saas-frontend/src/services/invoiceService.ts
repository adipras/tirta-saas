import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type { Invoice, InvoiceDetails } from '../types/invoice';
import type { PaginatedResponse } from './customerService';

// We can reuse the PaginatedResponse from customerService or move it to a shared types file.
// For now, we import it.

export interface InvoiceFilters {
  status?: 'paid' | 'unpaid' | 'overdue' | 'partial';
  type?: 'monthly' | 'registration';
  customerId?: string;
  search?: string;
}

class InvoiceService {
  async getInvoices(
    page: number = 1,
    limit: number = 10,
    filters?: InvoiceFilters
  ): Promise<PaginatedResponse<Invoice>> {
    const params = {
      page,
      limit,
      status: filters?.status,
      type: filters?.type,
      customer_id: filters?.customerId,
      search: filters?.search,
    };

    const response = await apiClient.get<any>(
      API_ENDPOINTS.INVOICES.LIST,
      { params }
    );
    
    // Backend returns { status, message, data: {...} }
    const responseData = response.data || response;
    
    // Extract invoices array
    const invoicesArray = responseData.invoices || responseData.data || [];
    
    // Map backend fields to frontend format
    const mappedInvoices = invoicesArray.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number || `INV-${inv.id?.substring(0, 8)}`,
      customerId: inv.customer_id,
      customerName: inv.customer_name || inv.customer?.name || 'N/A',
      periodStartDate: inv.period_start_date || '',
      periodEndDate: inv.period_end_date || '',
      billingPeriod: inv.usage_month || '',
      usage: inv.usage_m3 || 0,
      amount: inv.total_amount || 0,
      totalAmount: inv.total_amount || 0,
      amountPaid: inv.total_paid || 0,
      amountDue: (inv.total_amount || 0) - (inv.total_paid || 0),
      status: (inv.payment_status as Invoice['status']) || (inv.is_paid ? 'paid' : 'unpaid'),
      issueDate: inv.created_at || '',
      dueDate: inv.due_date || '',
      createdAt: inv.created_at || '',
      customer: inv.customer,
    }));
    
    return {
      data: mappedInvoices,
      pagination: responseData.pagination || {
        total: responseData.total || mappedInvoices.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil((responseData.total || mappedInvoices.length) / limit),
        currentPage: page,
      }
    };
  }

  async getInvoiceById(id: string): Promise<InvoiceDetails> {
    const response = await apiClient.get<any>(API_ENDPOINTS.INVOICES.DETAIL(id));
    const inv = response.data || response;
    
    // Map backend fields to frontend format
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number || `INV-${inv.id?.substring(0, 8)}`,
      customerId: inv.customer_id,
      customerName: inv.customer_name || inv.customer?.name || 'N/A',
      periodStartDate: inv.period_start_date || '',
      periodEndDate: inv.period_end_date || '',
      billingPeriod: inv.usage_month || '',
      usage: inv.usage_m3 || 0,
      amount: inv.total_amount || 0,
      totalAmount: inv.total_amount || 0,
      amountPaid: inv.total_paid || 0,
      amountDue: (inv.total_amount || 0) - (inv.total_paid || 0),
      status: (inv.payment_status as Invoice['status']) || (inv.is_paid ? 'paid' : 'unpaid'),
      issueDate: inv.created_at || '',
      dueDate: inv.due_date || '',
      createdAt: inv.created_at || '',
      customer: inv.customer,
      items: inv.items || [],
      paymentHistory: inv.payment_history || [],
    };
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const response = await apiClient.post<any>(API_ENDPOINTS.INVOICES.CREATE, data);
    return response.data || response;
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.INVOICES.UPDATE(id),
      data
    );
    return response.data || response;
  }

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.INVOICES.DELETE(id));
  }

  async generateInvoices(customerIds: string[], issueDate: string): Promise<{ count: number }> {
    const response = await apiClient.post<any>(API_ENDPOINTS.INVOICES.GENERATE, {
      customerIds,
      issueDate,
    });
    return response.data || response;
  }

  // Customer-specific methods
  async getCustomerInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<any>('/customer/invoices');
    const data = response.data || response;
    return Array.isArray(data) ? data : [];
  }

  async downloadInvoicePDF(invoiceId: string): Promise<void> {
    const response = await apiClient.get(`/customer/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

const invoiceServiceInstance = new InvoiceService();
export const invoiceService = invoiceServiceInstance;
export default invoiceServiceInstance;