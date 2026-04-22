import type { PaymentReceipt } from './payment';

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

const buildReceiptPayload = (payload: ThermalReceiptPayloadInput): ThermalReceiptPayload => ({
  ...payload,
  type: payload.type ?? 'receipt',
});

export const buildThermalReceiptPayload = (receipt: PaymentReceipt): ThermalReceiptPayload => {
  const isPartialPayment = receipt.invoiceDetails.paymentCoverageType === 'partial';
  const compactAddress = truncateLine(receipt.customerDetails.address, 40);
  const compactNotes = truncateLine(receipt.payment.notes, 40);

  return buildReceiptPayload({
    receiptNumber: receipt.receiptNumber,
    printedAt: receipt.generatedAt,
    settlementType: isPartialPayment ? 'partial' : 'full',
    merchant: {
      name: 'TIRTA SAAS',
      subtitle: 'Tagihan Air',
      addressLines: [],
    },
    customer: {
      name: receipt.customerDetails.name,
      address: compactAddress,
      phone: receipt.customerDetails.phone,
      meterNumber: receipt.customerDetails.meterNumber,
    },
    payment: {
      date: receipt.payment.paymentDate,
      method: receipt.payment.paymentMethod,
      referenceNumber: receipt.payment.referenceNumber,
      status: receipt.payment.status,
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
      ...(receipt.invoiceDetails.subTotal
        ? [{ label: 'Subtotal', value: String(receipt.invoiceDetails.subTotal) }]
        : []),
      ...(receipt.invoiceDetails.penaltyAmount
        ? [{ label: 'Denda', value: String(receipt.invoiceDetails.penaltyAmount), emphasis: 'warning' as const }]
        : []),
      { label: 'Terbayar', value: String(receipt.invoiceDetails.totalPaidBefore || 0) },
      { label: 'Bayar', value: String(receipt.payment.amount), emphasis: 'success' },
      { label: 'Total Bayar', value: String(receipt.invoiceDetails.totalPaidAfter || 0) },
      {
        label: 'Sisa',
        value: String(receipt.invoiceDetails.remainingAmount || 0),
        emphasis: isPartialPayment ? 'warning' : 'success',
      },
    ],
    footerLines: [
      'Terima kasih.',
      ...(isPartialPayment
        ? ['Pembayaran parsial, masih ada sisa tagihan.']
        : ['Tagihan lunas.']),
      `Cetak: ${new Date(receipt.generatedAt).toLocaleString('id-ID')}`,
    ],
  });
};
