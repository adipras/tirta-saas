import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import { usageService } from '../../services/usageService';
import { customerService } from '../../services/customerService';
import type { WaterPemakaian, WaterPemakaianFilters } from '../../types/usage';
import type { Customer } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import { DashboardStatCard, PageHeader, ConfirmModal } from '../../components';

export default function PemakaianList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [waterPemakaians, setWaterPemakaians] = useState<WaterPemakaian[]>([]);
  const [customers, setPelanggan] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [filters, setFilters] = useState<WaterPemakaianFilters>({
    customerId: undefined,
    usageMonth: undefined,
  });
  const hasActiveFilters = Boolean(filters.customerId || filters.usageMonth);

  const fetchWaterPemakaians = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usageService.getWaterPemakaians(
        currentPage, 
        10, 
        filters
      );
      setWaterPemakaians(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch water usages',
      }));
      console.error('Error fetching water usages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, dispatch]);

  const fetchPelanggan = useCallback(async () => {
    try {
      const response = await customerService.getPelanggan(1, 1000, { isActive: true });
      setPelanggan(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  useEffect(() => {
    fetchWaterPemakaians();
  }, [fetchWaterPemakaians]);

  useEffect(() => {
    fetchPelanggan();
  }, [fetchPelanggan]);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usageService.deleteWaterPemakaian(deleteTarget);
      dispatch(addNotification({
        type: 'success',
        message: 'Water usage deleted successfully',
      }));
      setDeleteTarget(null);
      fetchWaterPemakaians();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete water usage',
      }));
      console.error('Error deleting water usage:', error);
    }
  };

  const handleFilterChange = (key: keyof WaterPemakaianFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      customerId: undefined,
      usageMonth: undefined,
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (month: string | undefined): string => {
    if (!month) return '-';
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
    });
  };

  const columns: Column<WaterPemakaian>[] = [
    {
      key: 'customer',
      label: 'Pelanggan',
      render: (_value: unknown, row: WaterPemakaian) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer?.name || '-'}</div>
          <div className="text-sm text-gray-500">{row.customer?.address || '-'}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'usageMonth',
      label: 'Periode',
      render: (_value: unknown, row: WaterPemakaian) => formatMonth(row.usageMonth),
      sortable: true,
    },
    {
      key: 'meterNumber',
      label: 'No. Meter',
      render: (_value: unknown, row: WaterPemakaian) => row.customer?.meterNumber || '-',
    },
    {
      key: 'meterStart',
      label: 'Meter Awal',
      hideOnMobile: true,
      render: (_value: unknown, row: WaterPemakaian) => (row.meterStart ?? 0).toFixed(2),
      align: 'right' as const,
    },
    {
      key: 'meterEnd',
      label: 'Meter Akhir',
      hideOnMobile: true,
      render: (_value: unknown, row: WaterPemakaian) => (row.meterEnd ?? 0).toFixed(2),
      align: 'right' as const,
    },
    {
      key: 'usageM3',
      label: 'Pemakaian (m³)',
      render: (_value: unknown, row: WaterPemakaian) => (
        <div className="flex items-center justify-end">
          <span className="font-medium">{(row.usageM3 ?? 0).toFixed(2)}</span>
          {row.isAnomaly && (
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 ml-2" title="Anomaly detected" />
          )}
        </div>
      ),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'amountCalculated',
      label: 'Nominal',
      render: (_value: unknown, row: WaterPemakaian) => formatCurrency(row.amountCalculated),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_value: unknown, row: WaterPemakaian) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/admin/usage/${row.customerId}/history`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-purple-200 text-purple-600 transition hover:bg-purple-50"
            title="Lihat riwayat"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/admin/usage/edit/${row.id}`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition hover:bg-blue-50"
            title="Ubah data"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
            title="Hapus data"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  const totalPemakaian = waterPemakaians.reduce((sum, usage) => sum + usage.usageM3, 0);
  const totalAmount = waterPemakaians.reduce((sum, usage) => sum + usage.amountCalculated, 0);
  const anomaliesCount = waterPemakaians.filter(u => u.isAnomaly).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemakaian Air"
        subtitle="Pantau pencatatan meter, nominal pemakaian, dan anomali dengan tampilan yang lebih nyaman di mobile."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Data tampil"
          value={loading ? '...' : waterPemakaians.length.toLocaleString('id-ID')}
          helper={hasActiveFilters ? 'Daftar sedang difilter' : 'Semua item pada halaman'}
          subtitle="Jumlah catatan pemakaian yang sedang tampil pada daftar aktif."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Total pemakaian"
          value={loading ? '...' : `${totalPemakaian.toFixed(2)} m3`}
          subtitle="Akumulasi pemakaian dari catatan yang sedang tampil pada daftar."
          icon={ChartBarIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total nominal"
          value={loading ? '...' : formatCurrency(totalAmount)}
          subtitle="Ringkasan nominal hasil perhitungan pemakaian pada daftar aktif."
          icon={PlusIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Anomali"
          value={loading ? '...' : anomaliesCount.toLocaleString('id-ID')}
          subtitle="Catatan yang terindikasi anomali agar bisa ditinjau lebih dulu."
          icon={ExclamationTriangleIcon}
          tone="yellow"
        />
      </div>

      <div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mb-3 flex items-center text-sm text-gray-700 hover:text-gray-900"
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          {showFilters ? 'Tutup Filter' : 'Filter'}
        </button>

        {showFilters && (
          <div className="mb-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Filter pemakaian</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Saring catatan pemakaian berdasarkan pelanggan atau periode pencatatan.
                </p>
              </div>
              {hasActiveFilters && (
                <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Filter aktif
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pelanggan
                </label>
                <select
                  value={filters.customerId || ''}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Pelanggan</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.meter_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periode
                </label>
                <input
                  type="month"
                  value={filters.usageMonth || ''}
                  onChange={(e) => handleFilterChange('usageMonth', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/admin/usage/bulk-import')}
          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
        >
          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
          Import Massal
        </button>
        <button
          onClick={() => navigate('/admin/usage/create')}
          className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Tambah Catatan Meter
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={waterPemakaians}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada data pemakaian yang sesuai dengan filter"
          onRowClick={(row) => navigate(`/admin/usage/${row.customerId}/history`)}
        />
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Data Pemakaian"
        message="Apakah kamu yakin ingin menghapus data pemakaian air ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
