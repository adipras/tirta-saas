import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import type {
  RevenueReport,
  PaymentReport,
  CustomerAnalytics,
  PemakaianReport,
  ReportFilters,
  ExportOptions,
} from '../types/report';

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

  private normalizeRevenueReport(raw: any, filters?: ReportFilters): RevenueReport {
    const period = raw?.period || {};

    return {
      totalRevenue: Number(raw?.totalRevenue ?? raw?.total_revenue ?? 0),
      monthlyRevenue: Array.isArray(raw?.monthlyRevenue)
        ? raw.monthlyRevenue
        : Array.isArray(raw?.monthly_revenue)
          ? raw.monthly_revenue.map((item: any) => ({
              month: item.month,
              year: Number(item.year ?? 0),
              revenue: Number(item.revenue ?? 0),
              invoices: Number(item.invoices ?? 0),
            }))
          : [],
      revenueBySubscriptionType: Array.isArray(raw?.revenueBySubscriptionType)
        ? raw.revenueBySubscriptionType
        : Array.isArray(raw?.revenue_by_subscription_type)
          ? raw.revenue_by_subscription_type.map((item: any) => ({
              subscriptionType: item.subscriptionType ?? item.subscription_type ?? 'Tanpa Tipe',
              revenue: Number(item.revenue ?? 0),
              percentage: Number(item.percentage ?? 0),
            }))
          : [],
      period: {
        startDate:
          period.startDate ??
          period.start_date ??
          period.start ??
          filters?.startDate ??
          '',
        endDate:
          period.endDate ??
          period.end_date ??
          period.end ??
          filters?.endDate ??
          '',
      },
    };
  }

  async getRevenueReport(filters?: ReportFilters): Promise<RevenueReport> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.REVENUE,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizeRevenueReport(response, filters);
  }

  private normalizePaymentReport(raw: any): PaymentReport {
    return {
      totalCollected: Number(raw?.totalCollected ?? raw?.total_collected ?? raw?.total_amount ?? 0),
      totalOutstanding: Number(raw?.totalOutstanding ?? raw?.total_outstanding ?? 0),
      paymentMethodBreakdown: Array.isArray(raw?.paymentMethodBreakdown)
        ? raw.paymentMethodBreakdown
        : Array.isArray(raw?.payment_method_breakdown)
          ? raw.payment_method_breakdown.map((item: any) => ({
              method: item.method ?? 'Tanpa Metode',
              amount: Number(item.amount ?? 0),
              count: Number(item.count ?? 0),
              percentage: Number(item.percentage ?? 0),
            }))
          : [],
      dailyCollection: Array.isArray(raw?.dailyCollection)
        ? raw.dailyCollection
        : Array.isArray(raw?.daily_collection)
          ? raw.daily_collection.map((item: any) => ({
              date: item.date,
              amount: Number(item.amount ?? item.total ?? 0),
              count: Number(item.count ?? 0),
            }))
          : Array.isArray(raw?.daily_trends)
            ? raw.daily_trends.map((item: any) => ({
                date: item.date,
                amount: Number(item.amount ?? item.total ?? 0),
                count: Number(item.count ?? 0),
              }))
            : [],
      outstandingPembayaran: Array.isArray(raw?.outstandingPembayaran)
        ? raw.outstandingPembayaran
        : Array.isArray(raw?.outstanding_payments)
          ? raw.outstanding_payments.map((item: any) => ({
              customerId: item.customerId ?? item.customer_id ?? '',
              customerName: item.customerName ?? item.customer_name ?? '-',
              invoiceNumber: item.invoiceNumber ?? item.invoice_number ?? '-',
              amount: Number(item.amount ?? 0),
              dueDate: item.dueDate ?? item.due_date ?? '',
              daysOverdue: Number(item.daysOverdue ?? item.days_overdue ?? 0),
            }))
          : [],
    };
  }

  private normalizeCustomerAnalytics(raw: any): CustomerAnalytics {
    return {
      totalPelanggan: Number(raw?.totalPelanggan ?? raw?.total_customers ?? 0),
      activePelanggan: Number(raw?.activePelanggan ?? raw?.active_customers ?? 0),
      inactivePelanggan: Number(raw?.inactivePelanggan ?? raw?.inactive_customers ?? 0),
      suspendedPelanggan: Number(raw?.suspendedPelanggan ?? raw?.suspended_customers ?? 0),
      customerGrowth: Array.isArray(raw?.customerGrowth)
        ? raw.customerGrowth
        : Array.isArray(raw?.customer_growth)
          ? raw.customer_growth.map((item: any) => ({
              month: item.month,
              year: Number(item.year ?? 0),
              newPelanggan: Number(item.newPelanggan ?? item.new_customers ?? 0),
              totalPelanggan: Number(item.totalPelanggan ?? item.total_customers ?? 0),
            }))
          : [],
      statusDistribution: Array.isArray(raw?.statusDistribution)
        ? raw.statusDistribution
        : Array.isArray(raw?.status_distribution)
          ? raw.status_distribution.map((item: any) => ({
              status: item.status ?? '-',
              count: Number(item.count ?? 0),
              percentage: Number(item.percentage ?? 0),
            }))
          : [],
      topPelanggan: Array.isArray(raw?.topPelanggan)
        ? raw.topPelanggan
        : Array.isArray(raw?.top_customers)
          ? raw.top_customers.map((item: any, index: number) => ({
              customerId: item.customerId ?? item.customer_id ?? index,
              customerName: item.customerName ?? item.customer_name ?? '-',
              totalPemakaian: Number(item.totalPemakaian ?? item.total_usage_m3 ?? 0),
              totalRevenue: Number(item.totalRevenue ?? item.total_revenue ?? 0),
              rank: Number(item.rank ?? index + 1),
            }))
          : [],
    };
  }

  private normalizeUsageReport(raw: any): PemakaianReport {
    return {
      totalPemakaian: Number(raw?.totalPemakaian ?? raw?.total_usage ?? raw?.total_usage_m3 ?? 0),
      averagePemakaian: Number(raw?.averagePemakaian ?? raw?.average_usage ?? raw?.average_usage_m3 ?? 0),
      usageTrends: Array.isArray(raw?.usageTrends)
        ? raw.usageTrends
        : Array.isArray(raw?.usage_trends)
          ? raw.usage_trends.map((item: any) => ({
              month: item.month,
              year: Number(item.year ?? 0),
              totalPemakaian: Number(item.totalPemakaian ?? item.total_usage ?? 0),
              averagePemakaian: Number(item.averagePemakaian ?? item.average_usage ?? 0),
              customerCount: Number(item.customerCount ?? item.customer_count ?? 0),
            }))
          : [],
      highConsumers: Array.isArray(raw?.highConsumers)
        ? raw.highConsumers
        : Array.isArray(raw?.high_consumers)
          ? raw.high_consumers.map((item: any, index: number) => ({
              customerId: item.customerId ?? item.customer_id ?? index,
              customerName: item.customerName ?? item.customer_name ?? '-',
              meterNumber: item.meterNumber ?? item.meter_number ?? '-',
              usage: Number(item.usage ?? 0),
              month: item.month,
              year: Number(item.year ?? 0),
            }))
          : [],
    };
  }

  async getPaymentReport(filters?: ReportFilters): Promise<PaymentReport> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.PAYMENTS,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizePaymentReport(response);
  }

  async getCustomerAnalytics(filters?: ReportFilters): Promise<CustomerAnalytics> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.CUSTOMERS,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizeCustomerAnalytics(response);
  }

  async getPemakaianReport(filters?: ReportFilters): Promise<PemakaianReport> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.USAGE,
      { params: this.serializeFilters(filters) }
    );
    return this.normalizeUsageReport(response);
  }

  async getOutstandingReport(filters?: ReportFilters): Promise<any> {
    const response = await apiClient.get(
      API_ENDPOINTS.REPORTS.OUTSTANDING,
      { params: this.serializeFilters(filters) }
    );
    return response.data || response;
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
