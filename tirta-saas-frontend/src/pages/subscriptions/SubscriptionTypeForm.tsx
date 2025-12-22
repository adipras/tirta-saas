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
        registrationFee: data.registrationFee.toString(),
        monthlyFee: data.monthlyFee.toString(),
        maintenanceFee: data.maintenanceFee.toString(),
        lateFeePercentage: data.lateFeePercentage.toString(),
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

    const registrationFee = parseFloat(formData.registrationFee);
    if (isNaN(registrationFee) || registrationFee < 0) {
      newErrors.registrationFee = 'Registration fee must be a non-negative number';
    }

    const monthlyFee = parseFloat(formData.monthlyFee);
    if (isNaN(monthlyFee) || monthlyFee < 0) {
      newErrors.monthlyFee = 'Monthly fee must be a non-negative number';
    }

    const maintenanceFee = parseFloat(formData.maintenanceFee);
    if (isNaN(maintenanceFee) || maintenanceFee < 0) {
      newErrors.maintenanceFee = 'Maintenance fee must be a non-negative number';
    }

    const lateFeePercentage = parseFloat(formData.lateFeePercentage);
    if (isNaN(lateFeePercentage) || lateFeePercentage < 0 || lateFeePercentage > 100) {
      newErrors.lateFeePercentage = 'Late fee percentage must be between 0 and 100';
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
        registrationFee: parseFloat(formData.registrationFee),
        monthlyFee: parseFloat(formData.monthlyFee),
        maintenanceFee: parseFloat(formData.maintenanceFee),
        lateFeePercentage: parseFloat(formData.lateFeePercentage),
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
                <label htmlFor="registrationFee" className="block text-sm font-medium text-gray-700">
                  Registration Fee (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="registrationFee"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.registrationFee
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.registrationFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationFee}</p>
                )}
              </div>

              <div>
                <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700">
                  Monthly Fee (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="monthlyFee"
                  name="monthlyFee"
                  value={formData.monthlyFee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.monthlyFee
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.monthlyFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.monthlyFee}</p>
                )}
              </div>

              <div>
                <label htmlFor="maintenanceFee" className="block text-sm font-medium text-gray-700">
                  Maintenance Fee (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="maintenanceFee"
                  name="maintenanceFee"
                  value={formData.maintenanceFee}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.maintenanceFee
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.maintenanceFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.maintenanceFee}</p>
                )}
              </div>

              <div>
                <label htmlFor="lateFeePercentage" className="block text-sm font-medium text-gray-700">
                  Late Fee Percentage (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="lateFeePercentage"
                  name="lateFeePercentage"
                  value={formData.lateFeePercentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.lateFeePercentage
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.lateFeePercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.lateFeePercentage}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Percentage applied to overdue invoices
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
