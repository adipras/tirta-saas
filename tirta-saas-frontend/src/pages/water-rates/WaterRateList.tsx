import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { WaterRate, WaterRateFilters } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function WaterRateList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [waterRates, setWaterRates] = useState<WaterRate[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [filters, setFilters] = useState<WaterRateFilters>({
    subscriptionId: undefined,
    active: undefined,
  });

  const fetchWaterRates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await waterRateService.getWaterRates(
        currentPage, 
        10, 
        filters
      );
      setWaterRates(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch water rates',
      }));
      console.error('Error fetching water rates:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, dispatch]);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    }
  }, []);

  useEffect(() => {
    fetchWaterRates();
  }, [fetchWaterRates]);

  useEffect(() => {
    fetchSubscriptionTypes();
  }, [fetchSubscriptionTypes]);

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }

    try {
      await waterRateService.deleteWaterRate(id);
      dispatch(addNotification({
        type: 'success',
        message: 'Water rate deleted successfully',
      }));
      setDeleteConfirm(null);
      fetchWaterRates();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete water rate',
      }));
      console.error('Error deleting water rate:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await waterRateService.deactivateWaterRate(id);
      } else {
        await waterRateService.activateWaterRate(id);
      }
      dispatch(addNotification({
        type: 'success',
        message: `Water rate ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      }));
      fetchWaterRates();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update water rate status',
      }));
      console.error('Error toggling water rate:', error);
    }
  };

  const handleFilterChange = (key: keyof WaterRateFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      subscriptionId: undefined,
      active: undefined,
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

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const columns = [
    {
      key: 'subscription',
      label: 'Subscription Type',
      render: (row: WaterRate) => row.subscription?.name || '-',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Rate per m³',
      render: (row: WaterRate) => formatCurrency(row.amount),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'effectiveDate',
      label: 'Effective Date',
      render: (row: WaterRate) => formatDate(row.effectiveDate),
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row: WaterRate) => row.description || '-',
    },
    {
      key: 'active',
      label: 'Status',
      render: (row: WaterRate) => (
        <button
          onClick={() => handleToggleActive(row.id, row.active)}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.active
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {row.active ? (
            <>
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircleIcon className="w-4 h-4 mr-1" />
              Inactive
            </>
          )}
        </button>
      ),
      align: 'center' as const,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: WaterRate) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/water-rates/edit/${row.id}`)}
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

  const activeRatesCount = waterRates.filter(r => r.active).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Water Rates</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage water rates per cubic meter for different subscription types
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Rates
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {waterRates.length}
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
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Rates
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {activeRatesCount}
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
                <ClockIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Subscription Types
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {subscriptionTypes.length}
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
                  Subscription Type
                </label>
                <select
                  value={filters.subscriptionId || ''}
                  onChange={(e) => handleFilterChange('subscriptionId', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  {subscriptionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.active === undefined ? '' : filters.active.toString()}
                  onChange={(e) => handleFilterChange('active', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
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
          onClick={() => navigate('/admin/water-rates/history')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ClockIcon className="h-5 w-5 mr-2" />
          View History
        </button>
        <button
          onClick={() => navigate('/admin/water-rates/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Water Rate
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={waterRates}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
