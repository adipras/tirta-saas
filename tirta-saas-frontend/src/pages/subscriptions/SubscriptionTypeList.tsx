import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import { subscriptionService } from '../../services/subscriptionService';
import type { SubscriptionType } from '../../types/subscription';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function SubscriptionTypeList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getSubscriptionTypes(
        currentPage, 
        10, 
        search || undefined
      );
      setSubscriptionTypes(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch subscription types',
      }));
      console.error('Error fetching subscription types:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, dispatch]);

  useEffect(() => {
    fetchSubscriptionTypes();
  }, [fetchSubscriptionTypes]);

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }

    try {
      await subscriptionService.deleteSubscriptionType(id);
      dispatch(addNotification({
        type: 'success',
        message: 'Subscription type deleted successfully',
      }));
      setDeleteConfirm(null);
      fetchSubscriptionTypes();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to delete subscription type',
      }));
      console.error('Error deleting subscription type:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row: SubscriptionType) => row.description || '-',
    },
    {
      key: 'registrationFee',
      label: 'Registration Fee',
      render: (row: SubscriptionType) => formatCurrency(row.registrationFee),
      align: 'right' as const,
    },
    {
      key: 'monthlyFee',
      label: 'Monthly Fee',
      render: (row: SubscriptionType) => formatCurrency(row.monthlyFee),
      align: 'right' as const,
    },
    {
      key: 'maintenanceFee',
      label: 'Maintenance Fee',
      render: (row: SubscriptionType) => formatCurrency(row.maintenanceFee),
      align: 'right' as const,
    },
    {
      key: 'lateFeePercentage',
      label: 'Late Fee %',
      render: (row: SubscriptionType) => `${row.lateFeePercentage}%`,
      align: 'center' as const,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row: SubscriptionType) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.isActive ? (
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
        </span>
      ),
      align: 'center' as const,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: SubscriptionType) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/subscriptions/edit/${row.id}`)}
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Subscription Types</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage subscription types and their fee structures
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Types
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {subscriptionTypes.length}
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
                <CheckCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Types
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {subscriptionTypes.filter(t => t.isActive).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search subscription types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={() => navigate('/admin/subscriptions/create')}
          className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Subscription Type
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        <DataTable
          columns={columns}
          data={subscriptionTypes}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
