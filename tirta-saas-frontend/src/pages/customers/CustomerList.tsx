import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '../../components/DataTable';
import customerService from '../../services/customerService';
import type { Customer, CustomerFilters, SubscriptionType } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function CustomerList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  
  const [filters, setFilters] = useState({
    isActive: '' as boolean | '',
    subscriptionTypeId: '',
    hasOutstandingBalance: '',
    search: '',
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams: CustomerFilters = {
        isActive: filters.isActive === '' ? undefined : filters.isActive,
        subscriptionTypeId: filters.subscriptionTypeId || undefined,
        hasOutstandingBalance: filters.hasOutstandingBalance === 'true' ? true : 
                               filters.hasOutstandingBalance === 'false' ? false : undefined,
        search: filters.search || undefined,
      };

      const response = await customerService.getCustomers(currentPage, 10, filterParams);
      setCustomers(response.data);
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch customers',
      }));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, dispatch]);

  useEffect(() => {
    fetchCustomers();
    fetchSubscriptionTypes();
  }, [currentPage, filters, fetchCustomers]);

  const fetchSubscriptionTypes = async () => {
    try {
      const types = await customerService.getSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch (error) {
      console.error('Failed to fetch subscription types:', error);
    }
  };

  const handleStatusChange = async (customerId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await customerService.activateCustomer(customerId);
      } else {
        await customerService.deactivateCustomer(customerId);
      }
      
      dispatch(addNotification({
        type: 'success',
        message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
      }));
      
      fetchCustomers();
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update customer status',
      }));
    }
  };

  const handleExport = async () => {
    try {
      const exportFilters: CustomerFilters = {
        isActive: filters.isActive === '' ? undefined : filters.isActive,
        subscriptionTypeId: filters.subscriptionTypeId || undefined,
        hasOutstandingBalance: filters.hasOutstandingBalance === 'true' ? true : 
                               filters.hasOutstandingBalance === 'false' ? false : undefined,
        search: filters.search || undefined,
      };
      const blob = await customerService.exportCustomers(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Customers exported successfully',
      }));
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to export customers',
      }));
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="mr-1 h-3 w-3" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="mr-1 h-3 w-3" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const columns = [
    {
      key: 'meter_number',
      label: 'Meter Number',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'subscription',
      label: 'Subscription',
      sortable: true,
      render: (_value: any, item: Customer) => item.subscription?.name || '-',
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (isActive: boolean) => getStatusBadge(isActive),
    },
  ];

  const actions = (customer: Customer) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('View customer:', customer.id);
          navigate(`/admin/customers/${customer.id}`);
        }}
        className="text-blue-600 hover:text-blue-900"
        title="View Details"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Edit customer:', customer.id);
          navigate(`/admin/customers/${customer.id}/edit`);
        }}
        className="text-gray-600 hover:text-gray-900"
        title="Edit"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      {/* Toggle Switch */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleStatusChange(customer.id, !customer.is_active);
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          customer.is_active ? 'bg-green-600' : 'bg-gray-300'
        }`}
        title={customer.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            customer.is_active ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="mr-2 h-4 w-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => navigate('/admin/customers/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.isActive === '' ? '' : filters.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value === '' ? '' : e.target.value === 'active' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Subscription Type</label>
              <select
                value={filters.subscriptionTypeId}
                onChange={(e) => setFilters({ ...filters, subscriptionTypeId: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
              <label className="block text-sm font-medium text-gray-700">Outstanding Balance</label>
              <select
                value={filters.hasOutstandingBalance}
                onChange={(e) => setFilters({ ...filters, hasOutstandingBalance: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">All</option>
                <option value="true">With Balance</option>
                <option value="false">No Balance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Name, email, phone..."
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setFilters({
                isActive: '' as boolean | '',
                subscriptionTypeId: '',
                hasOutstandingBalance: '',
                search: '',
              })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={customers}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={false}
          pageSize={10}
          emptyMessage="No customers found"
        />
      </div>
    </div>
  );
}