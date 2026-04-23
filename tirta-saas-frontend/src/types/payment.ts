export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'e_wallet' | 'other';

export const PaymentMethod = {
  CASH: 'cash' as PaymentMethod,
  BANK_TRANSFER: 'bank_transfer' as PaymentMethod,
  CARD: 'card' as PaymentMethod,
  E_WALLET: 'e_wallet' as PaymentMethod,
  OTHER: 'other' as PaymentMethod,
};

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'voided';

export const PaymentStatus = {
  PENDING: 'pending' as PaymentStatus,
  COMPLETED: 'completed' as PaymentStatus,
  FAILED: 'failed' as PaymentStatus,
  VOIDED: 'voided' as PaymentStatus,
};

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName?: string;
  invoiceNumber?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  tenantInfo?: {
    companyName?: string;
    phone?: string;
    logoUrl?: string;
    footerText?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNo?: string;
    qrisImageUrl?: string;
  };
  usageDetails?: {
    usageMonth?: string;
    usageM3?: number;
  };
  payment: Payment;
  invoiceDetails: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    invoiceType?: 'monthly' | 'registration';
    subTotal?: number;
    penaltyAmount?: number;
    totalAmount: number;
    totalPaidBefore?: number;
    totalPaidAfter?: number;
    remainingAmount?: number;
    paymentCoverageType?: 'full' | 'partial';
    invoicePaymentStatus?: 'paid' | 'partial' | 'unpaid';
  };
  customerDetails: {
    name: string;
    address?: string;
    phone?: string;
    meterNumber?: string;
  };
  generatedAt: string;
}

export interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  usageMonth?: string;
}

export const PAYMENT_METHOD_LABELS = {
  cash: 'Tunai',
  bank_transfer: 'Transfer Bank',
  card: 'Kartu',
  e_wallet: 'Dompet Digital',
  qris: 'QRIS',
  other: 'Lainnya',
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: 'Menunggu',
  completed: 'Selesai',
  failed: 'Gagal',
  voided: 'Dibatalkan',
} as const;
