export interface Invoice {
  id: string;
  invoiceNumber: string;
  type?: 'monthly' | 'registration' | 'manual';
  customerId: string;
  customerName: string;
  meter_id?: string;
  meterNumber?: string;
  meterStart?: number;
  meterEnd?: number;
  periodStartDate: string;
  periodEndDate: string;
  billingPeriod: string;
  usage: number;
  amount: number;
  subscriptionFee?: number;
  pricePerM3?: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  penaltyAmount?: number;
  penaltyDays?: number;
  storedPenaltyAmount?: number;
  storedTotalAmount?: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  issueDate: string;
  dueDate: string;
  createdAt: string;
  customer?: {
    customerId: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    meterNumber?: string;
  };
  items?: InvoiceItem[];
  payments?: PaymentHistory[];
  subtotal?: number;
  taxAmount?: number;
  taxPercentage?: number;
  notes?: string;
}

export interface InvoiceDetails extends Invoice {
  items: InvoiceItem[];
  paymentHistory: PaymentHistory[];
}

export interface InvoiceListStats {
  totalInvoices: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  overdueCount: number;
  openCount: number;
  totalAmount: number;
  outstandingAmount: number;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number | string;
  unitPrice: number;
  amount: number;
  total?: number;
}

export interface PaymentHistory {
  id?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  method?: string;
  referenceNumber?: string;
}

export interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  method: string;
}
