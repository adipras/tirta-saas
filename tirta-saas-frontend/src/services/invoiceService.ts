import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type {
  Invoice,
  InvoiceDetails,
  InvoiceListStats,
  PaymentHistory,
} from '../types/invoice';
import type { PaginatedResponse } from './customerService';

// We can reuse the PaginatedResponse from customerService or move it to a shared types file.
// For now, we import it.

export interface InvoiceFilters {
  status?: 'paid' | 'unpaid' | 'overdue' | 'partial';
  type?: 'monthly' | 'registration' | 'manual';
  customerId?: string;
  search?: string;
}

export interface CreateInvoiceItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  dueDate: string;
  notes?: string;
  items: CreateInvoiceItemPayload[];
}

interface RawInvoiceCustomer {
  id?: string;
  customer_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  meter_number?: string;
}

interface RawInvoice {
  id?: string;
  invoice_number?: string;
  type?: 'monthly' | 'registration' | 'manual';
  customer_id?: string;
  customer_name?: string;
  meter_number?: string;
  meter_start?: number;
  meter_end?: number;
  period_start_date?: string;
  period_end_date?: string;
  usage_month?: string;
  usage_m3?: number;
  usage_amount?: number;
  water_charge?: number;
  amount?: number;
  abonemen?: number;
  subscription_fee?: number;
  price_per_m3?: number;
  total_amount?: number;
  total_paid?: number;
  remaining_amount?: number;
  penalty_amount?: number;
  penalty_days?: number;
  stored_penalty_amount?: number;
  stored_total_amount?: number;
  payment_status?: string;
  is_paid?: boolean;
  created_at?: string;
  due_date?: string;
  customer?: RawInvoiceCustomer;
  sub_total?: number;
  subtotal?: number;
  notes?: string;
  items?: RawInvoiceItem[];
  payment_history?: PaymentHistory[];
  payments?: PaymentHistory[];
}

interface RawInvoiceItem {
  description?: string;
  quantity?: number | string;
  unit_price?: number;
  unitPrice?: number;
  amount?: number;
  total?: number;
}

interface InvoiceListApiResponse {
  invoices?: RawInvoice[];
  data?: RawInvoice[];
  total?: number;
  pagination?: PaginatedResponse<Invoice>['pagination'];
  stats?: {
    total_invoices?: number;
    paid_count?: number;
    unpaid_count?: number;
    partial_count?: number;
    overdue_count?: number;
    open_count?: number;
    total_amount?: number;
    outstanding_amount?: number;
  };
}

interface SuccessEnvelope<T> {
  data?: T;
  message?: string;
  status?: string;
}

const unwrapInvoice = (response: SuccessEnvelope<RawInvoice> | RawInvoice): RawInvoice => {
  if ('data' in response && response.data) {
    return response.data;
  }

  return response as RawInvoice;
};

const normalizeInvoiceStatus = (inv: RawInvoice): Invoice['status'] => {
  const totalAmount = Number(inv.total_amount || 0);
  const totalPaid = Number(inv.total_paid || 0);
  const remainingAmount = Number(inv.remaining_amount ?? (totalAmount - totalPaid));
  const rawStatus = typeof inv.payment_status === 'string'
    ? inv.payment_status.toLowerCase()
    : '';
  const dueDate = typeof inv.due_date === 'string' && inv.due_date
    ? new Date(inv.due_date)
    : null;
  const isOverdue = dueDate !== null && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now();

  if (inv.is_paid === true || (totalAmount > 0 && totalPaid >= totalAmount) || remainingAmount <= 0) {
    return 'paid';
  }

  if (rawStatus === 'overdue') {
    return 'overdue';
  }

  if (remainingAmount > 0 && isOverdue) {
    return 'overdue';
  }

  if (rawStatus === 'paid' || rawStatus === 'unpaid' || rawStatus === 'overdue' || rawStatus === 'partial') {
    return rawStatus;
  }

  if (totalPaid > 0 && totalPaid < totalAmount) {
    return 'partial';
  }

  return 'unpaid';
};

const mapInvoice = (inv: RawInvoice): Invoice => {
  const totalAmount = Number(inv.total_amount || 0);
  const totalPaid = Number(inv.total_paid || 0);
  const remainingAmount = Number(inv.remaining_amount ?? (totalAmount - totalPaid));
  const items = (inv.items || []).map((item) => {
    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    return {
      description: item.description || '',
      quantity,
      unitPrice,
      amount: Number(item.amount ?? item.total ?? (quantity * unitPrice)),
    };
  });

  return {
    id: inv.id || '',
    invoiceNumber: inv.invoice_number || `INV-${inv.id?.substring(0, 8) || 'draft'}`,
    type: inv.type,
    customerId: inv.customer_id || '',
    customerName: inv.customer_name || inv.customer?.name || 'N/A',
    meterNumber: inv.meter_number || inv.customer?.meter_number || undefined,
    meterStart: typeof inv.meter_start === 'number' ? inv.meter_start : undefined,
    meterEnd: typeof inv.meter_end === 'number' ? inv.meter_end : undefined,
    periodStartDate: inv.period_start_date || '',
    periodEndDate: inv.period_end_date || '',
    billingPeriod: inv.usage_month || '',
    usage: inv.usage_m3 ?? inv.usage_amount ?? 0,
    amount: inv.water_charge ?? inv.amount ?? inv.total_amount ?? 0,
    subscriptionFee: Number(inv.abonemen ?? inv.subscription_fee ?? 0),
    pricePerM3: Number(inv.price_per_m3 ?? 0),
    totalAmount,
    amountPaid: totalPaid,
    amountDue: remainingAmount,
    penaltyAmount: Number(inv.penalty_amount || 0),
    penaltyDays: Number(inv.penalty_days || 0),
    storedPenaltyAmount: Number(inv.stored_penalty_amount || 0),
    storedTotalAmount: Number(inv.stored_total_amount || 0),
    status: normalizeInvoiceStatus(inv),
    issueDate: inv.created_at || '',
    dueDate: inv.due_date || '',
    createdAt: inv.created_at || '',
    customer: inv.customer
        ? {
          customerId: inv.customer.id || inv.customer.customer_id || inv.customer_id || '',
          name: inv.customer.name || inv.customer_name || 'N/A',
          email: inv.customer.email || '',
          phone: inv.customer.phone || '',
          address: inv.customer.address || '',
          meterNumber: inv.customer.meter_number,
        }
      : undefined,
    subtotal: Number(inv.sub_total ?? inv.subtotal ?? 0),
    notes: inv.notes || undefined,
    items,
    payments: inv.payment_history || inv.payments || [],
  };
};

const buildInvoiceListStats = (invoices: Invoice[]): InvoiceListStats => ({
  totalInvoices: invoices.length,
  paidCount: invoices.filter((invoice) => invoice.status === 'paid').length,
  unpaidCount: invoices.filter((invoice) => invoice.status === 'unpaid').length,
  partialCount: invoices.filter((invoice) => invoice.status === 'partial').length,
  overdueCount: invoices.filter((invoice) => invoice.status === 'overdue').length,
  openCount: invoices.filter((invoice) => invoice.status !== 'paid').length,
  totalAmount: invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
  outstandingAmount: invoices.reduce((sum, invoice) => sum + invoice.amountDue, 0),
});

const mapInvoiceListStats = (stats?: InvoiceListApiResponse['stats']): InvoiceListStats | undefined => {
  if (!stats) {
    return undefined;
  }

  return {
    totalInvoices: Number(stats.total_invoices ?? 0),
    paidCount: Number(stats.paid_count ?? 0),
    unpaidCount: Number(stats.unpaid_count ?? 0),
    partialCount: Number(stats.partial_count ?? 0),
    overdueCount: Number(stats.overdue_count ?? 0),
    openCount: Number(stats.open_count ?? 0),
    totalAmount: Number(stats.total_amount ?? 0),
    outstandingAmount: Number(stats.outstanding_amount ?? 0),
  };
};

export interface InvoiceListResult extends PaginatedResponse<Invoice> {
  stats: InvoiceListStats;
}

class InvoiceService {
  async getTagihan(
    page: number = 1,
    limit: number = 10,
    filters?: InvoiceFilters
  ): Promise<InvoiceListResult> {
    const params = {
      page,
      limit,
      status: filters?.status,
      type: filters?.type,
      customer_id: filters?.customerId,
      search: filters?.search,
    };

    const response = await apiClient.get<InvoiceListApiResponse>(
      API_ENDPOINTS.INVOICES.LIST,
      { params }
    );
    
    const responseData = response;
    
    // Extract invoices array
    const invoicesArray = responseData.invoices || responseData.data || [];
    
    // Map backend fields to frontend format
    const mappedTagihan = invoicesArray.map(mapInvoice);
    
    return {
      data: mappedTagihan,
      pagination: responseData.pagination || {
        total: responseData.total || mappedTagihan.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil((responseData.total || mappedTagihan.length) / limit),
        currentPage: page,
      },
      stats: mapInvoiceListStats(responseData.stats) || buildInvoiceListStats(mappedTagihan),
    };
  }

  async getInvoiceById(id: string): Promise<InvoiceDetails> {
    const response = await apiClient.get<SuccessEnvelope<RawInvoice> | RawInvoice>(API_ENDPOINTS.INVOICES.DETAIL(id));
    const inv = unwrapInvoice(response);
    
    // Map backend fields to frontend format
    const mapped = mapInvoice(inv);
    return {
      ...mapped,
      items: mapped.items || [],
      paymentHistory: inv.payment_history || [],
    };
  }

  async createInvoice(data: CreateInvoicePayload): Promise<Invoice> {
    const response = await apiClient.post<RawInvoice>(API_ENDPOINTS.INVOICES.CREATE, {
      customer_id: data.customerId,
      due_date: data.dueDate,
      notes: data.notes,
      items: data.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    });
    return mapInvoice(response);
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const response = await apiClient.put<RawInvoice>(
      API_ENDPOINTS.INVOICES.UPDATE(id),
      data
    );
    return mapInvoice(response);
  }

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.INVOICES.DELETE(id));
  }

  async generateTagihan(customerIds: string[], issueDate: string): Promise<{ count: number }> {
    const response = await apiClient.post<{ count?: number }>(API_ENDPOINTS.INVOICES.GENERATE, {
      customerIds,
      issueDate,
    });
    return { count: response.count || 0 };
  }

  // Customer-specific methods
  async getCustomerTagihan(): Promise<Invoice[]> {
    const response = await apiClient.get<RawInvoice[] | SuccessEnvelope<RawInvoice[]>>('/customer/invoices');
    const invoices = Array.isArray(response)
      ? response
      : response.data || [];
    return invoices.map(mapInvoice);
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
