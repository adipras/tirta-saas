import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import type { Customer } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function CustomerDetails() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('CustomerDetails mounted, id:', id);
    if (id) {
      console.log('Fetching customer with id:', id);
      fetchCustomer(id);
    } else {
      console.log('No id found in params');
      setLoading(false);
    }
  }, [id]);

  const fetchCustomer = async (customerId: string) => {
    try {
      console.log('fetchCustomer called with id:', customerId);
      setLoading(true);
      const data = await customerService.getCustomerById(customerId);
      console.log('Customer data received:', data);
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch customer details',
      }));
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newIsActive: boolean) => {
    if (!customer) return;

    try {
      let updatedCustomer;
      if (newIsActive) {
        updatedCustomer = await customerService.activateCustomer(customer.id);
      } else {
        updatedCustomer = await customerService.deactivateCustomer(customer.id);
      }
      
      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        dispatch(addNotification({
          type: 'success',
          message: `Customer ${newIsActive ? 'activated' : 'deactivated'} successfully`,
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update customer status',
      }));
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="mr-2 h-4 w-4" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="mr-2 h-4 w-4" />
            Inactive
          </>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/customers')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Customers
          </button>
        </div>
        <div className="flex items-center space-x-3">
          {/* Toggle Switch */}
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${customer.is_active ? 'text-green-600' : 'text-gray-500'}`}>
              {customer.is_active ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={() => handleStatusChange(!customer.is_active)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                customer.is_active ? 'bg-green-600' : 'bg-gray-300'
              }`}
              title={customer.is_active ? 'Click to deactivate' : 'Click to activate'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  customer.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <button
            onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {customer.name}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Meter Number: {customer.meter_number}
              </p>
            </div>
            {getStatusBadge(customer.is_active)}
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                  {customer.email}
                </a>
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                  {customer.phone}
                </a>
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.address}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Subscription Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.subscription ? (
                  <div>
                    <p className="font-medium">{customer.subscription.name}</p>
                    <p className="text-gray-500">
                      Monthly Fee: Rp {customer.subscription.monthly_fee?.toLocaleString('id-ID') || '-'}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">No subscription assigned</p>
                )}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Meter Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {customer.meter_number}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(customer.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recent Invoices
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      View All
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate(`/admin/invoices?customerId=${customer.id}`)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View invoices
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Payment History
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      View All
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate(`/admin/payments?customerId=${customer.id}`)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View payments
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Water Usage
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      View Trends
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate(`/admin/water-usage?customerId=${customer.id}`)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                View usage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}