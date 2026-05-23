import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type {
  CustomerAnalytics,
  ExportOptions,
  OutstandingReportData,
  PaymentReport,
  PemakaianReport,
  ReportFilters,
  RevenueReport,
} from '../types/report';
import { asRecord, getNumber, getString, mapArray } from '../utils/dataTransform';

class ReportService {
  private serializeFilters(filters?: ReportFilters): Record<string, unknown> | undefined {
    if (!filters) {
      return undefined;
    }

    return {
      start_date: filters.startDate,
      end_date: filters.endDate,
      customer_id: filters.customerId,
      subscription_type_id: filters.subscriptionTypeId,
      status: filters.status,
    };
  }

  private normalizeRevenueReport(raw: unknown, filters?: ReportFilters): RevenueReport {
    const data = asRecord(raw);
    const period = asRecord(data.period);

    return {
      totalRevenue: getNumber(data.totalRevenue ?? data.total_revenue),
      monthlyRevenue: Array.isArray(data.monthlyRevenue)
        ? (data.monthlyRevenue as RevenueReport['monthlyRevenue'])
        : mapArray(data.monthly_revenue, (item) => ({
            month: getString(item.month),
            year: getNumber(item.year),
            revenue: getNumber(item.revenue),
            invoices: getNumber(item.invoices),
          })),
      revenueBySubscriptionType: Array.isArray(data.revenueBySubscriptionType)
        ? (data.revenueBySubscriptionType as RevenueReport['revenueBySubscriptionType'])
        : mapArray(data.revenue_by_subscription_type, (item) => ({
            subscriptionType: getString(item.subscriptionType ?? item.subscription_type, 'Tanpa Tipe'),
            revenue: getNumber(item.revenue),
            percentage: getNumber(item.percentage),
          })),
      period: {
        startDate:
          getString(period.startDate ?? period.start_date ?? period.start) ||
          filters?.startDate ||
          '',
        endDate:
          getString(period.endDate ?? period.end_date ?? period.end) ||
          filters?.endDate ||
          '',
      },
    };
  }

  async getRevenueReport(filters?: ReportFilters): Promise<RevenueReport> {
    const response = await apiClient.get(
      API_ENDPOINTS.REPORTS.REVENUE,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizeRevenueReport(response, filters);
  }

  private normalizePaymentReport(raw: unknown): PaymentReport {
    const data = asRecord(raw);

    return {
      totalCollected: getNumber(data.totalCollected ?? data.total_collected ?? data.total_amount),
      totalOutstanding: getNumber(data.totalOutstanding ?? data.total_outstanding),
      paymentMethodBreakdown: Array.isArray(data.paymentMethodBreakdown)
        ? (data.paymentMethodBreakdown as PaymentReport['paymentMethodBreakdown'])
        : mapArray(data.payment_method_breakdown, (item) => ({
            method: getString(item.method, 'Tanpa Metode'),
            amount: getNumber(item.amount),
            count: getNumber(item.count),
            percentage: getNumber(item.percentage),
          })),
      dailyCollection: Array.isArray(data.dailyCollection)
        ? (data.dailyCollection as PaymentReport['dailyCollection'])
        : Array.isArray(data.daily_collection)
          ? mapArray(data.daily_collection, (item) => ({
              date: getString(item.date),
              amount: getNumber(item.amount ?? item.total),
              count: getNumber(item.count),
            }))
          : mapArray(data.daily_trends, (item) => ({
              date: getString(item.date),
              amount: getNumber(item.amount ?? item.total),
              count: getNumber(item.count),
            })),
      outstandingPembayaran: Array.isArray(data.outstandingPembayaran)
        ? (data.outstandingPembayaran as PaymentReport['outstandingPembayaran'])
        : mapArray(data.outstanding_payments, (item) => ({
            customerId: getNumber(item.customerId ?? item.customer_id),
            customerName: getString(item.customerName ?? item.customer_name, '-'),
            invoiceNumber: getString(item.invoiceNumber ?? item.invoice_number, '-'),
            amount: getNumber(item.amount),
            dueDate: getString(item.dueDate ?? item.due_date),
            daysOverdue: getNumber(item.daysOverdue ?? item.days_overdue),
          })),
    };
  }

  private normalizeCustomerAnalytics(raw: unknown): CustomerAnalytics {
    const data = asRecord(raw);

    return {
      totalPelanggan: getNumber(data.totalPelanggan ?? data.total_customers),
      activePelanggan: getNumber(data.activePelanggan ?? data.active_customers),
      inactivePelanggan: getNumber(data.inactivePelanggan ?? data.inactive_customers),
      suspendedPelanggan: getNumber(data.suspendedPelanggan ?? data.suspended_customers),
      customerGrowth: Array.isArray(data.customerGrowth)
        ? (data.customerGrowth as CustomerAnalytics['customerGrowth'])
        : mapArray(data.customer_growth, (item) => ({
            month: getString(item.month),
            year: getNumber(item.year),
            newPelanggan: getNumber(item.newPelanggan ?? item.new_customers),
            totalPelanggan: getNumber(item.totalPelanggan ?? item.total_customers),
          })),
      statusDistribution: Array.isArray(data.statusDistribution)
        ? (data.statusDistribution as CustomerAnalytics['statusDistribution'])
        : mapArray(data.status_distribution, (item) => ({
            status: getString(item.status, '-'),
            count: getNumber(item.count),
            percentage: getNumber(item.percentage),
          })),
      topPelanggan: Array.isArray(data.topPelanggan)
        ? (data.topPelanggan as CustomerAnalytics['topPelanggan'])
        : mapArray(data.top_customers, (item, index) => ({
            customerId: getNumber(item.customerId ?? item.customer_id, index),
            customerName: getString(item.customerName ?? item.customer_name, '-'),
            totalPemakaian: getNumber(item.totalPemakaian ?? item.total_usage_m3),
            totalRevenue: getNumber(item.totalRevenue ?? item.total_revenue),
            rank: getNumber(item.rank, index + 1),
          })),
    };
  }

  private normalizeUsageReport(raw: unknown): PemakaianReport {
    const data = asRecord(raw);

    return {
      totalPemakaian: getNumber(data.totalPemakaian ?? data.total_usage ?? data.total_usage_m3),
      averagePemakaian: getNumber(data.averagePemakaian ?? data.average_usage ?? data.average_usage_m3),
      usageTrends: Array.isArray(data.usageTrends)
        ? (data.usageTrends as PemakaianReport['usageTrends'])
        : mapArray(data.usage_trends, (item) => ({
            month: getString(item.month),
            year: getNumber(item.year),
            totalPemakaian: getNumber(item.totalPemakaian ?? item.total_usage),
            averagePemakaian: getNumber(item.averagePemakaian ?? item.average_usage),
            customerCount: getNumber(item.customerCount ?? item.customer_count),
          })),
      highConsumers: Array.isArray(data.highConsumers)
        ? (data.highConsumers as PemakaianReport['highConsumers'])
        : mapArray(data.high_consumers, (item, index) => ({
            customerId: getNumber(item.customerId ?? item.customer_id, index),
            customerName: getString(item.customerName ?? item.customer_name, '-'),
            meterNumber: getString(item.meterNumber ?? item.meter_number, '-'),
            usage: getNumber(item.usage),
            month: getString(item.month),
            year: getNumber(item.year),
          })),
    };
  }

  async getPaymentReport(filters?: ReportFilters): Promise<PaymentReport> {
    const response = await apiClient.get(
      API_ENDPOINTS.REPORTS.PAYMENTS,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizePaymentReport(response);
  }

  async getCustomerAnalytics(filters?: ReportFilters): Promise<CustomerAnalytics> {
    const response = await apiClient.get(
      API_ENDPOINTS.REPORTS.CUSTOMERS,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizeCustomerAnalytics(response);
  }

  async getPemakaianReport(filters?: ReportFilters): Promise<PemakaianReport> {
    const response = await apiClient.get(
      API_ENDPOINTS.REPORTS.USAGE,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizeUsageReport(response);
  }

  async getOutstandingReport(filters?: ReportFilters): Promise<OutstandingReportData> {
    const response = await apiClient.get(
      API_ENDPOINTS.REPORTS.OUTSTANDING,
      { params: this.serializeFilters(filters) }
    );
    const data = asRecord(response);

    return {
      totalOutstanding: getNumber(data.totalOutstanding ?? data.total_outstanding),
      totalPelanggan: getNumber(data.totalPelanggan ?? data.total_pelanggan ?? data.total_customers),
      overdueCount: getNumber(data.overdueCount ?? data.overdue_count ?? data.unpaid_count),
      agingBuckets: mapArray(data.agingBuckets ?? data.aging_buckets, (item) => ({
        range: getString(item.range),
        count: getNumber(item.count),
        amount: getNumber(item.amount),
        percentage: getNumber(item.percentage),
      })),
      outstandingTagihan: mapArray(
        data.outstandingTagihan ?? data.outstanding_tagihan ?? data.outstanding_invoices,
        (item) => ({
          customerId: getNumber(item.customerId ?? item.customer_id),
          customerName: getString(item.customerName ?? item.customer_name),
          invoiceNumber: getString(item.invoiceNumber ?? item.invoice_number),
          invoiceDate: getString(item.invoiceDate ?? item.invoice_date ?? item.created_at),
          dueDate: getString(item.dueDate ?? item.due_date),
          amount: getNumber(item.amount ?? item.outstanding),
          daysOverdue: getNumber(item.daysOverdue ?? item.days_overdue),
        })
      ),
      unpaid_count: getNumber(data.unpaid_count, getNumber(data.overdue_count)),
      total_outstanding: getNumber(data.total_outstanding, getNumber(data.totalOutstanding)),
      oldest_invoices: mapArray(data.oldest_invoices, (item) => ({
        invoice_id: getString(item.invoice_id),
        customer_id: getString(item.customer_id),
        total_amount: getNumber(item.total_amount),
        outstanding: getNumber(item.outstanding),
        created_at: getString(item.created_at),
      })),
    };
  }

  async exportReport(reportType: string, options: ExportOptions): Promise<Blob> {
    const response = await apiClient.post(
      `${API_ENDPOINTS.REPORTS.EXPORT}/${reportType}`,
      options,
      { responseType: 'blob' }
    );
    return response;
  }

  // Helper method to download exported file
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const reportService = new ReportService();
