import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import invoiceService from '../../services/invoiceService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import type { InvoiceDetails as InvoiceDetailsType, Invoice } from '../../types/invoice';
import { useToast, CardSkeleton } from '../../components';

const STATUS_LABELS: Record<Invoice['status'], string> = {
  paid: 'Lunas',
  unpaid: 'Belum bayar',
  partial: 'Parsial',
  overdue: 'Terlambat',
};

const STATUS_CLASSES: Record<Invoice['status'], { bg: string; text: string; ring: string }> = {
  paid: { bg: 'bg-success-50', text: 'text-success-700', ring: 'ring-success-200' },
  unpaid: { bg: 'bg-warning-50', text: 'text-warning-700', ring: 'ring-warning-200' },
  partial: { bg: 'bg-info-50', text: 'text-info-700', ring: 'ring-info-200' },
  overdue: { bg: 'bg-danger-50', text: 'text-danger-700', ring: 'ring-danger-200' },
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

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<InvoiceDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = useCallback(async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch {
      toast.error('Gagal memuat detail tagihan');
      navigate('/admin/invoices');
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [fetchInvoice, id]);

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

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <DocumentTextIcon className="h-12 w-12 text-surface-200" />
        <p className="mt-3 text-sm text-surface-400">Tagihan tidak ditemukan</p>
      </div>
    );
  }

  const isRegistration = invoice.type === 'registration';
  const isManual = invoice.type === 'manual';
  const invoiceTypeLabel = isRegistration
    ? 'Tagihan Registrasi'
    : isManual
      ? 'Tagihan Manual'
      : 'Tagihan Air Bulanan';
  const meterDiffLabel =
    typeof invoice.meterStart === 'number' && typeof invoice.meterEnd === 'number'
      ? `${invoice.meterEnd.toFixed(0)} - ${invoice.meterStart.toFixed(0)}`
      : '-';
  const estimatedRate =
    invoice.pricePerM3 && invoice.pricePerM3 > 0
      ? invoice.pricePerM3
      : invoice.usage > 0
        ? invoice.amount / invoice.usage
        : 0;

  const s = STATUS_CLASSES[invoice.status] || STATUS_CLASSES.unpaid;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-brand-600"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali ke daftar tagihan
        </button>
        <button onClick={handlePrint} className="btn-secondary">
          <PrinterIcon className="h-4 w-4" />
          Cetak
        </button>
      </div>

      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{invoiceTypeLabel}</p>
            <h1 className="text-2xl font-bold text-surface-900">{invoice.invoiceNumber || '-'}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
              <span>{invoice.customerName}</span>
              <span className="text-surface-200">•</span>
              <span className="font-mono text-xs">{invoice.meterNumber || invoice.customer?.meterNumber || '-'}</span>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
            {STATUS_LABELS[invoice.status]}
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
            <p className="mt-1.5 text-sm font-semibold text-surface-900">
              {invoice.billingPeriod || (isRegistration ? 'Registrasi' : 'Manual')}
            </p>
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
                  <p className="mt-0.5 text-sm font-medium text-surface-900">{invoice.customerName}</p>
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
              {isRegistration ? 'Rincian Biaya Registrasi' : isManual ? 'Rincian Tagihan Manual' : 'Detail Pemakaian & Biaya'}
            </h2>

            {isRegistration ? (
              <div className="mt-4 rounded-xl border border-surface-100 bg-surface-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-surface-900">Biaya registrasi pelanggan baru</p>
                    <p className="mt-1 text-sm text-surface-400">Tagihan satu kali untuk aktivasi pelanggan.</p>
                  </div>
                  <p className="text-lg font-bold text-surface-900">{formatCurrency(invoice.totalAmount)}</p>
                </div>
              </div>
            ) : isManual ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-surface-100 bg-surface-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-surface-900">Tagihan manual</p>
                      <p className="mt-1 text-sm text-surface-400">
                        {invoice.notes || 'Tagihan tambahan di luar registrasi dan pemakaian air.'}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-surface-900">{formatCurrency(invoice.totalAmount)}</p>
                  </div>
                </div>

                {invoice.items && invoice.items.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-surface-100">
                    <div className="grid grid-cols-[minmax(0,1fr)_80px_140px_140px] gap-3 bg-surface-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-surface-400">
                      <span>Item</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Harga Satuan</span>
                      <span className="text-right">Total</span>
                    </div>
                    <div className="divide-y divide-surface-100">
                      {invoice.items.map((item, index) => (
                        <div key={`${item.description}-${index}`} className="grid grid-cols-[minmax(0,1fr)_80px_140px_140px] gap-3 px-4 py-3 text-sm">
                          <span className="text-surface-900">{item.description}</span>
                          <span className="text-right text-surface-500">{Number(item.quantity).toLocaleString('id-ID')}</span>
                          <span className="text-right text-surface-500">{formatCurrency(item.unitPrice)}</span>
                          <span className="text-right font-medium text-surface-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Usage Stats */}
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-info-50 p-4">
                    <p className="text-xs font-medium text-info-600">Pemakaian air</p>
                    <p className="mt-1 text-2xl font-bold text-info-900">{invoice.usage.toLocaleString('id-ID')} m³</p>
                  </div>
                  <div className="rounded-xl bg-surface-50 p-4">
                    <p className="text-xs font-medium text-surface-500">Meter akhir - sebelumnya</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-surface-900">{meterDiffLabel}</p>
                    <p className="mt-1 text-xs text-surface-400">
                      Akhir: {typeof invoice.meterEnd === 'number' ? invoice.meterEnd.toLocaleString('id-ID') : '-'} m³
                      {' '}•{' '}
                      Awal: {typeof invoice.meterStart === 'number' ? invoice.meterStart.toLocaleString('id-ID') : '-'} m³
                    </p>
                  </div>
                  <div className="rounded-xl bg-success-50 p-4">
                    <p className="text-xs font-medium text-success-600">Tarif air per m³</p>
                    <p className="mt-1 text-2xl font-bold text-success-900">{formatCurrency(estimatedRate)}</p>
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
              </>
            )}
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
