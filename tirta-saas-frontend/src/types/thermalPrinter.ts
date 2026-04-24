import type { PaymentReceipt } from './payment';
import { PAYMENT_STATUS_LABELS } from './payment';
import { buildPaymentReceiptViewModel } from '../utils/paymentReceipt';

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
  printedAtLabel?: string;
  invoiceTypeLabel?: string;
  settlementType: 'full' | 'partial';
  footerText?: string;
  logoUrl?: string;
  logoDataUrl?: string;
  qrisImageUrl?: string;
  qrisImageDataUrl?: string;
  qrisLabel?: string;
  invoiceType?: 'monthly' | 'registration' | 'manual';
  invoiceStatus?: 'paid' | 'partial' | 'unpaid';
  invoiceStatusLabel?: string;
  usageDetails?: {
    month?: string;
    usageM3?: number;
    subTotal?: number;
  };
  manualItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
  }>;
  bankInfo?: {
    bankName?: string;
    bankAccountName?: string;
    bankAccountNo?: string;
  };
  printNotes?: string;
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
    dateLabel?: string;
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

const buildReceiptPayload = (payload: ThermalReceiptPayloadInput): ThermalReceiptPayload => ({
  ...payload,
  type: payload.type ?? 'receipt',
});

const fetchAssetAsDataUrl = async (assetUrl?: string): Promise<string | undefined> => {
  if (!assetUrl) {
    return undefined;
  }

  try {
    const response = await fetch(assetUrl, {
      mode: 'cors',
      cache: 'no-store',
      credentials: 'include',
    });

    if (!response.ok) {
      return undefined;
    }

    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('Gagal membaca asset gambar'));
      };
      reader.onerror = () => reject(reader.error || new Error('Gagal membaca asset gambar'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
};

export const buildThermalReceiptPayload = async (receipt: PaymentReceipt): Promise<ThermalReceiptPayload> => {
  const receiptView = buildPaymentReceiptViewModel(receipt);
  const [logoDataUrl, qrisImageDataUrl] = await Promise.all([
    fetchAssetAsDataUrl(receiptView.tenantLogoUrl),
    fetchAssetAsDataUrl(receiptView.qrisImageUrl),
  ]);
  const usageDetails = receiptView.showUsageSection
    ? {
        month: receiptView.usageMonthLabel,
        usageM3: receiptView.usageM3,
        subTotal: receipt.invoiceDetails.subTotal,
      }
    : undefined;
  const manualItems =
    receipt.invoiceDetails.invoiceType === 'manual' && receipt.invoiceDetails.items
      ? receipt.invoiceDetails.items
      : undefined;

  const bankInfo =
    receiptView.bankName || receiptView.bankAccountNo || receiptView.bankAccountName
      ? {
          bankName: receiptView.bankName,
          bankAccountName: receiptView.bankAccountName,
          bankAccountNo: receiptView.bankAccountNo,
        }
      : undefined;

  return buildReceiptPayload({
    type: 'payment_receipt',
    receiptNumber: receipt.receiptNumber,
    printedAt: receipt.generatedAt,
    printedAtLabel: receiptView.printedAtLabel,
    invoiceTypeLabel: receiptView.invoiceTypeLabel,
    settlementType: receiptView.isPartialPayment ? 'partial' : 'full',
    footerText: receiptView.footerText,
    logoUrl: receiptView.tenantLogoUrl,
    logoDataUrl,
    qrisImageUrl: receiptView.qrisImageUrl,
    qrisImageDataUrl,
    qrisLabel: receiptView.qrisLabel,
    invoiceType: receipt.invoiceDetails.invoiceType ?? undefined,
    invoiceStatus: receipt.invoiceDetails.invoicePaymentStatus,
    invoiceStatusLabel: receiptView.invoiceStatusLabel,
    usageDetails,
    manualItems,
    bankInfo,
    printNotes: receiptView.compactNotes,
    merchant: {
      name: receiptView.tenantName,
      addressLines: receiptView.merchantAddressLines,
    },
    customer: {
      name: receipt.customerDetails.name,
      address: receiptView.compactAddress,
      meterNumber: receipt.customerDetails.meterNumber,
    },
    payment: {
      date: receipt.payment.paymentDate,
      dateLabel: receiptView.paymentDateLabel,
      method: receiptView.paymentMethodLabel,
      referenceNumber: receipt.payment.referenceNumber,
      status: PAYMENT_STATUS_LABELS[receipt.payment.status] || receipt.payment.status,
      amount: receipt.payment.amount,
      notes: receiptView.compactNotes,
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
    summaryLines: receiptView.summaryLines,
    footerLines: [],
  });
};
