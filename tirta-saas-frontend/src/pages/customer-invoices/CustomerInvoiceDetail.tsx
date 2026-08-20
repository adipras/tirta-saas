import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  PrinterIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BoltIcon,
  CheckCircleIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import type { Invoice } from '../../types/invoice';
import { CardSkeleton, useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Lunas',
  unpaid: 'Belum Dibayar',
  overdue: 'Terlambat',
  partial: 'Dibayar Sebagian',
};

const STATUS_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  paid: { bg: 'bg-success-50', text: 'text-success-700', ring: 'ring-success-200' },
  unpaid: { bg: 'bg-warning-50', text: 'text-warning-700', ring: 'ring-warning-200' },
  overdue: { bg: 'bg-danger-50', text: 'text-danger-700', ring: 'ring-danger-200' },
  partial: { bg: 'bg-info-50', text: 'text-info-700', ring: 'ring-info-200' },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function CustomerInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { error: showErrorToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loadInvoice = useCallback(async () => {
    if (!id) {
      setInvoice(null);
      setError('ID tagihan tidak valid.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getCustomerInvoiceById(id);
      setInvoice(data);
    } catch (err: unknown) {
      setInvoice(null);
      const message = extractApiErrorMessage(err, 'Gagal memuat detail tagihan.');
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [id, showErrorToast]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      await invoiceService.downloadInvoicePDF(id);
    } catch (err: unknown) {
      showErrorToast(extractApiErrorMessage(err, 'Gagal mengunduh PDF tagihan.'));
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    thermalPrinterService.printPage();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 text-sm text-surface-500">
          <Link to="/customer/invoices" className="hover:text-brand-600 transition-colors">
            Tagihan
          </Link>
          <span className="text-surface-300">/</span>
          <span className="text-surface-700 font-medium">Detail</span>
        </div>
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center" role="alert">
          <p className="text-[13px] text-danger-700">{error ?? 'Tagihan tidak ditemukan.'}</p>
          {id && (
            <button
              type="button"
              onClick={() => void loadInvoice()}
              className="mt-4 rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    );
  }

  const s = STATUS_CLASSES[invoice.status] || STATUS_CLASSES.unpaid;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-1.5 text-sm text-surface-500">
          <Link to="/customer/invoices" className="hover:text-brand-600 transition-colors">
            Tagihan
          </Link>
          <span className="text-surface-300">/</span>
          <span className="text-surface-700 font-medium">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePrint} className="btn-secondary">
            <PrinterIcon className="h-4 w-4" />
            Cetak
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadPDF()}
            disabled={downloading}
            className="btn-secondary disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {downloading ? 'Mengunduh...' : 'Unduh PDF'}
          </button>
          {invoice.status !== 'paid' && (
            <Link to={`/customer/pay/${invoice.id}`} className="btn-primary">
              <CreditCardIcon className="h-4 w-4" />
              Bayar Sekarang
            </Link>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Detail Tagihan</p>
            <h1 className="text-2xl font-bold text-surface-900">{invoice.invoiceNumber || '-'}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
              <span>{invoice.customer?.name || invoice.customerName}</span>
              <span className="text-surface-200">•</span>
              <span className="font-mono text-xs">{invoice.meterNumber || invoice.customer?.meterNumber || '-'}</span>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </span>
        </div>

        {/* Key Info Row */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-surface-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-surface-400">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              Tanggal Terbit
            </div>
            <p className="mt-1.5 text-sm font-semibold text-surface-900">{formatDate(invoice.issueDate)}</p>
          </div>
          <div className="rounded-xl bg-surface-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-surface-400">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              Jatuh Tempo
            </div>
            <p className="mt-1.5 text-sm font-semibold text-surface-900">{formatDate(invoice.dueDate)}</p>
          </div>
          <div className="rounded-xl bg-surface-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-surface-400">
              <BoltIcon className="h-3.5 w-3.5" />
              Periode
            </div>
            <p className="mt-1.5 text-sm font-semibold text-surface-900">{invoice.billingPeriod}</p>
          </div>
          <div className="rounded-xl bg-surface-50 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-surface-400">
              <CurrencyDollarIcon className="h-3.5 w-3.5" />
              Total Tagihan
            </div>
            <p className="mt-1.5 text-sm font-bold text-brand-600">{formatCurrency(invoice.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
              <UserIcon className="h-4 w-4 text-brand-500" />
              Informasi Pelanggan
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                  <UserIcon className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-400">Nama pelanggan</p>
                  <p className="mt-0.5 text-sm font-medium text-surface-900">{invoice.customer?.name || invoice.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-50">
                  <BoltIcon className="h-4 w-4 text-info-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-400">Nomor meter</p>
                  <p className="mt-0.5 font-mono text-sm font-medium text-surface-900">{invoice.meterNumber || invoice.customer?.meterNumber || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50">
                  <MapPinIcon className="h-4 w-4 text-warning-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-400">Alamat</p>
                  <p className="mt-0.5 text-sm font-medium text-surface-900">{invoice.customer?.address || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50">
                  <PhoneIcon className="h-4 w-4 text-success-600" />
                </div>
                <div>
                  <p className="text-xs text-surface-400">Kontak</p>
                  <p className="mt-0.5 text-sm font-medium text-surface-900">
                    {invoice.customer?.phone || invoice.customer?.email || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Details */}
          <div className="card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
              <BoltIcon className="h-4 w-4 text-info-500" />
              Detail Pemakaian & Biaya
            </h2>

            {/* Usage Stats */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-info-50 p-4">
                <p className="text-xs font-medium text-info-600">Pemakaian air</p>
                <p className="mt-1 text-2xl font-bold text-info-900">{invoice.usage.toLocaleString('id-ID')} m³</p>
              </div>
              <div className="rounded-xl bg-surface-50 p-4">
                <p className="text-xs font-medium text-surface-500">Meter akhir - sebelumnya</p>
                <p className="mt-1 font-mono text-2xl font-bold text-surface-900">
                  {typeof invoice.meterEnd === 'number' && typeof invoice.meterStart === 'number'
                    ? `${invoice.meterEnd.toFixed(0)} - ${invoice.meterStart.toFixed(0)}`
                    : '-'}
                </p>
                <p className="mt-1 text-xs text-surface-400">
                  Akhir: {typeof invoice.meterEnd === 'number' ? invoice.meterEnd.toLocaleString('id-ID') : '-'} m³
                  {' '}•{' '}
                  Awal: {typeof invoice.meterStart === 'number' ? invoice.meterStart.toLocaleString('id-ID') : '-'} m³
                </p>
              </div>
              <div className="rounded-xl bg-success-50 p-4">
                <p className="text-xs font-medium text-success-600">Tarif air per m³</p>
                <p className="mt-1 text-2xl font-bold text-success-900">
                  {invoice.pricePerM3 && invoice.pricePerM3 > 0
                    ? formatCurrency(invoice.pricePerM3)
                    : invoice.usage > 0
                      ? formatCurrency(invoice.amount / invoice.usage)
                      : '-'}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="mt-4 divide-y divide-surface-100 rounded-xl border border-surface-100">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-surface-500">Biaya air</span>
                <span className="font-medium text-surface-900">{formatCurrency(invoice.amount)}</span>
              </div>
              {(invoice.subscriptionFee || 0) > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-surface-500">Abonemen</span>
                  <span className="font-medium text-surface-900">{formatCurrency(invoice.subscriptionFee || 0)}</span>
                </div>
              )}
              {(invoice.penaltyAmount || 0) > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-danger-600">Denda keterlambatan</span>
                  <span className="font-medium text-danger-600">{formatCurrency(invoice.penaltyAmount || 0)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
              <CurrencyDollarIcon className="h-4 w-4 text-brand-500" />
              Ringkasan Pembayaran
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">Total tagihan</span>
                <span className="font-medium text-surface-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-surface-500">Sudah dibayar</span>
                <span className="font-medium text-success-600">{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="border-t border-surface-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-surface-900">Sisa tagihan</span>
                  <span className="text-xl font-bold text-danger-600">{formatCurrency(invoice.amountDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="card">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
                <CheckCircleIcon className="h-4 w-4 text-success-500" />
                Riwayat Pembayaran
              </h2>
              <div className="mt-4 space-y-3">
                {invoice.payments.map((payment, index) => (
                  <div key={index} className="rounded-xl border border-success-100 bg-success-50/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-surface-900">{formatDate(payment.paymentDate)}</p>
                        <p className="mt-0.5 text-xs text-surface-500">
                          {payment.paymentMethod || payment.method || '-'}
                        </p>
                        {payment.referenceNumber && (
                          <p className="text-xs text-surface-400">Ref: {payment.referenceNumber}</p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-success-700">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="card">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
                <DocumentTextIcon className="h-4 w-4 text-surface-400" />
                Catatan
              </h2>
              <p className="mt-3 text-sm text-surface-500">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
