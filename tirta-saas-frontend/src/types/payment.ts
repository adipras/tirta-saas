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
  id: number;
  invoiceId: number;
  customerId: number;
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
  invoiceId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentReceipt {
  id: number;
  paymentId: number;
  receiptNumber: string;
  payment: Payment;
  invoiceDetails: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
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
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  e_wallet: 'E-Wallet',
  other: 'Other',
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  voided: 'Voided',
} as const;
