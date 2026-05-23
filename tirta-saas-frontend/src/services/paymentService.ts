import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type {
  OutstandingInvoice,
  Payment,
  PaymentFormData,
  PaymentMethod,
  PaymentReceipt,
  PaymentReceiptItem,
} from '../types/payment';
import type { PaginatedResponse } from './customerService';
import { asArray, asRecord, getNumber, getString, mapArray, unwrapResponseData } from '../utils/dataTransform';

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
  private normalizePaymentMethod(value: unknown): PaymentMethod {
    const candidate = getString(value, 'cash');
    return ['cash', 'bank_transfer', 'card', 'e_wallet', 'qris', 'other'].includes(candidate)
      ? (candidate as PaymentMethod)
      : 'cash';
  }

  private normalizePaymentStatus(value: unknown): Payment['status'] {
    const candidate = getString(value, 'completed');
    return ['pending', 'completed', 'failed', 'voided'].includes(candidate)
      ? (candidate as Payment['status'])
      : 'completed';
  }

  private mapReceiptItems(items: unknown): PaymentReceiptItem[] {
    return mapArray(items, (item) => ({
      description: getString(item.description),
      quantity: getNumber(item.quantity),
      unitPrice: getNumber(item.unitPrice ?? item.unit_price),
      amount: getNumber(
        item.amount,
        getNumber(item.quantity) * getNumber(item.unitPrice ?? item.unit_price)
      ),
    }));
  }

  private mapReceipt(raw: unknown): PaymentReceipt {
    const data = asRecord(unwrapResponseData(raw));
    const invoiceDetails = asRecord(data.invoiceDetails ?? data.invoice_details);
    const customerDetails = asRecord(data.customerDetails ?? data.customer_details);

    return {
      ...(data as Partial<PaymentReceipt>),
      payment: asRecord(data.payment) as unknown as Payment,
      customerDetails: {
        ...(customerDetails as Partial<PaymentReceipt['customerDetails']>),
        name: getString(customerDetails.name),
      } as PaymentReceipt['customerDetails'],
      invoiceDetails: {
        ...(invoiceDetails as Partial<PaymentReceipt['invoiceDetails']>),
        invoiceNumber: getString(invoiceDetails.invoiceNumber ?? invoiceDetails.invoice_number),
        invoiceDate: getString(invoiceDetails.invoiceDate ?? invoiceDetails.invoice_date),
        dueDate: getString(invoiceDetails.dueDate ?? invoiceDetails.due_date),
        totalAmount: getNumber(invoiceDetails.totalAmount ?? invoiceDetails.total_amount),
        items: this.mapReceiptItems(invoiceDetails.items),
      } as PaymentReceipt['invoiceDetails'],
    } as PaymentReceipt;
  }

  async getPembayaran(
    page: number = 1,
    limit: number = 10,
    filters?: PaymentFilters
  ): Promise<PaginatedResponse<Payment>> {
    const params = {
      page,
      page_size: limit,
      ...filters,
    };

    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.LIST, { params });
    const raw = asRecord(response);
    const rawList = raw.data ?? raw.payments ?? response;

    const mapped = mapArray(rawList, (payment) => {
      const invoice = asRecord(payment.invoice);
      const customer = asRecord(invoice.customer);
      const paymentMethod = asRecord(payment.payment_method);

      return {
        id: getString(payment.id),
        invoiceId: getString(payment.invoice_id),
        customerId: getString(invoice.customer_id),
        customerName: getString(customer.name, '-'),
        invoiceNumber: getString(invoice.invoice_number),
        amount: getNumber(payment.amount),
        paymentMethod: this.normalizePaymentMethod(paymentMethod.type ?? payment.payment_method_type),
        paymentDate: getString(payment.paid_at ?? payment.created_at),
        referenceNumber: getString(payment.reference_number),
        notes: getString(payment.notes),
        status: this.normalizePaymentStatus(payment.status),
        createdAt: getString(payment.created_at),
        updatedAt: getString(payment.updated_at),
      };
    });

    const meta = asRecord(raw.meta);
    const totalItems = getNumber(meta.total_items ?? raw.total, mapped.length);
    const pageSize = getNumber(meta.page_size, limit);

    return {
      data: mapped,
      pagination: {
        total: totalItems,
        page: getNumber(meta.current_page, page),
        limit: pageSize,
        totalPages: getNumber(meta.total_pages, Math.ceil(totalItems / pageSize) || 1),
        currentPage: getNumber(meta.current_page, page),
      },
    };
  }

  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.GET.replace(':id', String(id)));
    return unwrapResponseData(response) as Payment;
  }

  async getPembayaranByInvoice(invoiceId: number): Promise<Payment[]> {
    const response = await apiClient.get(
      API_ENDPOINTS.PAYMENTS.BY_INVOICE.replace(':invoiceId', String(invoiceId))
    );
    return asArray<Payment>(unwrapResponseData(response));
  }

  async getOutstandingTagihan(customerId?: string): Promise<OutstandingInvoice[]> {
    const params = customerId ? { customer_id: customerId } : {};
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.OUTSTANDING_INVOICES, { params });

    return mapArray(unwrapResponseData(response), (invoice) => ({
      id: getString(invoice.id),
      invoiceNumber: getString(invoice.invoice_number),
      type: getString(invoice.type) as OutstandingInvoice['type'],
      invoiceDate: getString(invoice.created_at),
      dueDate: getString(invoice.due_date),
      totalAmount: getNumber(invoice.total_amount),
      paidAmount: getNumber(invoice.total_paid),
      remainingAmount: getNumber(
        invoice.remaining_amount,
        getNumber(invoice.total_amount) - getNumber(invoice.total_paid)
      ),
      status: getString(invoice.payment_status, invoice.is_paid === true ? 'paid' : 'unpaid'),
      usageMonth: getString(invoice.usage_month),
    }));
  }

  async createPayment(data: PaymentFormData): Promise<Payment> {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.CREATE, {
      invoice_id: data.invoiceId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      payment_date: data.paymentDate,
      reference_number: data.referenceNumber,
      notes: data.notes,
    });

    return unwrapResponseData(response) as Payment;
  }

  async updatePayment(id: string, data: Partial<PaymentFormData>): Promise<Payment> {
    const response = await apiClient.put(API_ENDPOINTS.PAYMENTS.UPDATE.replace(':id', String(id)), data);
    return unwrapResponseData(response) as Payment;
  }

  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PAYMENTS.DELETE.replace(':id', String(id)));
  }

  async voidPayment(id: string, reason?: string): Promise<Payment> {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.VOID.replace(':id', String(id)), {
      reason,
    });
    return unwrapResponseData(response) as Payment;
  }

  async generateReceipt(paymentId: string): Promise<PaymentReceipt> {
    const response = await apiClient.post(
      API_ENDPOINTS.PAYMENTS.GENERATE_RECEIPT.replace(':id', String(paymentId))
    );
    return this.mapReceipt(response);
  }

  async getReceipt(paymentId: string): Promise<PaymentReceipt> {
    const response = await apiClient.get(
      API_ENDPOINTS.PAYMENTS.GET_RECEIPT.replace(':id', String(paymentId))
    );
    return this.mapReceipt(response);
  }

  async exportPembayaran(filters?: PaymentFilters): Promise<Blob> {
    return apiClient.get<Blob>(API_ENDPOINTS.PAYMENTS.EXPORT, {
      params: filters,
      responseType: 'blob',
    });
  }

  async createCustomerPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }): Promise<Payment> {
    const response = await apiClient.post('/customer/payments', data);
    return unwrapResponseData(response) as Payment;
  }

  async getCustomerPembayaran(): Promise<Payment[]> {
    const response = await apiClient.get('/customer/payments');
    return asArray<Payment>(unwrapResponseData(response));
  }

  async getCustomerPaymentReceipt(paymentId: number): Promise<PaymentReceipt> {
    const response = await apiClient.get(`/customer/payments/${paymentId}/receipt`);
    return unwrapResponseData(response) as PaymentReceipt;
  }
}

export const paymentService = new PaymentService();
