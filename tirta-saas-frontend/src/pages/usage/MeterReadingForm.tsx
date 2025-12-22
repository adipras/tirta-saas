import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { usageService } from '../../services/usageService';
import { customerService } from '../../services/customerService';
import type { WaterUsageFormData } from '../../types/usage';
import type { Customer } from '../../types/customer';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function MeterReadingForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [previousReading, setPreviousReading] = useState<number | null>(null);
  const [calculatedUsage, setCalculatedUsage] = useState<number>(0);
  
  const [formData, setFormData] = useState<WaterUsageFormData>({
    customerId: '',
    usageMonth: new Date().toISOString().slice(0, 7),
    meterEnd: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WaterUsageFormData, string>>>({});

  useEffect(() => {
    fetchCustomers();
    if (isEditMode && id) {
      fetchWaterUsage(id);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (formData.customerId && formData.usageMonth && !isEditMode) {
      fetchPreviousReading(formData.customerId, formData.usageMonth);
    }
  }, [formData.customerId, formData.usageMonth, isEditMode]);

  useEffect(() => {
    if (previousReading !== null && formData.meterEnd) {
      const meterEnd = parseFloat(formData.meterEnd);
      if (!isNaN(meterEnd)) {
        setCalculatedUsage(Math.max(0, meterEnd - previousReading));
      }
    }
  }, [previousReading, formData.meterEnd]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers(1, 1000, { status: 'active' });
      setCustomers(response.data);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch customers',
      }));
      console.error('Error fetching customers:', error);
    }
  };

  const fetchPreviousReading = async (customerId: string, usageMonth: string) => {
    try {
      const history = await usageService.getCustomerUsageHistory(customerId);
      if (history.length > 0) {
        const lastReading = history[history.length - 1];
        setPreviousReading(lastReading.meterEnd);
      } else {
        setPreviousReading(0);
      }
    } catch (error) {
      setPreviousReading(0);
      console.error('Error fetching previous reading:', error);
    }
  };

  const fetchWaterUsage = async (usageId: string) => {
    try {
      setLoading(true);
      const data = await usageService.getWaterUsage(usageId);
      setFormData({
        customerId: data.customerId,
        usageMonth: data.usageMonth,
        meterEnd: data.meterEnd.toString(),
        notes: data.notes || '',
      });
      setPreviousReading(data.meterStart);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch water usage',
      }));
      console.error('Error fetching water usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WaterUsageFormData, string>> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.usageMonth) {
      newErrors.usageMonth = 'Usage month is required';
    }

    const meterEnd = parseFloat(formData.meterEnd);
    if (isNaN(meterEnd) || meterEnd < 0) {
      newErrors.meterEnd = 'Current meter reading must be a non-negative number';
    } else if (previousReading !== null && meterEnd < previousReading) {
      newErrors.meterEnd = `Current reading cannot be less than previous reading (${previousReading.toFixed(2)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof WaterUsageFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customerId: formData.customerId,
        usageMonth: formData.usageMonth,
        meterEnd: parseFloat(formData.meterEnd),
        notes: formData.notes.trim() || undefined,
      };

      if (isEditMode && id) {
        await usageService.updateWaterUsage(id, {
          meterEnd: payload.meterEnd,
          notes: payload.notes,
        });
        dispatch(addNotification({
          type: 'success',
          message: 'Meter reading updated successfully',
        }));
      } else {
        await usageService.createWaterUsage(payload);
        dispatch(addNotification({
          type: 'success',
          message: 'Meter reading recorded successfully',
        }));
      }

      navigate('/admin/usage');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error?.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'record'} meter reading`,
      }));
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/usage')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Water Usage
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Meter Reading' : 'Record Meter Reading'}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {isEditMode 
            ? 'Update the meter reading and usage will be recalculated'
            : 'Enter current meter reading to calculate water usage'}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.customerId
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } ${isEditMode ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customerId})
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
                )}
              </div>

              <div>
                <label htmlFor="usageMonth" className="block text-sm font-medium text-gray-700">
                  Usage Month <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  id="usageMonth"
                  name="usageMonth"
                  value={formData.usageMonth}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.usageMonth
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } ${isEditMode ? 'bg-gray-100' : ''}`}
                />
                {errors.usageMonth && (
                  <p className="mt-1 text-sm text-red-600">{errors.usageMonth}</p>
                )}
              </div>

              {selectedCustomer && (
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Meter Number:</span>
                      <span className="ml-2 font-medium">{selectedCustomer.meterNumber || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Subscription:</span>
                      <span className="ml-2 font-medium">{selectedCustomer.subscriptionType.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Meter Reading */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Meter Reading</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Previous Reading
                </label>
                <input
                  type="text"
                  value={previousReading !== null ? previousReading.toFixed(2) : '-'}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  From last month's reading
                </p>
              </div>

              <div>
                <label htmlFor="meterEnd" className="block text-sm font-medium text-gray-700">
                  Current Reading <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="meterEnd"
                  name="meterEnd"
                  value={formData.meterEnd}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.meterEnd
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0.00"
                />
                {errors.meterEnd && (
                  <p className="mt-1 text-sm text-red-600">{errors.meterEnd}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Calculated Usage
                </label>
                <input
                  type="text"
                  value={`${calculatedUsage.toFixed(2)} m³`}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-blue-50 shadow-sm sm:text-sm font-medium text-blue-900"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Automatic calculation
                </p>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Optional notes about this reading"
                />
              </div>
            </div>
          </div>

          {/* Important Notice */}
          {calculatedUsage > 100 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>High Usage Alert:</strong> The calculated usage ({calculatedUsage.toFixed(2)} m³) 
                    is unusually high. Please verify the meter reading is correct.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/usage')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Reading' : 'Record Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
