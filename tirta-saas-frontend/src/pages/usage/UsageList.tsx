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
import type { WaterUsage, WaterUsageFilters } from '../../types/usage';
import type { Customer } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function UsageList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [waterUsages, setWaterUsages] = useState<WaterUsage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [_totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [filters, setFilters] = useState<WaterUsageFilters>({
    customerId: undefined,
    usageMonth: undefined,
  });

  const fetchWaterUsages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usageService.getWaterUsages(
        currentPage, 
        10, 
        filters
      );
      setWaterUsages(response.data);
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

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customerService.getCustomers(1, 1000, { isActive: true });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  useEffect(() => {
    fetchWaterUsages();
  }, [fetchWaterUsages]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }

    try {
      await usageService.deleteWaterUsage(id);
      dispatch(addNotification({
        type: 'success',
        message: 'Water usage deleted successfully',
      }));
      setDeleteConfirm(null);
      fetchWaterUsages();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete water usage',
      }));
      console.error('Error deleting water usage:', error);
    }
  };

  const handleFilterChange = (key: keyof WaterUsageFilters, value: string) => {
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

  const formatMonth = (month: string): string => {
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
      render: (row: WaterUsage) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer?.name || '-'}</div>
          <div className="text-sm text-gray-500">{row.customer?.customerId || '-'}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'usageMonth',
      label: 'Period',
      render: (row: WaterUsage) => formatMonth(row.usageMonth),
      sortable: true,
    },
    {
      key: 'meterNumber',
      label: 'Meter No.',
      render: (row: WaterUsage) => row.customer?.meterNumber || '-',
    },
    {
      key: 'meterStart',
      label: 'Previous',
      render: (row: WaterUsage) => row.meterStart.toFixed(2),
      align: 'right' as const,
    },
    {
      key: 'meterEnd',
      label: 'Current',
      render: (row: WaterUsage) => row.meterEnd.toFixed(2),
      align: 'right' as const,
    },
    {
      key: 'usageM3',
      label: 'Usage (m³)',
      render: (row: WaterUsage) => (
        <div className="flex items-center justify-end">
          <span className="font-medium">{row.usageM3.toFixed(2)}</span>
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
      render: (row: WaterUsage) => formatCurrency(row.amountCalculated),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: WaterUsage) => (
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
            className={`${
              deleteConfirm === row.id
                ? 'text-red-900 font-bold'
                : 'text-red-600 hover:text-red-900'
            }`}
            title={deleteConfirm === row.id ? 'Click again to confirm' : 'Delete'}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
      align: 'center' as const,
    },
  ];

  const totalUsage = waterUsages.reduce((sum, usage) => sum + usage.usageM3, 0);
  const totalAmount = waterUsages.reduce((sum, usage) => sum + usage.amountCalculated, 0);
  const anomaliesCount = waterUsages.filter(u => u.isAnomaly).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Water Usage</h1>
        <p className="mt-2 text-sm text-gray-700">
          Track and manage water meter readings and usage calculations
        </p>
      </div>

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
                    {waterUsages.length}
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
                    Total Usage
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalUsage.toFixed(2)} m³
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  value={filters.customerId || ''}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Customers</option>
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
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/admin/usage/bulk-import')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
          Bulk Import
        </button>
        <button
          onClick={() => navigate('/admin/usage/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Meter Reading
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={waterUsages}
          loading={loading}
        />
      </div>
    </div>
  );
}
