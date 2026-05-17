import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import customerService from '../../services/customerService';
import type { CreateCustomerDto, UpdateCustomerDto, SubscriptionType } from '../../types/customer';
import { PageHeader } from '../../components';
import { useToast } from '../../components';

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
  const toast = useToast();
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

  const fetchSubscriptionTypes = useCallback(async () => {
    try {
      const types = await customerService.getSubscriptionTypes();
      setSubscriptionTypes(types);
    } catch {
      toast.error('Gagal memuat daftar golongan langganan');
    }
  }, [toast]);

  const fetchCustomer = useCallback(async (customerId: string) => {
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
    } catch {
      toast.error('Gagal memuat data pelanggan');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  }, [navigate, reset, toast]);

  useEffect(() => {
    void fetchSubscriptionTypes();
    if (mode === 'edit' && id) {
      void fetchCustomer(id);
    }
  }, [fetchCustomer, fetchSubscriptionTypes, id, mode]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setSaving(true);
      
      if (mode === 'create') {
        await customerService.createCustomer(data as CreateCustomerDto);
        toast.success('Pelanggan berhasil ditambahkan');
      } else if (mode === 'edit' && id) {
        await customerService.updateCustomer(id, data as UpdateCustomerDto);
        toast.success('Pelanggan berhasil diperbarui');
      }
      
      navigate('/admin/customers');
    } catch {
      toast.error(`Gagal ${mode === 'create' ? 'menambahkan' : 'memperbarui'} pelanggan`);
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
      <PageHeader
        title={mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
        subtitle={mode === 'create' ? 'Register a new customer in the system.' : 'Update customer information and settings.'}
        actions={
          <button
            onClick={() => navigate('/admin/customers')}
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Pelanggan
          </button>
        }
      />

        <div className="md:mt-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Meter Number */}
                  <div>
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
                  <div>
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
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Alamat Email *
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
                    <div>
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
                  <div>
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
                  <div>
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
                  <div className="sm:col-span-2">
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

              <div className="flex flex-col-reverse gap-3 bg-gray-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/admin/customers')}
                  className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
                </button>
              </div>
            </div>
          </form>
        </div>
    </div>
  );
}
