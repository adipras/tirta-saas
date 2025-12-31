import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { WaterRate } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function WaterRateList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [waterRates, setWaterRates] = useState<WaterRate[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [filterSubscription, setFilterSubscription] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchWaterRates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await waterRateService.getWaterRates(currentPage, 100, {
        subscription_id: filterSubscription || undefined,
        active: filterActive === 'all' ? undefined : filterActive === 'true',
      });
      
      if (response && response.data) {
        setWaterRates(response.data);
        setTotalPages(response.totalPages || 1);
      } else {
        setWaterRates([]);
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch water rates',
      }));
      console.error('Error fetching water rates:', error);
      setWaterRates([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterSubscription, filterActive, dispatch]);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types || []);
    } catch (error) {
      console.error('Error fetching subscription types:', error);
    }
  }, []);

  useEffect(() => {
    fetchWaterRates();
    fetchSubscriptionTypes();
  }, [fetchWaterRates, fetchSubscriptionTypes]);

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
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

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await waterRateService.deactivateWaterRate(id);
      } else {
        await waterRateService.activateWaterRate(id);
      }
      
      dispatch(addNotification({
        type: 'success',
        message: `Water rate ${currentActive ? 'deactivated' : 'activated'} successfully`,
      }));
      fetchWaterRates();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update water rate status',
      }));
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const columns = [
    {
      key: 'subscription',
      label: 'Subscription Type',
      render: (_value: any, row: WaterRate) => row.subscription?.name || '-',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Rate per m³',
      render: (_value: any, row: WaterRate) => formatCurrency(row.amount),
      align: 'right' as const,
      sortable: true,
    },
    {
      key: 'effective_date',
      label: 'Effective Date',
      render: (_value: any, row: WaterRate) => formatDate(row.effective_date),
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      render: (_value: any, row: WaterRate) => row.description || '-',
    },
    {
      key: 'active',
      label: 'Status',
      render: (_value: any, row: WaterRate) => (
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
      render: (_value: any, row: WaterRate) => (
        <div className="flex space-x-2 justify-center">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Water Rates</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage water rates per cubic meter for different subscription types
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/water-rates/create')}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Water Rate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Type
            </label>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
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
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'true' | 'false')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={waterRates}
          loading={loading}
          emptyMessage="No water rates found. Create your first water rate to get started."
        />
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          Showing {waterRates.length} water rate{waterRates.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
