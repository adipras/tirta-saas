import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon,
  PrinterIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import type { Invoice } from '../../types/invoice';
import { PageHeader, Skeleton, TableSkeleton, useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

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
      const data = await invoiceService.getInvoiceById(id);
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
    if (!id) {
      return;
    }

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

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-indigo-100 text-indigo-800',
    };
    return badges[status as keyof typeof badges] || badges.unpaid;
  };

  const STATUS_LABEL: Record<string, string> = {
    paid: 'LUNAS',
    unpaid: 'BELUM DIBAYAR',
    overdue: 'TERLAMBAT',
    partial: 'DIBAYAR SEBAGIAN',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  const pageTitle = 'Detail Tagihan';
  const pageSubtitle =
    'Tinjau rincian tagihan, unduh PDF, atau lanjutkan pembayaran bila masih ada sisa tagihan.';
  const backToInvoicesAction = (
    <Link
      to="/customer/invoices"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
      Kembali ke Tagihan
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} actions={backToInvoicesAction} />

        <div className="rounded-lg bg-white p-8 shadow" aria-hidden="true">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Skeleton height={36} width={180} />
              <Skeleton height={24} width={220} />
            </div>
            <Skeleton height={32} width={120} className="rounded-full" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 border-t border-gray-200 pt-8 md:grid-cols-2">
            <div className="space-y-3">
              <Skeleton height={18} width={140} />
              <Skeleton height={14} count={4} className="mt-2" />
            </div>
            <div className="space-y-3">
              <Skeleton height={18} width={140} />
              <Skeleton height={14} count={4} className="mt-2" />
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-gray-50 p-6">
            <TableSkeleton rows={3} cols={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    const alertMessage = error ?? 'Tagihan tidak ditemukan.';

    return (
      <div className="space-y-4">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} actions={backToInvoicesAction} />

        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <p className="text-red-700">{alertMessage}</p>
          {id && (
            <button
              type="button"
              onClick={() => void loadInvoice()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <div className="flex flex-wrap gap-3 print:hidden">
            {backToInvoicesAction}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PrinterIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              Cetak
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPDF()}
              disabled={downloading}
              aria-busy={downloading}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              {downloading ? 'Mengunduh PDF...' : 'Unduh PDF'}
            </button>
            {invoice.status !== 'paid' && (
              <Link
                to={`/customer/pay/${invoice.id}`}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <CreditCardIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Bayar Sekarang
              </Link>
            )}
          </div>
        }
      />

      {/* Invoice Detail Card */}
      <div className="bg-white rounded-lg shadow">
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Tagihan</h2>
              <p className="mt-2 text-lg font-semibold text-blue-600">No. {invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(invoice.status)}`}>
                {STATUS_LABEL[invoice.status] ?? invoice.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Company & Customer Info */}
        <div className="grid grid-cols-1 gap-8 border-b border-gray-200 px-8 py-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Penerbit</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">Tirta Water Management</p>
              <p>Jl. Air Bersih No. 123</p>
              <p>Jakarta Pusat, 10110</p>
              <p>Telp: (021) 1234-5678</p>
              <p>Email: info@tirta.com</p>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Pelanggan</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{invoice.customer?.name || invoice.customerName}</p>
              <p>ID: {invoice.customer?.customerId || invoice.customerId}</p>
              <p>{invoice.customer?.address || 'Alamat belum tersedia'}</p>
              <p>Telp: {invoice.customer?.phone || 'Belum tersedia'}</p>
              <p>Email: {invoice.customer?.email || 'Belum tersedia'}</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 gap-6 border-b border-gray-200 bg-gray-50 px-8 py-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Tanggal Terbit</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Jatuh Tempo</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(invoice.dueDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Periode Tagihan</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{invoice.billingPeriod}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-8 py-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <caption className="sr-only">Rincian komponen tagihan</caption>
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-semibold text-gray-900 pb-3">Deskripsi</th>
                <th className="text-right text-sm font-semibold text-gray-900 pb-3">Jumlah</th>
                <th className="text-right text-sm font-semibold text-gray-900 pb-3">Tarif</th>
                <th className="text-right text-sm font-semibold text-gray-900 pb-3">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.items || []).length > 0 ? (
                (invoice.items || []).map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="py-4 text-right text-sm text-gray-600">{item.quantity}</td>
                    <td className="py-4 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-500">
                    Belum ada rincian komponen tagihan.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">{formatCurrency(invoice.subtotal || invoice.totalAmount)}</span>
              </div>
              {(invoice.penaltyAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Denda</span>
                  <span className="text-red-600 font-medium">{formatCurrency(invoice.penaltyAmount || 0)}</span>
                </div>
              )}
              {(invoice.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pajak ({invoice.taxPercentage || 0}%)</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(invoice.taxAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-3">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sudah Dibayar</span>
                  <span className="text-green-600 font-medium">-{formatCurrency(invoice.amountPaid)}</span>
                </div>
              )}
              {invoice.status !== 'paid' && invoice.amountDue > 0 && (
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                  <span className="text-red-600">Sisa Tagihan</span>
                  <span className="text-red-600">{formatCurrency(invoice.amountDue)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="px-8 py-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Pembayaran</h3>
            <div className="space-y-3">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(payment.paymentDate)}</p>
                    <p className="text-xs text-gray-600">Metode: {payment.paymentMethod}</p>
                    {payment.referenceNumber && (
                      <p className="text-xs text-gray-600">Ref: {payment.referenceNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="px-8 py-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Catatan</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Terima kasih telah menggunakan layanan kami. Untuk pertanyaan, hubungi kami di info@tirta.com atau (021) 1234-5678
          </p>
        </div>
      </div>
    </div>
  );
}
