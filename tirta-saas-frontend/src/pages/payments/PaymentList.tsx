import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
  NoSymbolIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import { paymentService, type PaymentFilters } from '../../services/paymentService';
import { ActionIconButton, DashboardStatCard, PageHeader, ConfirmModal, useToast } from '../../components';
import type {
  Payment,
  PaymentStatus,
} from '../../types/payment';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../../types/payment';

const PaymentStatusClasses: Record<PaymentStatus, { bg: string; text: string; ring: string }> = {
  completed: { bg: 'bg-success-50', text: 'text-success-700', ring: 'ring-success-200' },
  pending: { bg: 'bg-warning-50', text: 'text-warning-700', ring: 'ring-warning-200' },
  failed: { bg: 'bg-danger-50', text: 'text-danger-700', ring: 'ring-danger-200' },
  voided: { bg: 'bg-surface-50', text: 'text-surface-500', ring: 'ring-surface-200' },
};

const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const [payments, setPembayaran] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null);

  const fetchPembayaran = useCallback(async (page: number, search: string, currentFilters: PaymentFilters) => {
    try {
      setLoading(true);
      const response = await paymentService.getPembayaran(page, 10, {
        ...currentFilters,
        search: search || undefined,
      });
      setPembayaran(response.data);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.currentPage);
    } catch {
      showErrorToast('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchPembayaran(1, searchTerm, filters);
  }, [fetchPembayaran, searchTerm, filters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handlePageChange = (page: number) => {
    fetchPembayaran(page, searchTerm, filters);
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleViewReceipt = (payment: Payment) => {
    navigate(`/admin/payments/${payment.id}/receipt`);
  };

  const handleViewInvoice = (payment: Payment) => {
    navigate(`/admin/invoices/${payment.invoiceId}`);
  };

  const handleVoidPayment = (payment: Payment) => {
    setVoidTarget(payment);
  };

  const confirmVoidPayment = async () => {
    if (!voidTarget) return;
    try {
      await paymentService.voidPayment(voidTarget.id);
      showSuccessToast('Pembayaran berhasil dibatalkan');
      setVoidTarget(null);
      fetchPembayaran(currentPage, searchTerm, filters);
    } catch {
      showErrorToast('Gagal membatalkan pembayaran');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await paymentService.exportPembayaran(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      showErrorToast('Gagal mengekspor data pembayaran');
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: 'paymentDate',
      label: 'Tanggal',
      sortable: true,
      render: (_value: unknown, payment: Payment) => (
        <span className="text-sm text-surface-600">
          {new Date(payment.paymentDate).toLocaleDateString('id-ID')}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Pelanggan',
      sortable: true,
      render: (_value: unknown, payment: Payment) => (
        <span className="font-medium text-surface-900">{payment.customerName || '-'}</span>
      ),
    },
    {
      key: 'invoiceNumber',
      label: 'Tagihan',
      sortable: true,
      render: (_value: unknown, payment: Payment) => (
        <button
          onClick={() => handleViewInvoice(payment)}
          className="font-mono text-sm font-medium text-brand-600 transition hover:text-brand-700"
        >
          {payment.invoiceNumber || '-'}
        </button>
      ),
    },
    {
      key: 'amount',
      label: 'Nominal',
      sortable: true,
      render: (_value: unknown, payment: Payment) => (
        <span className="font-semibold text-surface-900">Rp {payment.amount.toLocaleString('id-ID')}</span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Metode',
      sortable: true,
      render: (_value: unknown, payment: Payment) => (
        <span className="text-sm text-surface-500">
          {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
        </span>
      ),
    },
    {
      key: 'referenceNumber',
      label: 'Referensi',
      hideOnMobile: true,
      render: (_value: unknown, payment: Payment) => (
        <span className="font-mono text-xs text-surface-400">{payment.referenceNumber || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value: unknown, payment: Payment) => {
        const s = PaymentStatusClasses[payment.status] || PaymentStatusClasses.pending;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
            {PAYMENT_STATUS_LABELS[payment.status]}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (_value: unknown, payment: Payment) => (
        <div className="flex items-center justify-end gap-1.5">
          <ActionIconButton
            icon={DocumentTextIcon}
            label="Lihat struk pembayaran"
            tone="blue"
            onClick={() => handleViewReceipt(payment)}
          />
          <ActionIconButton
            icon={EyeIcon}
            label="Lihat detail tagihan"
            tone="gray"
            onClick={() => handleViewInvoice(payment)}
          />
          {payment.status === 'completed' && (
            <ActionIconButton
              icon={NoSymbolIcon}
              label="Batalkan pembayaran"
              tone="red"
              onClick={() => handleVoidPayment(payment)}
            />
          )}
        </div>
      ),
    },
  ];

  const completedCount = payments.filter((payment) => payment.status === 'completed').length;
  const pendingCount = payments.filter((payment) => payment.status === 'pending').length;
  const totalNominal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const hasActiveFilters =
    Boolean(filters.paymentMethod) ||
    Boolean(filters.status) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    searchTerm !== '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran"
        subtitle="Kelola transaksi pembayaran dengan ringkasan singkat, filter yang rapi, dan aksi yang mudah dijangkau di mobile."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <button onClick={handleExport} className="btn-secondary">
              <ArrowPathIcon className="h-4 w-4" />
              Ekspor
            </button>
            <button onClick={() => navigate('/admin/payments/new')} className="btn-primary">
              <PlusIcon className="h-4 w-4" />
              Catat Pembayaran
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Transaksi Tampil"
          value={loading ? '...' : payments.length.toLocaleString('id-ID')}
          subtitle={hasActiveFilters ? 'Difilter' : 'Semua item pada halaman'}
          icon={DocumentTextIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Selesai"
          value={loading ? '...' : completedCount.toLocaleString('id-ID')}
          subtitle="Transaksi berhasil diselesaikan"
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Menunggu"
          value={loading ? '...' : pendingCount.toLocaleString('id-ID')}
          subtitle="Perlu tindakan lanjutan"
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Nominal"
          value={loading ? '...' : `Rp ${totalNominal.toLocaleString('id-ID')}`}
          subtitle="Total pada daftar aktif"
          icon={CurrencyDollarIcon}
          tone="purple"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">Filter Pembayaran</h3>
            <p className="mt-0.5 text-xs text-surface-400">
              Saring berdasarkan metode, status, tanggal, atau kata kunci pencarian.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilters({}); setSearchTerm(''); }}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
            >
              <XMarkIcon className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={filters.paymentMethod || ''}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            className="input-base"
          >
            <option value="">Semua metode</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input-base"
          >
            <option value="">Semua status</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="input-base"
          />
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="input-base"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {/* Search Bar */}
        <div className="border-b border-surface-100 px-5 py-3">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
            <input
              type="text"
              placeholder="Cari pembayaran..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada pembayaran yang sesuai dengan filter"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-100 px-5 py-3">
            <span className="text-sm text-surface-400">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={voidTarget !== null}
        onClose={() => setVoidTarget(null)}
        onConfirm={confirmVoidPayment}
        title="Batalkan Pembayaran"
        message="Pembayaran yang dibatalkan akan dikeluarkan dari total pelunasan tagihan. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, batalkan"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
};

export default PaymentList;
