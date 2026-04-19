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
  async getRevenueReport(filters?: ReportFilters): Promise<RevenueReport> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.REVENUE,
      { params: filters }
    );
    return response.data || response;
  }

  async getPaymentReport(filters?: ReportFilters): Promise<PaymentReport> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.PAYMENTS,
      { params: filters }
    );
    return response.data || response;
  }

  async getCustomerAnalytics(filters?: ReportFilters): Promise<CustomerAnalytics> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.CUSTOMERS,
      { params: filters }
    );
    return response.data || response;
  }

  async getPemakaianReport(filters?: ReportFilters): Promise<PemakaianReport> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.REPORTS.USAGE,
      { params: filters }
    );
    return response.data || response;
  }

  async getOutstandingReport(filters?: ReportFilters): Promise<any> {
    const response = await apiClient.get(
      API_ENDPOINTS.REPORTS.OUTSTANDING,
      { params: filters }
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
