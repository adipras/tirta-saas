import type { PaymentReceipt } from './payment';

export type ThermalPrintJobType = 'payment_receipt';

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
}

export interface AndroidThermalPrinterBridge {
  isAvailable?: () => boolean;
  printReceipt?: (payloadJson: string) => void | string | Promise<string | void>;
  scanPrinters?: () => string | ThermalPrinterDevice[] | Promise<string | ThermalPrinterDevice[]>;
  connectPrinter?: (deviceId: string) => string | void | Promise<string | void>;
  getStatus?: () => string | ThermalPrinterStatus | Promise<string | ThermalPrinterStatus>;
}

declare global {
  interface Window {
    AndroidPrinterBridge?: AndroidThermalPrinterBridge;
  }
}

export const buildThermalReceiptPayload = (receipt: PaymentReceipt): ThermalReceiptPayload => {
  const isPartialPayment = receipt.invoiceDetails.paymentCoverageType === 'partial';

  return {
    type: 'payment_receipt',
    receiptNumber: receipt.receiptNumber,
    printedAt: receipt.generatedAt,
    settlementType: isPartialPayment ? 'partial' : 'full',
    merchant: {
      name: 'TIRTA SAAS',
      subtitle: 'Sistem Manajemen Tagihan Air',
      addressLines: [
        'Jl. Contoh No. 123, Kota ABC 12345',
        'Telepon: (021) 1234-5678',
        'Email: info@tirtasaas.com',
      ],
    },
    customer: {
      name: receipt.customerDetails.name,
      address: receipt.customerDetails.address,
      phone: receipt.customerDetails.phone,
      meterNumber: receipt.customerDetails.meterNumber,
    },
    payment: {
      date: receipt.payment.paymentDate,
      method: receipt.payment.paymentMethod,
      referenceNumber: receipt.payment.referenceNumber,
      status: receipt.payment.status,
      amount: receipt.payment.amount,
      notes: receipt.payment.notes,
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
        ? [{ label: 'Subtotal Tagihan', value: String(receipt.invoiceDetails.subTotal) }]
        : []),
      ...(receipt.invoiceDetails.penaltyAmount
        ? [{ label: 'Denda Saat Dibayar', value: String(receipt.invoiceDetails.penaltyAmount), emphasis: 'warning' as const }]
        : []),
      { label: 'Sudah Dibayar Sebelumnya', value: String(receipt.invoiceDetails.totalPaidBefore || 0) },
      { label: 'Nominal Dibayar', value: String(receipt.payment.amount), emphasis: 'success' },
      { label: 'Total Dibayar Setelah Transaksi', value: String(receipt.invoiceDetails.totalPaidAfter || 0) },
      {
        label: 'Sisa Tagihan',
        value: String(receipt.invoiceDetails.remainingAmount || 0),
        emphasis: isPartialPayment ? 'warning' : 'success',
      },
    ],
    footerLines: [
      'Terima kasih atas pembayaran Anda.',
      ...(isPartialPayment
        ? ['Pembayaran ini bersifat parsial. Sisa tagihan masih harus dilunasi.']
        : ['Tagihan telah lunas sesuai transaksi ini.']),
      'Struk ini dibuat secara otomatis dan tidak memerlukan tanda tangan.',
    ],
  };
};
