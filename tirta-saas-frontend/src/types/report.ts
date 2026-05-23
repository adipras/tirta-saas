// Revenue Report Types
export interface RevenueReport {
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
  revenueBySubscriptionType: RevenueByType[];
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  invoices: number;
}

export interface RevenueByType {
  subscriptionType: string;
  revenue: number;
  percentage: number;
}

// Payment Report Types
export interface PaymentReport {
  totalCollected: number;
  totalOutstanding: number;
  paymentMethodBreakdown: PaymentMethodStats[];
  dailyCollection: DailyCollection[];
  outstandingPembayaran: OutstandingPayment[];
}

export interface PaymentMethodStats {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface DailyCollection {
  date: string;
  amount: number;
  count: number;
}

export interface OutstandingPayment {
  customerId: number;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

export interface OutstandingReportInvoice {
  customerId: number;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
}

export interface OutstandingReportAgingBucket {
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface OutstandingReportOldestInvoice {
  invoice_id: string;
  customer_id: string;
  total_amount: number;
  outstanding: number;
  created_at: string;
}

export interface OutstandingReportData {
  totalOutstanding: number;
  totalPelanggan: number;
  overdueCount: number;
  agingBuckets: OutstandingReportAgingBucket[];
  outstandingTagihan: OutstandingReportInvoice[];
  unpaid_count?: number;
  total_outstanding?: number;
  oldest_invoices?: OutstandingReportOldestInvoice[];
}

// Customer Analytics Types
export interface CustomerAnalytics {
  totalPelanggan: number;
  activePelanggan: number;
  inactivePelanggan: number;
  suspendedPelanggan: number;
  customerGrowth: CustomerGrowth[];
  statusDistribution: StatusDistribution[];
  topPelanggan: TopCustomer[];
}

export interface CustomerGrowth {
  month: string;
  year: number;
  newPelanggan: number;
  totalPelanggan: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  totalPemakaian: number;
  totalRevenue: number;
  rank: number;
}

// Pemakaian Report Types
export interface PemakaianReport {
  totalPemakaian: number;
  averagePemakaian: number;
  usageTrends: PemakaianTrend[];
  highConsumers: HighConsumer[];
}

export interface PemakaianTrend {
  month: string;
  year: number;
  totalPemakaian: number;
  averagePemakaian: number;
  customerCount: number;
}

export interface HighConsumer {
  customerId: number;
  customerName: string;
  meterNumber: string;
  usage: number;
  month: string;
  year: number;
}

// Report Filter Types
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  subscriptionTypeId?: number;
  status?: string;
}

// Export Types
export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filters?: ReportFilters;
  includeCharts?: boolean;
}
