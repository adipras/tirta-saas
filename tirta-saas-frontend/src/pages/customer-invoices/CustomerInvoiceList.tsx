import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { PageHeader, Skeleton, TableSkeleton, useToast } from '../../components';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { extractApiErrorMessage } from '../../utils/apiError';

type InvoiceStatus = 'all' | 'paid' | 'unpaid' | 'overdue' | 'partial';

const STATUS_LABEL: Record<string, string> = {
  paid: 'LUNAS',
  unpaid: 'BELUM DIBAYAR',
  overdue: 'TERLAMBAT',
  partial: 'DIBAYAR SEBAGIAN',
};

export default function CustomerInvoiceList() {
  const { error: showErrorToast } = useToast();
  const [invoices, setTagihan] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>('all');

  const loadTagihan = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getCustomerTagihan();
      setTagihan(data);
      setError(null);
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memuat tagihan. Silakan coba lagi.');
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    void loadTagihan();
  }, [loadTagihan]);

  const filteredTagihan = useMemo(() => {
    let filtered = [...invoices];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.billingPeriod.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [invoices, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-indigo-100 text-indigo-800',
    };
    return badges[status] ?? badges.unpaid;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getTotalUnpaid = () =>
    invoices
      .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue' || inv.status === 'partial')
      .reduce((sum, inv) => sum + inv.amountDue, 0);

  const getStatusCount = (status: InvoiceStatus) => {
    if (status === 'all') return invoices.length;
    return invoices.filter(inv => inv.status === status).length;
  };

  const nextPayableInvoice =
    invoices.find((invoice) => invoice.status === 'overdue') ||
    invoices.find((invoice) => invoice.status === 'partial') ||
    invoices.find((invoice) => invoice.status === 'unpaid') ||
    null;
  const pageTitle = 'Tagihan Saya';
  const pageSubtitle =
    'Lihat daftar tagihan, cek status pembayaran, dan pilih tagihan yang ingin Anda konfirmasi pembayarannya.';

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow">
              <Skeleton height={16} width="45%" />
              <Skeleton height={32} width="55%" className="mt-3" />
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-white p-6 shadow" aria-hidden="true">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Skeleton height={40} className="max-w-md rounded-lg" />
            <Skeleton height={40} width={220} className="rounded-lg" />
          </div>
          <div className="mt-6">
            <TableSkeleton rows={4} cols={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} />

        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadTagihan()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Tagihan</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Lunas</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{getStatusCount('paid')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Belum Dibayar</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{getStatusCount('unpaid')}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <p className="text-sm font-medium text-red-900">Total Belum Dibayar</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(getTotalUnpaid())}</p>
        </div>
      </div>

      {/* Outstanding Alert */}
      {getTotalUnpaid() > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-yellow-700">
                Anda memiliki{' '}
                <strong>{getStatusCount('unpaid') + getStatusCount('overdue') + getStatusCount('partial')}</strong>{' '}
                tagihan belum dibayar dengan total{' '}
                <strong>{formatCurrency(getTotalUnpaid())}</strong>
              </p>
              {nextPayableInvoice && (
                <Link
                  to={`/customer/pay/${nextPayableInvoice.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-yellow-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  Bayar Sekarang
                </Link>
              )}
            </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            role="search"
            aria-label="Pencarian dan filter tagihan"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <label htmlFor="customer-invoice-search" className="sr-only">
                Cari nomor tagihan atau periode
              </label>
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="customer-invoice-search"
                type="search"
                placeholder="Cari nomor tagihan atau periode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-describedby="customer-invoice-search-help"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p id="customer-invoice-search-help" className="sr-only">
                Gunakan pencarian untuk memfilter nomor tagihan atau periode tagihan.
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <label htmlFor="customer-invoice-status" className="sr-only">
                Filter status tagihan
              </label>
              <select
                id="customer-invoice-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus)}
                aria-describedby="customer-invoice-status-help"
                className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status ({getStatusCount('all')})</option>
                <option value="paid">Lunas ({getStatusCount('paid')})</option>
                <option value="unpaid">Belum dibayar ({getStatusCount('unpaid')})</option>
                <option value="overdue">Terlambat ({getStatusCount('overdue')})</option>
                <option value="partial">Dibayar sebagian ({getStatusCount('partial')})</option>
              </select>
              <p id="customer-invoice-status-help" className="sr-only">
                Pilih status untuk menyaring daftar tagihan Anda.
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500" aria-live="polite">
            Menampilkan {filteredTagihan.length} dari {invoices.length} tagihan.
          </p>
        </div>

        {/* Invoice List */}
        <div className="divide-y divide-gray-200" aria-live="polite">
          {filteredTagihan.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada tagihan</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Coba ubah kriteria pencarian atau filter.'
                  : 'Anda belum memiliki tagihan.'}
              </p>
            </div>
          ) : (
            filteredTagihan.map((invoice) => (
              <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-10 w-10 text-indigo-600" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                          {STATUS_LABEL[invoice.status] ?? invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Periode: {invoice.billingPeriod}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>Tgl Terbit: {formatDate(invoice.issueDate)}</span>
                        <span>•</span>
                        <span>Jatuh Tempo: {formatDate(invoice.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">Total</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                      {invoice.status !== 'paid' && invoice.amountDue > 0 && (
                        <p className="text-sm text-red-600">Sisa: {formatCurrency(invoice.amountDue)}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/customer/invoices/${invoice.id}`}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Lihat Detail
                      </Link>
                      {invoice.status !== 'paid' && (
                        <Link
                          to={`/customer/pay/${invoice.id}`}
                          className="rounded-lg border border-indigo-600 px-4 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Bayar
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
