import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import type { CreateCustomerDto, UpdateCustomerDto, SubscriptionType } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  meterNumber?: string;
  subscriptionTypeId: string;
}

interface CustomerFormProps {
  mode: 'create' | 'edit';
}

export default function CustomerForm({ mode }: CustomerFormProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>();

  useEffect(() => {
    fetchSubscriptionTypes();
    if (mode === 'edit' && id) {
      fetchCustomer(id);
    }
  }, [mode, id]);

  const fetchSubscriptionTypes = async () => {
    try {
      const types = await customerService.getSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch subscription types',
      }));
    }
  };

  const fetchCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      const customer = await customerService.getCustomerById(customerId);
      
      reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        meterNumber: customer.meterNumber || '',
        subscriptionTypeId: customer.subscriptionType.id,
      });
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch customer details',
      }));
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setSaving(true);
      
      if (mode === 'create') {
        await customerService.createCustomer(data as CreateCustomerDto);
        dispatch(addNotification({
          type: 'success',
          message: 'Customer created successfully',
        }));
      } else if (mode === 'edit' && id) {
        await customerService.updateCustomer(id, data as UpdateCustomerDto);
        dispatch(addNotification({
          type: 'success',
          message: 'Customer updated successfully',
        }));
      }
      
      navigate('/admin/customers');
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to ${mode} customer`,
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/customers')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Customers
        </button>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {mode === 'create' 
                ? 'Register a new customer in the system.'
                : 'Update customer information and settings.'
              }
            </p>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      {...register('name', { required: true })}
                      type="text"
                      id="name"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">Name is required</p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      id="email"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      id="phone"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="subscriptionTypeId" className="block text-sm font-medium text-gray-700">
                      Subscription Type *
                    </label>
                    <select
                      {...register('subscriptionTypeId')}
                      id="subscriptionTypeId"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select subscription type</option>
                      {subscriptionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - ${type.monthlyFee}/month
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Street Address *
                    </label>
                    <input
                      {...register('address')}
                      type="text"
                      id="address"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City *
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      id="city"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="New York"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      Postal Code *
                    </label>
                    <input
                      {...register('postalCode')}
                      type="text"
                      id="postalCode"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="10001"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="meterNumber" className="block text-sm font-medium text-gray-700">
                      Meter Number
                    </label>
                    <input
                      {...register('meterNumber')}
                      type="text"
                      id="meterNumber"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="WM001234 (optional)"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Water meter number (can be assigned later)
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/customers')}
                  className="bg-white border border-gray-300 rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}