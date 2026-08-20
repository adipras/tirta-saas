import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, DashboardStatCard, useToast } from '../../components';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { extractApiErrorMessage } from '../../utils/apiError';

type InvoiceStatus = 'all' | 'paid' | 'unpaid' | 'overdue' | 'partial';

const STATUS_LABEL: Record<string, string> = {
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
    const s = STATUS_CLASSES[status] || STATUS_CLASSES.unpaid;
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
    );
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

  const paidCount = getStatusCount('paid');
  const overdueCount = getStatusCount('overdue');
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  const nextPayableInvoice =
    invoices.find((invoice) => invoice.status === 'overdue') ||
    invoices.find((invoice) => invoice.status === 'partial') ||
    invoices.find((invoice) => invoice.status === 'unpaid') ||
    null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tagihan Saya" subtitle="Lihat daftar tagihan, cek status pembayaran, dan konfirmasi pembayaran." />
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center" role="alert">
          <p className="text-[13px] text-danger-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadTagihan()}
            className="mt-4 rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700"
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
        title="Tagihan Saya"
        subtitle="Lihat daftar tagihan, cek status pembayaran, dan pilih tagihan yang ingin Anda konfirmasi pembayarannya."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Tagihan"
          value={invoices.length.toLocaleString('id-ID')}
          subtitle="Jumlah seluruh tagihan yang tercatat."
          icon={DocumentTextIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Lunas"
          value={paidCount.toLocaleString('id-ID')}
          subtitle="Tagihan yang sudah terbayar lunas."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Belum Dibayar"
          value={(getStatusCount('unpaid') + overdueCount + getStatusCount('partial')).toLocaleString('id-ID')}
          subtitle="Perlu ditindaklanjuti sebelum jatuh tempo."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Total Belum Dibayar"
          value={formatCurrency(getTotalUnpaid())}
          subtitle="Akumulasi sisa tagihan yang perlu dibayar."
          icon={CurrencyDollarIcon}
          tone={getTotalUnpaid() > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Outstanding Alert */}
      {getTotalUnpaid() > 0 && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-warning-700">
              Anda memiliki{' '}
              <strong>{getStatusCount('unpaid') + overdueCount + getStatusCount('partial')}</strong>{' '}
              tagihan belum dibayar dengan total{' '}
              <strong>{formatCurrency(getTotalUnpaid())}</strong>
            </p>
            {nextPayableInvoice && (
              <Link
                to={`/customer/pay/${nextPayableInvoice.id}`}
                className="btn-primary !px-4 !py-2 text-xs"
              >
                Bayar Sekarang
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">Filter Tagihan</h3>
            <p className="mt-0.5 text-xs text-surface-400">
              Cari berdasarkan nomor tagihan atau periode.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
            >
              <XMarkIcon className="h-3 w-3" />
              Reset filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
            <input
              type="search"
              placeholder="Cari nomor tagihan atau periode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus)}
            className="input-base"
          >
            <option value="all">Semua Status ({getStatusCount('all')})</option>
            <option value="paid">Lunas ({getStatusCount('paid')})</option>
            <option value="unpaid">Belum dibayar ({getStatusCount('unpaid')})</option>
            <option value="overdue">Terlambat ({getStatusCount('overdue')})</option>
            <option value="partial">Dibayar sebagian ({getStatusCount('partial')})</option>
          </select>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {filteredTagihan.length === 0 ? (
          <div className="rounded-xl bg-surface-50 p-8 text-center">
            <DocumentTextIcon className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm font-medium text-surface-600">Tidak ada tagihan</p>
            <p className="mt-1 text-[13px] text-surface-400">
              {searchTerm || statusFilter !== 'all'
                ? 'Coba ubah kriteria pencarian atau filter.'
                : 'Anda belum memiliki tagihan.'}
            </p>
          </div>
        ) : (
          filteredTagihan.map((invoice) => {
            return (
              <div
                key={invoice.id}
                className="group flex flex-col gap-4 rounded-xl border border-surface-100 bg-surface-50/50 p-4 transition-all hover:border-surface-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
                    <DocumentTextIcon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[13px] font-medium text-surface-700">
                        {invoice.invoiceNumber}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="mt-1 text-[13px] text-surface-500">
                      Periode: {invoice.billingPeriod}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-surface-400">
                      <span>Terbit: {formatDate(invoice.issueDate)}</span>
                      <span className="text-surface-200">•</span>
                      <span>Jatuh tempo: {formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-base font-bold text-surface-900">{formatCurrency(invoice.totalAmount)}</p>
                    {invoice.status !== 'paid' && invoice.amountDue > 0 && (
                      <p className="text-[12px] text-danger-600">Sisa: {formatCurrency(invoice.amountDue)}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/customer/invoices/${invoice.id}`}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      Lihat Detail
                    </Link>
                    {invoice.status !== 'paid' && (
                      <Link
                        to={`/customer/pay/${invoice.id}`}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        Bayar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
