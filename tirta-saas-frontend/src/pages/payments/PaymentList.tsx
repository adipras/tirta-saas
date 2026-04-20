import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
  NoSymbolIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import { paymentService, type PaymentFilters } from '../../services/paymentService';
import { PageHeader, ConfirmModal, useToast } from '../../components';
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
    } catch (error) {
      console.error('Failed to fetch payments:', error);
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
    } catch (error) {
      console.error('Failed to void payment:', error);
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
    } catch (error) {
      console.error('Failed to export payments:', error);
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
      render: (_: any, payment: Payment) => new Date(payment.paymentDate).toLocaleDateString('id-ID'),
    },
    {
      key: 'customerName',
      label: 'Pelanggan',
      sortable: true,
      render: (_: any, payment: Payment) => payment.customerName || '-',
    },
    {
      key: 'invoiceNumber',
      label: 'Tagihan',
      sortable: true,
      render: (_: any, payment: Payment) => (
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
      render: (_: any, payment: Payment) => `Rp ${payment.amount.toLocaleString('id-ID')}`,
    },
    {
      key: 'paymentMethod',
      label: 'Metode',
      sortable: true,
      render: (_: any, payment: Payment) => PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod,
    },
    {
      key: 'referenceNumber',
      label: 'Referensi',
      render: (_: any, payment: Payment) => payment.referenceNumber || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, payment: Payment) => (
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
      render: (_: any, payment: Payment) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewReceipt(payment)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50"
            title="Lihat struk pembayaran"
            aria-label="Lihat struk pembayaran"
          >
            <DocumentTextIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleViewInvoice(payment)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            title="Lihat detail tagihan"
            aria-label="Lihat detail tagihan"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {payment.status === 'completed' && (
            <button
              onClick={() => handleVoidPayment(payment)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
              title="Batalkan pembayaran"
              aria-label="Batalkan pembayaran"
            >
              <NoSymbolIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Pembayaran" subtitle="Kelola transaksi pembayaran dan struk pembayaran" />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Reset Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <input
            type="text"
            placeholder="Cari pembayaran..."
            className="border border-gray-300 rounded-md px-4 py-2 w-96"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Ekspor
            </button>
            <button
              onClick={() => navigate('/admin/payments/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
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
