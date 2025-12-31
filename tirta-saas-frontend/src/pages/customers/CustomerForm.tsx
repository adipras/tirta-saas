import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import type { CreateCustomerDto, UpdateCustomerDto, SubscriptionType } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

interface CustomerFormData {
  meter_number: string;
  name: string;
  email: string;
  password: string;
  subscription_id: string;
  phone?: string;
  address?: string;
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
        meter_number: customer.meter_number,
        name: customer.name,
        email: customer.email,
        password: '', // Cannot edit password
        subscription_id: customer.subscription_id,
        phone: customer.phone || '',
        address: customer.address || '',
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
                  {/* Meter Number */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="meter_number" className="block text-sm font-medium text-gray-700">
                      Meter Number *
                    </label>
                    <input
                      {...register('meter_number', { required: 'Meter number is required' })}
                      type="text"
                      id="meter_number"
                      disabled={mode === 'edit'}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                      placeholder="MTR-001"
                    />
                    {errors.meter_number && (
                      <p className="mt-2 text-sm text-red-600">{errors.meter_number.message}</p>
                    )}
                  </div>

                  {/* Name */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      type="text"
                      id="name"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      id="email"
                      disabled={mode === 'edit'}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password (Create mode only) */}
                  {mode === 'create' && (
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password *
                      </label>
                      <input
                        {...register('password', { 
                          required: mode === 'create' ? 'Password is required' : false,
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                        type="password"
                        id="password"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Min. 6 characters"
                      />
                      {errors.password && (
                        <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        Customer will use this password to login
                      </p>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      id="phone"
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="081234567890"
                    />
                  </div>

                  {/* Subscription Type */}
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="subscription_id" className="block text-sm font-medium text-gray-700">
                      Subscription Type *
                    </label>
                    <select
                      {...register('subscription_id', { required: 'Subscription type is required' })}
                      id="subscription_id"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select subscription type</option>
                      {subscriptionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - Rp {type.monthly_fee.toLocaleString()}/bulan
                        </option>
                      ))}
                    </select>
                    {errors.subscription_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.subscription_id.message}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      {...register('address')}
                      id="address"
                      rows={3}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Jl. Contoh No. 123, RT 01 RW 05"
                    />
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