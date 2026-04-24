import type { PaymentReceipt } from './payment';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from './payment';
import { API_ORIGIN } from '../constants/api';

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
  footerText?: string;
  logoUrl?: string;
  qrisImageUrl?: string;
  invoiceType?: 'monthly' | 'registration';
  invoiceStatus?: 'paid' | 'partial' | 'unpaid';
  usageDetails?: {
    month?: string;
    usageM3?: number;
    subTotal?: number;
  };
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

const resolveAssetUrl = (path?: string) => {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return path.startsWith('/') ? `${API_ORIGIN}${path}` : `${API_ORIGIN}/${path}`;
};

const buildReceiptPayload = (payload: ThermalReceiptPayloadInput): ThermalReceiptPayload => ({
  ...payload,
  type: payload.type ?? 'receipt',
});

export const buildThermalReceiptPayload = (receipt: PaymentReceipt): ThermalReceiptPayload => {
  const isPartialPayment = receipt.invoiceDetails.paymentCoverageType === 'partial';
  const compactAddress = truncateLine(receipt.customerDetails.address, 90);
  const compactNotes = truncateLine(receipt.payment.notes, 120);
  const tenantInfo = receipt.tenantInfo;
  const invoiceType = receipt.invoiceDetails.invoiceType;
  const usageM3 = receipt.usageDetails?.usageM3;
  const footerText = tenantInfo?.footerText || 'Terima kasih telah membayar tagihan air Anda.';

  const merchantAddressLines: string[] = [];
  if (tenantInfo?.phone) {
    merchantAddressLines.push(`Telp: ${tenantInfo.phone}`);
  }

  // Usage block follows the preview: only render when there is actual usage.
  const usageDetails = usageM3 != null && usageM3 > 0 && receipt.usageDetails
    ? {
        month: receipt.usageDetails.usageMonth
          ? new Date(`${receipt.usageDetails.usageMonth}-01`).toLocaleDateString('id-ID', {
              month: 'long',
              year: 'numeric',
            })
          : undefined,
        usageM3,
        subTotal: receipt.invoiceDetails.subTotal,
      }
    : undefined;

  // Bank info (only if present)
  const bankInfo =
    tenantInfo?.bankName || tenantInfo?.bankAccountNo
      ? {
          bankName: tenantInfo?.bankName,
          bankAccountName: tenantInfo?.bankAccountName,
          bankAccountNo: tenantInfo?.bankAccountNo,
        }
      : undefined;

  const paymentMethodLabel =
    PAYMENT_METHOD_LABELS[receipt.payment.paymentMethod] || receipt.payment.paymentMethod;

  return buildReceiptPayload({
    type: 'payment_receipt',
    receiptNumber: receipt.receiptNumber,
    printedAt: receipt.generatedAt,
    settlementType: isPartialPayment ? 'partial' : 'full',
    footerText,
    logoUrl: resolveAssetUrl(tenantInfo?.logoUrl),
    qrisImageUrl: resolveAssetUrl(tenantInfo?.qrisImageUrl),
    invoiceType: invoiceType ?? undefined,
    invoiceStatus: receipt.invoiceDetails.invoicePaymentStatus,
    usageDetails,
    bankInfo,
    printNotes: compactNotes,
    merchant: {
      name: tenantInfo?.companyName || 'TIRTA SAAS',
      addressLines: merchantAddressLines,
    },
    customer: {
      name: receipt.customerDetails.name,
      address: compactAddress,
      meterNumber: receipt.customerDetails.meterNumber,
    },
    payment: {
      date: receipt.payment.paymentDate,
      method: paymentMethodLabel,
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
    // Financial summary only (usage handled via usageDetails section)
    summaryLines: [
      ...((receipt.invoiceDetails.subTotal || 0) > 0
        ? [{ label: 'Subtotal', value: formatCompactCurrency(receipt.invoiceDetails.subTotal) }]
        : []),
      ...(receipt.invoiceDetails.penaltyAmount
        ? [
            {
              label: 'Denda',
              value: formatCompactCurrency(receipt.invoiceDetails.penaltyAmount),
              emphasis: 'warning' as const,
            },
          ]
        : []),
      {
        label: 'Total',
        value: formatCompactCurrency(receipt.invoiceDetails.totalAmount),
        emphasis: 'strong' as const,
      },
      ...((receipt.invoiceDetails.totalPaidBefore || 0) > 0
        ? [
            {
              label: 'Terbayar',
              value: formatCompactCurrency(receipt.invoiceDetails.totalPaidBefore),
            },
          ]
        : []),
      {
        label: `Bayar (${paymentMethodLabel})`,
        value: formatCompactCurrency(receipt.payment.amount),
        emphasis: 'success' as const,
      },
      {
        label: 'Sisa',
        value: formatCompactCurrency(receipt.invoiceDetails.remainingAmount || 0),
        emphasis: isPartialPayment ? ('warning' as const) : ('success' as const),
      },
    ],
    footerLines: [],
  });
};
