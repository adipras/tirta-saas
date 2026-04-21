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
import { DataTable } from '../../components/DataTable';
import { usageService } from '../../services/usageService';
import { customerService } from '../../services/customerService';
import type { WaterPemakaian, WaterPemakaianFilters } from '../../types/usage';
import type { Customer } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import { PageHeader, ConfirmModal } from '../../components';

export default function PemakaianList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [waterPemakaians, setWaterPemakaians] = useState<WaterPemakaian[]>([]);
  const [customers, setPelanggan] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [_totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [filters, setFilters] = useState<WaterPemakaianFilters>({
    customerId: undefined,
    usageMonth: undefined,
  });

  const fetchWaterPemakaians = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usageService.getWaterPemakaians(
        currentPage, 
        10, 
        filters
      );
      setWaterPemakaians(response.data);
      setTotalPages(response.totalPages);
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

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (_: any, row: WaterPemakaian) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer?.name || '-'}</div>
          <div className="text-sm text-gray-500">{row.customer?.address || '-'}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'usageMonth',
      label: 'Period',
      render: (_: any, row: WaterPemakaian) => formatMonth(row.usageMonth),
      sortable: true,
    },
    {
      key: 'meterNumber',
      label: 'Meter No.',
      render: (_: any, row: WaterPemakaian) => row.customer?.meterNumber || '-',
    },
    {
      key: 'meterStart',
      label: 'Previous',
      render: (_: any, row: WaterPemakaian) => (row.meterStart ?? 0).toFixed(2),
      align: 'right' as const,
    },
    {
      key: 'meterEnd',
      label: 'Current',
      render: (_: any, row: WaterPemakaian) => (row.meterEnd ?? 0).toFixed(2),
      align: 'right' as const,
    },
    {
      key: 'usageM3',
      label: 'Pemakaian (m³)',
      render: (_: any, row: WaterPemakaian) => (
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
      label: 'Amount',
      render: (_: any, row: WaterPemakaian) => formatCurrency(row.amountCalculated),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: WaterPemakaian) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/usage/${row.customerId}/history`)}
            className="text-purple-600 hover:text-purple-900"
            title="View History"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/admin/usage/edit/${row.id}`)}
            className="text-blue-600 hover:text-blue-900"
            title="Edit"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-900"
            title="Delete"
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
      <PageHeader title="Pemakaian Air" subtitle="Track and manage water meter readings and usage calculations" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Records
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {waterPemakaians.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Pemakaian
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalPemakaian.toFixed(2)} m³
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(totalAmount)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Anomalies
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {anomaliesCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-700 hover:text-gray-900 mb-3"
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
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
                  Period
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
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/admin/usage/bulk-import')}
          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
        >
          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
          Bulk Import
        </button>
        <button
          onClick={() => navigate('/admin/usage/create')}
          className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Meter Reading
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={waterPemakaians}
          loading={loading}
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
