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
  outstandingPayments: OutstandingPayment[];
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

// Customer Analytics Types
export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  suspendedCustomers: number;
  customerGrowth: CustomerGrowth[];
  statusDistribution: StatusDistribution[];
  topCustomers: TopCustomer[];
}

export interface CustomerGrowth {
  month: string;
  year: number;
  newCustomers: number;
  totalCustomers: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  totalUsage: number;
  totalRevenue: number;
  rank: number;
}

// Usage Report Types
export interface UsageReport {
  totalUsage: number;
  averageUsage: number;
  usageTrends: UsageTrend[];
  highConsumers: HighConsumer[];
}

export interface UsageTrend {
  month: string;
  year: number;
  totalUsage: number;
  averageUsage: number;
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
