export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  periodStartDate: string;
  periodEndDate: string;
  billingPeriod: string;
  usage: number;
  amount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
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
  paymentHistory: Payment[];
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