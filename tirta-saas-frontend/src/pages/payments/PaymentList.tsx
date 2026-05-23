import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  NoSymbolIcon,
  PlusIcon,
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

  const getStatusBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'voided':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: Column<Payment>[] = [
    {
      key: 'paymentDate',
      label: 'Tanggal',
      sortable: true,
      render: (_value: unknown, payment: Payment) => new Date(payment.paymentDate).toLocaleDateString('id-ID'),
    },
    {
      key: 'customerName',
      label: 'Pelanggan',
      sortable: true,
      render: (_value: unknown, payment: Payment) => payment.customerName || '-',
    },
    {
      key: 'invoiceNumber',
      label: 'Tagihan',
      sortable: true,
      render: (_value: unknown, payment: Payment) => (
        <button
          onClick={() => handleViewInvoice(payment)}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {payment.invoiceNumber || '-'}
        </button>
      ),
    },
    {
      key: 'amount',
      label: 'Nominal',
      sortable: true,
      render: (_value: unknown, payment: Payment) => `Rp ${payment.amount.toLocaleString('id-ID')}`,
    },
    {
      key: 'paymentMethod',
      label: 'Metode',
      sortable: true,
      render: (_value: unknown, payment: Payment) => PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod,
    },
    {
      key: 'referenceNumber',
      label: 'Referensi',
      hideOnMobile: true,
      render: (_value: unknown, payment: Payment) => payment.referenceNumber || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value: unknown, payment: Payment) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}
        >
          {PAYMENT_STATUS_LABELS[payment.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_value: unknown, payment: Payment) => (
        <div className="flex items-center gap-2">
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
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Transaksi tampil"
          value={loading ? '...' : payments.length.toLocaleString('id-ID')}
          helper={hasActiveFilters ? 'Daftar sedang difilter' : 'Semua item pada halaman'}
          subtitle="Jumlah pembayaran yang sedang tampil pada daftar saat ini."
          icon={DocumentTextIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pembayaran selesai"
          value={loading ? '...' : completedCount.toLocaleString('id-ID')}
          subtitle="Transaksi yang sudah berhasil diselesaikan dan tercatat."
          icon={EyeIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Menunggu proses"
          value={loading ? '...' : pendingCount.toLocaleString('id-ID')}
          subtitle="Membantu memantau pembayaran yang masih perlu tindakan lanjutan."
          icon={FunnelIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Nominal pada daftar"
          value={loading ? '...' : `Rp ${totalNominal.toLocaleString('id-ID')}`}
          subtitle="Akumulasi nominal pembayaran yang tampil pada daftar aktif."
          icon={PlusIcon}
          tone="purple"
        />
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Filter pembayaran</h2>
            <p className="mt-1 text-sm text-gray-500">
              Saring transaksi berdasarkan metode, status, tanggal, atau kata kunci pencarian.
            </p>
          </div>
          {hasActiveFilters && (
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Filter aktif
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.paymentMethod || ''}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="">Semua metode</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Semua status</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Selesai
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({})}
            className="w-full rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 sm:w-auto"
          >
            Reset Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="text"
            placeholder="Cari pembayaran..."
            className="w-full rounded-md border border-gray-300 px-4 py-2 lg:max-w-md"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleExport}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 sm:w-auto"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Ekspor
            </button>
            <button
              onClick={() => navigate('/admin/payments/new')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Catat Pembayaran
            </button>
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
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded border px-3 py-1 disabled:opacity-50"
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
