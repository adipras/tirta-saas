import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';

interface SubscriptionPlan {
  id: string;
  plan: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  max_users: number;
  max_customers: number;
  max_storage_gb: number;
  max_api_calls_per_day: number;
  features: string[];
  trial_days: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    plan: '',
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    max_users: 0,
    max_customers: 0,
    max_storage_gb: 0,
    max_api_calls_per_day: 0,
    features: '',
    trial_days: 0,
    display_order: 0,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/platform/subscription-plans');
      setPlans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      plan: '',
      name: '',
      description: '',
      monthly_price: 0,
      yearly_price: 0,
      max_users: 0,
      max_customers: 0,
      max_storage_gb: 0,
      max_api_calls_per_day: 0,
      features: '',
      trial_days: 0,
      display_order: 0,
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan: plan.plan,
      name: plan.name,
      description: plan.description,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      max_users: plan.max_users,
      max_customers: plan.max_customers,
      max_storage_gb: plan.max_storage_gb,
      max_api_calls_per_day: plan.max_api_calls_per_day,
      features: plan.features.join('\n'),
      trial_days: plan.trial_days,
      display_order: plan.display_order,
      is_active: plan.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        features: formData.features
          .split('\n')
          .map((f) => f.trim())
          .filter((f) => f),
      };

      if (editingPlan) {
        await apiClient.put(`/platform/subscription-plans/${editingPlan.id}`, payload);
      } else {
        await apiClient.post('/platform/subscription-plans', payload);
      }

      await fetchPlans();
      closeModal();
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      alert(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600 mt-1">
            Manage platform subscription plans and pricing
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg shadow-md border-2 ${
              plan.is_active ? 'border-green-500' : 'border-gray-200'
            } p-6`}
          >
            {/* Plan Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 capitalize">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 uppercase mt-1">{plan.plan}</p>
              </div>
              {plan.is_active ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

            {/* Pricing */}
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(plan.monthly_price)}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </div>
              <div className="text-lg text-gray-700 mt-1">
                {formatCurrency(plan.yearly_price)}
                <span className="text-sm text-gray-600">/year</span>
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-2 mb-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max Users</span>
                <span className="font-medium text-gray-900">
                  {formatNumber(plan.max_users)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max Customers</span>
                <span className="font-medium text-gray-900">
                  {formatNumber(plan.max_customers)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Storage</span>
                <span className="font-medium text-gray-900">
                  {plan.max_storage_gb} GB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">API Calls/Day</span>
                <span className="font-medium text-gray-900">
                  {formatNumber(plan.max_api_calls_per_day)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trial Period</span>
                <span className="font-medium text-gray-900">
                  {plan.trial_days} days
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-4 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Features</h4>
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <button
              onClick={() => openEditModal(plan)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Plan
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No subscription plans found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Create your first plan
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Plan Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., basic, premium"
                  />
                </div>

                {/* Plan Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., Basic Plan"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Price (IDR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.monthly_price}
                      onChange={(e) =>
                        setFormData({ ...formData, monthly_price: Number(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yearly Price (IDR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.yearly_price}
                      onChange={(e) =>
                        setFormData({ ...formData, yearly_price: Number(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Users *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.max_users}
                      onChange={(e) =>
                        setFormData({ ...formData, max_users: Number(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Customers *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.max_customers}
                      onChange={(e) =>
                        setFormData({ ...formData, max_customers: Number(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Storage (GB) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.max_storage_gb}
                      onChange={(e) =>
                        setFormData({ ...formData, max_storage_gb: Number(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max API Calls/Day *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.max_api_calls_per_day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_api_calls_per_day: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trial Days *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.trial_days}
                      onChange={(e) =>
                        setFormData({ ...formData, trial_days: Number(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData({ ...formData, display_order: Number(e.target.value) })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features (one per line)
                  </label>
                  <textarea
                    value={formData.features}
                    onChange={(e) =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active (visible to tenants)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
