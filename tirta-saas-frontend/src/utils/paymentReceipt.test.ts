import { describe, expect, it, vi } from 'vitest';
import {
  buildPaymentReceiptViewModel,
  formatPaymentReceiptDateTime,
  truncatePaymentReceiptText,
} from './paymentReceipt';
import type { PaymentReceipt } from '../types/payment';

vi.mock('../services/tenantSettingsService', () => ({
  resolveTenantAssetUrl: (value?: string) => (value ? `https://assets.test${value}` : ''),
}));

const baseReceipt: PaymentReceipt = {
  id: 'receipt-1',
  paymentId: 'payment-1',
  receiptNumber: 'RCT-001',
  tenantInfo: {
    companyName: 'PDAM Tirta Uji',
    phone: '021123456',
    logoUrl: '/logo.png',
    footerText: 'Terima kasih telah membayar tagihan air Anda.',
    bankName: 'Bank Tirta',
    bankAccountName: 'PDAM Tirta Uji',
    bankAccountNo: '1234567890',
    qrisImageUrl: '/qris.png',
  },
  usageDetails: {
    usageMonth: '2026-05',
    usageM3: 12,
  },
  payment: {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    customerId: 'customer-1',
    customerName: 'Budi Santoso',
    invoiceNumber: 'INV-001',
    amount: 150000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-05-10T10:00:00Z',
    referenceNumber: 'REF-001',
    notes: 'Pembayaran dilakukan melalui transfer bank dengan catatan yang sangat panjang dan memerlukan truncation agar struk tetap ringkas.',
    status: 'completed',
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-05-10T10:00:00Z',
  },
  invoiceDetails: {
    invoiceNumber: 'INV-001',
    invoiceDate: '2026-05-01T00:00:00Z',
    dueDate: '2026-05-20T00:00:00Z',
    invoiceType: 'manual',
    items: [
      {
        description: 'Biaya pemasangan ulang',
        quantity: 1,
        unitPrice: 100000,
        amount: 100000,
      },
    ],
    notes: 'Tagihan manual',
    totalAmount: 200000,
    subTotal: 180000,
    penaltyAmount: 20000,
    totalPaidBefore: 50000,
    totalPaidAfter: 150000,
    remainingAmount: 50000,
    paymentCoverageType: 'partial',
    invoicePaymentStatus: 'partial',
  },
  customerDetails: {
    name: 'Budi Santoso',
    address:
      'Jl. Melati No. 10 RT 01 RW 02 Kelurahan Sukamaju Kecamatan Sejahtera Kabupaten Tirta Makmur',
    phone: '08123456789',
    meterNumber: 'MTR-001',
  },
  generatedAt: '2026-05-10T10:05:00Z',
};

describe('paymentReceipt helpers', () => {
  it('builds a partial-payment receipt view model with manual invoice metadata', () => {
    const viewModel = buildPaymentReceiptViewModel(baseReceipt);

    expect(viewModel.invoiceTypeLabel).toBe('Tagihan Manual');
    expect(viewModel.invoiceStatusTone).toBe('partial');
    expect(viewModel.invoiceStatusLabel).toBe('Belum Lunas');
    expect(viewModel.isPartialPayment).toBe(true);
    expect(viewModel.remainingAmountLabel).toBe('Rp 50.000');
    expect(viewModel.remainingAmountColorClass).toBe('text-red-600');
    expect(viewModel.showPenaltyAmount).toBe(true);
    expect(viewModel.showTotalPaidBefore).toBe(true);
    expect(viewModel.paymentMethodLabel).toBe('Transfer Bank');
    expect(viewModel.tenantLogoUrl).toBe('https://assets.test/logo.png');
    expect(viewModel.qrisImageUrl).toBe('https://assets.test/qris.png');
    expect(viewModel.hasBankInfo).toBe(true);
    expect(viewModel.summaryLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Denda', value: 'Rp 20.000', emphasis: 'warning' }),
        expect.objectContaining({ label: 'Terbayar', value: 'Rp 50.000' }),
        expect.objectContaining({
          label: 'Bayar (Transfer Bank)',
          value: 'Rp 150.000',
          emphasis: 'success',
        }),
        expect.objectContaining({ label: 'Sisa', value: 'Rp 50.000', emphasis: 'warning' }),
      ])
    );
  });

  it('normalizes and truncates text metadata safely', () => {
    expect(truncatePaymentReceiptText('   catatan    dengan   spasi  ')).toBe(
      'catatan dengan spasi'
    );
    expect(truncatePaymentReceiptText('')).toBeUndefined();
    expect(truncatePaymentReceiptText('abcdefghij', 8)).toBe('abcdefg...');
  });

  it('returns fallback or raw values for invalid dates', () => {
    expect(formatPaymentReceiptDateTime()).toBe('-');
    expect(formatPaymentReceiptDateTime('invalid-date')).toBe('invalid-date');
  });
});
