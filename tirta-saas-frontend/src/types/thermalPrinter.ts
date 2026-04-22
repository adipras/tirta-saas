import type { PaymentReceipt } from './payment';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from './payment';

export type ThermalPrintJobType = 'receipt' | 'payment_receipt';

export interface ThermalReceiptLineItem {
  label: string;
  value: string;
  emphasis?: 'normal' | 'strong' | 'success' | 'warning';
}

export interface ThermalReceiptPayload {
  type: ThermalPrintJobType;
  receiptNumber: string;
  printedAt: string;
  settlementType: 'full' | 'partial';
  merchant: {
    name: string;
    subtitle?: string;
    addressLines: string[];
  };
  customer: {
    name: string;
    address?: string;
    phone?: string;
    meterNumber?: string;
  };
  payment: {
    date: string;
    method: string;
    referenceNumber?: string;
    status: string;
    amount: number;
    notes?: string;
  };
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    subTotal?: number;
    penaltyAmount?: number;
    totalAmount: number;
    totalPaidBefore?: number;
    totalPaidAfter?: number;
    remainingAmount?: number;
    invoicePaymentStatus?: string;
  };
  summaryLines: ThermalReceiptLineItem[];
  footerLines: string[];
}

export interface ThermalReceiptPayloadInput extends Omit<ThermalReceiptPayload, 'type'> {
  type?: ThermalPrintJobType;
}

export interface ThermalPrinterDevice {
  id: string;
  name: string;
  address?: string;
}

export interface ThermalPrinterStatus {
  connected: boolean;
  printerName?: string;
  printerAddress?: string;
  batteryLevel?: number;
  message?: string;
  bridgeAvailable?: boolean;
  bridgeRunning?: boolean;
  preferredPrinterId?: string;
  preferredPrinterName?: string;
  serverUrl?: string;
}

const truncateLine = (value?: string, maxLength: number = 32) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
    : normalized;
};

const formatCompactCurrency = (value?: number) => `Rp ${(value || 0).toLocaleString('id-ID')}`;

const formatCompactDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildReceiptPayload = (payload: ThermalReceiptPayloadInput): ThermalReceiptPayload => ({
  ...payload,
  type: payload.type ?? 'receipt',
});

export const buildThermalReceiptPayload = (receipt: PaymentReceipt): ThermalReceiptPayload => {
  const isPartialPayment = receipt.invoiceDetails.paymentCoverageType === 'partial';
  const compactAddress = truncateLine(receipt.customerDetails.address, 28);
  const compactNotes = truncateLine(receipt.payment.notes, 28);

  return buildReceiptPayload({
    receiptNumber: receipt.receiptNumber,
    printedAt: receipt.generatedAt,
    settlementType: isPartialPayment ? 'partial' : 'full',
    merchant: {
      name: 'TIRTA SAAS',
      subtitle: 'Struk Air',
      addressLines: [],
    },
    customer: {
      name: receipt.customerDetails.name,
      address: compactAddress,
      meterNumber: receipt.customerDetails.meterNumber,
    },
    payment: {
      date: receipt.payment.paymentDate,
      method: PAYMENT_METHOD_LABELS[receipt.payment.paymentMethod] || receipt.payment.paymentMethod,
      referenceNumber: receipt.payment.referenceNumber,
      status: PAYMENT_STATUS_LABELS[receipt.payment.status] || receipt.payment.status,
      amount: receipt.payment.amount,
      notes: compactNotes,
    },
    invoice: {
      invoiceNumber: receipt.invoiceDetails.invoiceNumber,
      invoiceDate: receipt.invoiceDetails.invoiceDate,
      dueDate: receipt.invoiceDetails.dueDate,
      subTotal: receipt.invoiceDetails.subTotal,
      penaltyAmount: receipt.invoiceDetails.penaltyAmount,
      totalAmount: receipt.invoiceDetails.totalAmount,
      totalPaidBefore: receipt.invoiceDetails.totalPaidBefore,
      totalPaidAfter: receipt.invoiceDetails.totalPaidAfter,
      remainingAmount: receipt.invoiceDetails.remainingAmount,
      invoicePaymentStatus: receipt.invoiceDetails.invoicePaymentStatus,
    },
    summaryLines: [
      ...(receipt.invoiceDetails.totalAmount
        ? [{ label: 'Tagihan', value: formatCompactCurrency(receipt.invoiceDetails.totalAmount) }]
        : []),
      ...(receipt.invoiceDetails.penaltyAmount
        ? [{ label: 'Denda', value: formatCompactCurrency(receipt.invoiceDetails.penaltyAmount), emphasis: 'warning' as const }]
        : []),
      ...((receipt.invoiceDetails.totalPaidBefore || 0) > 0
        ? [{ label: 'Terbayar', value: formatCompactCurrency(receipt.invoiceDetails.totalPaidBefore) }]
        : []),
      { label: 'Bayar', value: formatCompactCurrency(receipt.payment.amount), emphasis: 'success' },
      {
        label: 'Sisa',
        value: formatCompactCurrency(receipt.invoiceDetails.remainingAmount || 0),
        emphasis: isPartialPayment ? 'warning' : 'success',
      },
    ],
    footerLines: [
      'Terima kasih.',
      ...(isPartialPayment
        ? ['Parsial, sisa tagihan masih ada.']
        : ['Tagihan lunas.']),
      `Cetak ${formatCompactDateTime(receipt.generatedAt)}`,
    ],
  });
};
