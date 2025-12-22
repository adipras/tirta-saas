import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { waterRateService } from '../../services/waterRateService';
import { subscriptionService } from '../../services/subscriptionService';
import type { WaterRateFormData } from '../../types/waterRate';
import type { SubscriptionType } from '../../types/subscription';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function WaterRateForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [formData, setFormData] = useState<WaterRateFormData>({
    amount: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    subscriptionId: '',
    categoryId: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WaterRateFormData, string>>>({});

  useEffect(() => {
    fetchSubscriptionTypes();
    if (isEditMode && id) {
      fetchWaterRate(id);
    }
  }, [id, isEditMode]);

  const fetchSubscriptionTypes = async () => {
    try {
      const types = await subscriptionService.getAllSubscriptionTypes();
      setSubscriptionTypes(types.filter(t => t.isActive));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch subscription types',
      }));
      console.error('Error fetching subscription types:', error);
    }
  };

  const fetchWaterRate = async (rateId: string) => {
    try {
      setLoading(true);
      const data = await waterRateService.getWaterRate(rateId);
      setFormData({
        amount: data.amount.toString(),
        effectiveDate: data.effectiveDate.split('T')[0],
        subscriptionId: data.subscriptionId,
        categoryId: data.categoryId || '',
        description: data.description || '',
      });
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch water rate',
      }));
      console.error('Error fetching water rate:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WaterRateFormData, string>> = {};

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Rate per m³ must be a positive number';
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required';
    } else {
      const selectedDate = new Date(formData.effectiveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!isEditMode && selectedDate < today) {
        newErrors.effectiveDate = 'Effective date cannot be in the past';
      }
    }

    if (!formData.subscriptionId) {
      newErrors.subscriptionId = 'Subscription type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof WaterRateFormData]) {
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
        amount: parseFloat(formData.amount),
        effectiveDate: formData.effectiveDate,
        subscriptionId: formData.subscriptionId,
        categoryId: formData.categoryId || undefined,
        description: formData.description.trim() || undefined,
      };

      if (isEditMode && id) {
        await waterRateService.updateWaterRate(id, payload);
        dispatch(addNotification({
          type: 'success',
          message: 'Water rate updated successfully',
        }));
      } else {
        await waterRateService.createWaterRate(payload);
        dispatch(addNotification({
          type: 'success',
          message: 'Water rate created successfully',
        }));
      }

      navigate('/admin/water-rates');
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to ${isEditMode ? 'update' : 'create'} water rate`,
      }));
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/water-rates')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Water Rates
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Water Rate' : 'Create Water Rate'}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {isEditMode 
            ? 'Update the water rate per cubic meter'
            : 'Set a new water rate per cubic meter for a subscription type'}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rate Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subscriptionId" className="block text-sm font-medium text-gray-700">
                  Subscription Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="subscriptionId"
                  name="subscriptionId"
                  value={formData.subscriptionId}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.subscriptionId
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } ${isEditMode ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Select subscription type</option>
                  {subscriptionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.subscriptionId && (
                  <p className="mt-1 text-sm text-red-600">{errors.subscriptionId}</p>
                )}
                {isEditMode && (
                  <p className="mt-1 text-sm text-gray-500">
                    Subscription type cannot be changed after creation
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Rate per m³ (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.amount
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="e.g., 5000"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Price charged per cubic meter of water usage
                </p>
              </div>

              <div>
                <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.effectiveDate
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.effectiveDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Date when this rate becomes active
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Optional description or notes about this rate"
                />
              </div>
            </div>
          </div>

          {/* Important Notice */}
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
                  <strong>Important:</strong> Setting a new rate will not automatically deactivate 
                  existing rates. Make sure to deactivate old rates if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/water-rates')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Rate' : 'Create Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
