import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
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

const STATUS_BADGE_CLASSES: Record<Invoice['status'], string> = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
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
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" aria-hidden="true" />
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
      <div className="py-12 text-center">
        <p className="text-gray-500">Tagihan tidak ditemukan</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Kembali ke daftar tagihan
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <PrinterIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          Cetak
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">{invoiceTypeLabel}</p>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber || '-'}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <span>{invoice.customerName}</span>
              <span className="text-gray-300">•</span>
              <span>Nomor Meter: {invoice.meterNumber || invoice.customer?.meterNumber || '-'}</span>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE_CLASSES[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tanggal terbit</p>
            <p className="mt-1 font-semibold text-gray-900">{formatDate(invoice.issueDate)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Jatuh tempo</p>
            <p className="mt-1 font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Periode</p>
            <p className="mt-1 font-semibold text-gray-900">
              {invoice.billingPeriod || (isRegistration ? 'Registrasi' : 'Manual')}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total tagihan</p>
            <p className="mt-1 font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Informasi pelanggan</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Nama pelanggan</p>
                <p className="mt-1 font-medium text-gray-900">{invoice.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nomor meter</p>
                <p className="mt-1 font-medium text-gray-900">{invoice.meterNumber || invoice.customer?.meterNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Alamat</p>
                <p className="mt-1 font-medium text-gray-900">{invoice.customer?.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kontak</p>
                <p className="mt-1 font-medium text-gray-900">
                  {invoice.customer?.phone || invoice.customer?.email || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {isRegistration ? 'Rincian biaya registrasi' : isManual ? 'Rincian tagihan manual' : 'Detail pemakaian & biaya'}
            </h2>

            {isRegistration ? (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">Biaya registrasi pelanggan baru</p>
                    <p className="mt-1 text-sm text-gray-500">Tagihan satu kali untuk aktivasi pelanggan.</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                </div>
              </div>
            ) : isManual ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">Tagihan manual</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {invoice.notes || 'Tagihan tambahan di luar registrasi dan pemakaian air.'}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                  </div>
                </div>

                {invoice.items && invoice.items.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="grid grid-cols-[minmax(0,1fr)_100px_160px_160px] gap-3 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <span>Item</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Harga satuan</span>
                      <span className="text-right">Total</span>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {invoice.items.map((item, index) => (
                        <div key={`${item.description}-${index}`} className="grid grid-cols-[minmax(0,1fr)_100px_160px_160px] gap-3 px-4 py-3 text-sm">
                          <span className="text-gray-900">{item.description}</span>
                          <span className="text-right text-gray-600">{Number(item.quantity).toLocaleString('id-ID')}</span>
                          <span className="text-right text-gray-600">{formatCurrency(item.unitPrice)}</span>
                          <span className="text-right font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">Pemakaian air</p>
                    <p className="mt-1 text-2xl font-bold text-blue-900">{invoice.usage.toLocaleString('id-ID')} m³</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">Meter akhir - sebelumnya</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{meterDiffLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Akhir: {typeof invoice.meterEnd === 'number' ? invoice.meterEnd.toLocaleString('id-ID') : '-'} m³
                      {' '}•{' '}
                      Awal: {typeof invoice.meterStart === 'number' ? invoice.meterStart.toLocaleString('id-ID') : '-'} m³
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Tarif air per m³</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(estimatedRate)}</p>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-gray-200 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-600">Biaya air</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</span>
                  </div>
                  {(invoice.subscriptionFee || 0) > 0 && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-600">Abonemen</span>
                      <span className="font-medium text-gray-900">{formatCurrency(invoice.subscriptionFee || 0)}</span>
                    </div>
                  )}
                  {(invoice.penaltyAmount || 0) > 0 && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-red-600">Denda keterlambatan</span>
                      <span className="font-medium text-red-600">{formatCurrency(invoice.penaltyAmount || 0)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Ringkasan pembayaran</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total tagihan</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sudah dibayar</span>
                <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Sisa tagihan</span>
                  <span className="text-2xl font-bold text-red-600">{formatCurrency(invoice.amountDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {invoice.payments && invoice.payments.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Riwayat pembayaran</h2>
              <div className="mt-4 space-y-3">
                {invoice.payments.map((payment, index) => (
                  <div key={index} className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(payment.paymentDate)}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          Metode: {payment.paymentMethod || payment.method || '-'}
                        </p>
                        {payment.referenceNumber && (
                          <p className="text-sm text-gray-600">Referensi: {payment.referenceNumber}</p>
                        )}
                      </div>
                      <p className="text-base font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Catatan</h2>
              <p className="mt-3 text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
