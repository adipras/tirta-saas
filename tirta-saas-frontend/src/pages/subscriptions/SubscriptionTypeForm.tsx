import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { subscriptionService } from '../../services/subscriptionService';
import type { SubscriptionTypeFormData } from '../../types/subscription';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function SubscriptionTypeForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubscriptionTypeFormData>({
    name: '',
    description: '',
    registrationFee: '',
    monthlyFee: '',
    maintenanceFee: '',
    lateFeePercentage: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SubscriptionTypeFormData, string>>>({});

  useEffect(() => {
    if (isEditMode && id) {
      fetchSubscriptionType(id);
    }
  }, [id, isEditMode]);

  const fetchSubscriptionType = async (typeId: string) => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscriptionType(typeId);
      setFormData({
        name: data.name,
        description: data.description || '',
        registration_fee: data.registration_fee.toString(),
        monthly_fee: data.monthly_fee.toString(),
        maintenance_fee: data.maintenance_fee.toString(),
        late_fee_per_day: data.late_fee_per_day.toString(),
        max_late_fee: data.max_late_fee.toString(),
      });
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch subscription type',
      }));
      console.error('Error fetching subscription type:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubscriptionTypeFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Registration Fee is required
    if (!formData.registration_fee || formData.registration_fee.trim() === '') {
      newErrors.registration_fee = 'Registration fee is required';
    } else {
      const registrationFee = parseFloat(formData.registration_fee);
      if (isNaN(registrationFee) || registrationFee < 0) {
        newErrors.registration_fee = 'Registration fee must be a non-negative number';
      }
    }

    // Monthly Fee is required
    if (!formData.monthly_fee || formData.monthly_fee.trim() === '') {
      newErrors.monthly_fee = 'Monthly fee is required';
    } else {
      const monthlyFee = parseFloat(formData.monthly_fee);
      if (isNaN(monthlyFee) || monthlyFee < 0) {
        newErrors.monthly_fee = 'Monthly fee must be a non-negative number';
      }
    }

    // Maintenance Fee (optional, default to 0)
    if (formData.maintenance_fee && formData.maintenance_fee.trim() !== '') {
      const maintenanceFee = parseFloat(formData.maintenance_fee);
      if (isNaN(maintenanceFee) || maintenanceFee < 0) {
        newErrors.maintenance_fee = 'Maintenance fee must be a non-negative number';
      }
    }

    // Late Fee Per Day (optional, default to 0)
    if (formData.late_fee_per_day && formData.late_fee_per_day.trim() !== '') {
      const lateFeePerDay = parseFloat(formData.late_fee_per_day);
      if (isNaN(lateFeePerDay) || lateFeePerDay < 0) {
        newErrors.late_fee_per_day = 'Late fee per day must be a non-negative number';
      }
    }

    // Max Late Fee (optional, default to 0)
    if (formData.max_late_fee && formData.max_late_fee.trim() !== '') {
      const maxLateFee = parseFloat(formData.max_late_fee);
      if (isNaN(maxLateFee) || maxLateFee < 0) {
        newErrors.max_late_fee = 'Max late fee must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof SubscriptionTypeFormData]) {
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
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        registration_fee: parseFloat(formData.registration_fee) || 0,
        monthly_fee: parseFloat(formData.monthly_fee) || 0,
        maintenance_fee: parseFloat(formData.maintenance_fee) || 0,
        late_fee_per_day: parseFloat(formData.late_fee_per_day) || 0,
        max_late_fee: parseFloat(formData.max_late_fee) || 0,
      };

      if (isEditMode && id) {
        await subscriptionService.updateSubscriptionType(id, payload);
        dispatch(addNotification({
          type: 'success',
          message: 'Subscription type updated successfully',
        }));
      } else {
        await subscriptionService.createSubscriptionType(payload);
        dispatch(addNotification({
          type: 'success',
          message: 'Subscription type created successfully',
        }));
      }

      navigate('/admin/subscriptions');
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to ${isEditMode ? 'update' : 'create'} subscription type`,
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
          onClick={() => navigate('/admin/subscriptions')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Subscription Types
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Subscription Type' : 'Create Subscription Type'}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {isEditMode 
            ? 'Update the subscription type details and fee structure'
            : 'Create a new subscription type with fee structure'}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="e.g., Residential, Commercial, Industrial"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
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
                  placeholder="Brief description of this subscription type"
                />
              </div>
            </div>
          </div>

          {/* Fee Structure */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="registration_fee" className="block text-sm font-medium text-gray-700">
                  Registration Fee (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="registration_fee"
                  name="registration_fee"
                  value={formData.registration_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.registration_fee
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.registration_fee && (
                  <p className="mt-1 text-sm text-red-600">{errors.registration_fee}</p>
                )}
              </div>

              <div>
                <label htmlFor="monthly_fee" className="block text-sm font-medium text-gray-700">
                  Monthly Fee (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="monthly_fee"
                  name="monthly_fee"
                  value={formData.monthly_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.monthly_fee
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.monthly_fee && (
                  <p className="mt-1 text-sm text-red-600">{errors.monthly_fee}</p>
                )}
              </div>

              <div>
                <label htmlFor="maintenance_fee" className="block text-sm font-medium text-gray-700">
                  Maintenance Fee (IDR)
                </label>
                <input
                  type="number"
                  id="maintenance_fee"
                  name="maintenance_fee"
                  value={formData.maintenance_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.maintenance_fee
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.maintenance_fee && (
                  <p className="mt-1 text-sm text-red-600">{errors.maintenance_fee}</p>
                )}
              </div>

              <div>
                <label htmlFor="late_fee_per_day" className="block text-sm font-medium text-gray-700">
                  Late Fee Per Day (IDR)
                </label>
                <input
                  type="number"
                  id="late_fee_per_day"
                  name="late_fee_per_day"
                  value={formData.late_fee_per_day}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.late_fee_per_day
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.late_fee_per_day && (
                  <p className="mt-1 text-sm text-red-600">{errors.late_fee_per_day}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Daily late payment fee (IDR per day)
                </p>
              </div>

              <div>
                <label htmlFor="max_late_fee" className="block text-sm font-medium text-gray-700">
                  Max Late Fee (IDR)
                </label>
                <input
                  type="number"
                  id="max_late_fee"
                  name="max_late_fee"
                  value={formData.max_late_fee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.max_late_fee
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.max_late_fee && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_late_fee}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Maximum cap for late fees
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/subscriptions')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
