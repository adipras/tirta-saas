import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type { Invoice, InvoiceDetails } from '../types/invoice';
import type { PaginatedResponse } from './customerService';

// We can reuse the PaginatedResponse from customerService or move it to a shared types file.
// For now, we import it.

export interface InvoiceFilters {
  status?: 'paid' | 'unpaid' | 'overdue';
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
      ...filters,
    };

    const response = await apiClient.get<PaginatedResponse<Invoice>>(
      API_ENDPOINTS.INVOICES.LIST,
      { params }
    );
    return response;
  }

  async getInvoiceById(id: string): Promise<InvoiceDetails> {
    const response = await apiClient.get<InvoiceDetails>(API_ENDPOINTS.INVOICES.DETAIL(id));
    return response;
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const response = await apiClient.post<Invoice>(API_ENDPOINTS.INVOICES.CREATE, data);
    return response;
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const response = await apiClient.put<Invoice>(
      API_ENDPOINTS.INVOICES.UPDATE(id),
      data
    );
    return response;
  }

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.INVOICES.DELETE(id));
  }

  async generateInvoices(customerIds: string[], issueDate: string): Promise<{ count: number }> {
    const response = await apiClient.post<{ count: number }>(API_ENDPOINTS.INVOICES.GENERATE, {
      customerIds,
      issueDate,
    });
    return response;
  }

  // Customer-specific methods
  async getCustomerInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<Invoice[]>('/customer/invoices');
    return response;
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