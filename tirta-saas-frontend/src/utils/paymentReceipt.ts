import { resolveTenantAssetUrl } from '../services/tenantSettingsService';
import type { PaymentReceipt } from '../types/payment';
import { PAYMENT_METHOD_LABELS } from '../types/payment';

export type PaymentReceiptSummaryEmphasis = 'normal' | 'strong' | 'success' | 'warning';
export type PaymentReceiptStatusTone = 'paid' | 'partial' | 'unpaid';

export interface PaymentReceiptSummaryLine {
  label: string;
  value: string;
  emphasis?: PaymentReceiptSummaryEmphasis;
}

export interface PaymentReceiptViewModel {
  receiptNumber: string;
  invoiceTypeLabel?: string;
  tenantName: string;
  tenantPhone?: string;
  tenantLogoUrl?: string;
  footerText: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  qrisImageUrl?: string;
  qrisLabel: string;
  hasBankInfo: boolean;
  compactAddress?: string;
  compactNotes?: string;
  paymentMethodLabel: string;
  paymentDateLabel: string;
  printedAtLabel: string;
  invoiceStatusLabel: string;
  invoiceStatusTone: PaymentReceiptStatusTone;
  invoiceStatusColorClass: string;
  invoiceStatusTextColorClass: string;
  isPartialPayment: boolean;
  usageMonthLabel?: string;
  usageM3?: number;
  showUsageSection: boolean;
  merchantAddressLines: string[];
  showSubTotal: boolean;
  subTotalLabel: string;
  showPenaltyAmount: boolean;
  penaltyAmountLabel: string;
  totalAmountLabel: string;
  showTotalPaidBefore: boolean;
  totalPaidBeforeLabel: string;
  paymentAmountLabel: string;
  remainingAmountLabel: string;
  remainingAmountColorClass: string;
  summaryLines: PaymentReceiptSummaryLine[];
}

export const formatPaymentReceiptDateTime = (value?: string): string => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('id-ID');
};

export const formatPaymentReceiptCurrency = (value?: number): string =>
  `Rp ${(value || 0).toLocaleString('id-ID')}`;

export const truncatePaymentReceiptText = (
  value?: string,
  maxLength: number = 120,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trimEnd()}...`
    : normalized;
};

export const buildPaymentReceiptViewModel = (receipt: PaymentReceipt): PaymentReceiptViewModel => {
  const isPartialPayment = receipt.invoiceDetails.paymentCoverageType === 'partial';
  const compactAddress = truncatePaymentReceiptText(receipt.customerDetails.address, 90);
  const compactNotes = truncatePaymentReceiptText(receipt.payment.notes, 120);
  const paymentMethodLabel =
    (PAYMENT_METHOD_LABELS as Record<string, string>)[receipt.payment.paymentMethod] ||
    receipt.payment.paymentMethod;

  const invoiceStatusTone: PaymentReceiptStatusTone =
    receipt.invoiceDetails.invoicePaymentStatus === 'paid'
      ? 'paid'
      : receipt.invoiceDetails.invoicePaymentStatus === 'partial'
        ? 'partial'
        : 'unpaid';

  const invoiceStatusLabel =
    invoiceStatusTone === 'paid'
      ? 'Lunas'
      : 'Belum Lunas';
  const invoiceTypeLabel =
    receipt.invoiceDetails.invoiceType === 'registration'
      ? 'Biaya Registrasi'
      : receipt.invoiceDetails.invoiceType === 'monthly'
        ? 'Biaya Air Bulanan'
        : undefined;

  const usageMonthLabel = receipt.usageDetails?.usageMonth
    ? new Date(`${receipt.usageDetails.usageMonth}-01`).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      })
    : undefined;

  const usageM3 = receipt.usageDetails?.usageM3;
  const showUsageSection = usageM3 != null && usageM3 > 0;
  const showSubTotal = (receipt.invoiceDetails.subTotal || 0) > 0;
  const showPenaltyAmount = (receipt.invoiceDetails.penaltyAmount || 0) > 0;
  const showTotalPaidBefore = (receipt.invoiceDetails.totalPaidBefore || 0) > 0;

  const subTotalLabel = formatPaymentReceiptCurrency(receipt.invoiceDetails.subTotal);
  const penaltyAmountLabel = formatPaymentReceiptCurrency(receipt.invoiceDetails.penaltyAmount);
  const totalAmountLabel = formatPaymentReceiptCurrency(receipt.invoiceDetails.totalAmount);
  const totalPaidBeforeLabel = formatPaymentReceiptCurrency(receipt.invoiceDetails.totalPaidBefore);
  const paymentAmountLabel = formatPaymentReceiptCurrency(receipt.payment.amount);
  const remainingAmountLabel = formatPaymentReceiptCurrency(receipt.invoiceDetails.remainingAmount);

  const summaryLines: PaymentReceiptSummaryLine[] = [
    ...(showSubTotal ? [{ label: 'Subtotal', value: subTotalLabel }] : []),
    ...(showPenaltyAmount
      ? [{ label: 'Denda', value: penaltyAmountLabel, emphasis: 'warning' as const }]
      : []),
    { label: 'Total', value: totalAmountLabel, emphasis: 'strong' as const },
    ...(showTotalPaidBefore ? [{ label: 'Terbayar', value: totalPaidBeforeLabel }] : []),
    {
      label: `Bayar (${paymentMethodLabel})`,
      value: paymentAmountLabel,
      emphasis: 'success' as const,
    },
    {
      label: 'Sisa',
      value: remainingAmountLabel,
      emphasis: isPartialPayment ? ('warning' as const) : ('success' as const),
    },
  ];

  const tenantPhone = receipt.tenantInfo?.phone || undefined;
  const merchantAddressLines = tenantPhone ? [`Telp: ${tenantPhone}`] : [];

  const tenantLogoUrl = resolveTenantAssetUrl(receipt.tenantInfo?.logoUrl) || undefined;
  const qrisImageUrl = resolveTenantAssetUrl(receipt.tenantInfo?.qrisImageUrl) || undefined;
  const bankName = receipt.tenantInfo?.bankName || undefined;
  const bankAccountName = receipt.tenantInfo?.bankAccountName || undefined;
  const bankAccountNo = receipt.tenantInfo?.bankAccountNo || undefined;

  return {
    receiptNumber: receipt.receiptNumber,
    invoiceTypeLabel,
    tenantName: receipt.tenantInfo?.companyName || 'TIRTA SAAS',
    tenantPhone,
    tenantLogoUrl,
    footerText: receipt.tenantInfo?.footerText || 'Terima kasih telah membayar tagihan air Anda.',
    bankName,
    bankAccountName,
    bankAccountNo,
    qrisImageUrl,
    qrisLabel: 'QRIS Pembayaran',
    hasBankInfo: Boolean(bankName || bankAccountNo || bankAccountName),
    compactAddress,
    compactNotes,
    paymentMethodLabel,
    paymentDateLabel: formatPaymentReceiptDateTime(receipt.payment.paymentDate),
    printedAtLabel: formatPaymentReceiptDateTime(receipt.generatedAt),
    invoiceStatusLabel,
    invoiceStatusTone,
    invoiceStatusColorClass:
      invoiceStatusTone === 'paid'
        ? 'text-green-600'
        : invoiceStatusTone === 'partial'
          ? 'text-amber-600'
          : 'text-red-600',
    invoiceStatusTextColorClass:
      invoiceStatusTone === 'paid'
        ? 'text-green-700'
        : invoiceStatusTone === 'partial'
          ? 'text-amber-700'
          : 'text-red-700',
    isPartialPayment,
    usageMonthLabel,
    usageM3,
    showUsageSection,
    merchantAddressLines,
    showSubTotal,
    subTotalLabel,
    showPenaltyAmount,
    penaltyAmountLabel,
    totalAmountLabel,
    showTotalPaidBefore,
    totalPaidBeforeLabel,
    paymentAmountLabel,
    remainingAmountLabel,
    remainingAmountColorClass: isPartialPayment ? 'text-red-600' : 'text-green-600',
    summaryLines,
  };
};
