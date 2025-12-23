import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';

interface Tenant {
  id: string;
  name: string;
  village_code: string;
  email: string;
  phone: string;
  address: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  status: string;
  registered_at: string;
  trial_ends_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  subscription_plan?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
}

type TabType = 'pending' | 'all';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  TRIAL: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trial' },
  PENDING_PAYMENT: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Pending Payment',
  },
  PENDING_VERIFICATION: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    label: 'Pending Verification',
  },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
};

const TenantManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'suspend' | 'view'>(
    'view'
  );
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTenants();
  }, [activeTab]);

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/platform/tenants/pending' : '/platform/tenants';
      const response = await apiClient.get(endpoint);
      setTenants(response.data || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (
    tenant: Tenant,
    action: 'approve' | 'reject' | 'suspend' | 'view'
  ) => {
    setSelectedTenant(tenant);
    setModalAction(action);
    setActionReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTenant(null);
    setActionReason('');
  };

  const handleAction = async () => {
    if (!selectedTenant) return;

    setIsSubmitting(true);
    try {
      let endpoint = '';
      let payload: any = {};

      switch (modalAction) {
        case 'approve':
          endpoint = `/platform/tenants/${selectedTenant.id}/approve`;
          payload = { notes: actionReason };
          break;
        case 'reject':
          endpoint = `/platform/tenants/${selectedTenant.id}/reject`;
          payload = { reason: actionReason };
          break;
        case 'suspend':
          endpoint = `/platform/tenants/${selectedTenant.id}/suspend`;
          payload = { reason: actionReason };
          break;
      }

      await apiClient.post(endpoint, payload);

      // Reload tenants
      await loadTenants();
      closeModal();
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusColors[status] || statusColors.INACTIVE;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
        <p className="text-gray-600 mt-1">Manage tenant registrations and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter((t) => t.status === 'TRIAL').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter((t) => t.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Tenants
            </button>
          </nav>
        </div>

        {/* Tenant List */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading tenants...</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-8 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600">No tenants found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial Ends
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.village_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{tenant.admin_name}</div>
                        <div className="text-sm text-gray-500">{tenant.admin_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(tenant.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(tenant.registered_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(tenant.trial_ends_at)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal(tenant, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {tenant.status === 'TRIAL' && (
                        <>
                          <button
                            onClick={() => openModal(tenant, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(tenant, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {tenant.status === 'ACTIVE' && (
                        <button
                          onClick={() => openModal(tenant, 'suspend')}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="mb-4 pb-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalAction === 'view' && 'Tenant Details'}
                  {modalAction === 'approve' && 'Approve Tenant'}
                  {modalAction === 'reject' && 'Reject Tenant'}
                  {modalAction === 'suspend' && 'Suspend Tenant'}
                </h3>
              </div>

              {/* Tenant Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Organization Name</p>
                    <p className="text-sm text-gray-900">{selectedTenant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Village Code</p>
                    <p className="text-sm text-gray-900">{selectedTenant.village_code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{selectedTenant.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{selectedTenant.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{selectedTenant.address}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Administrator
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm text-gray-900">{selectedTenant.admin_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{selectedTenant.admin_email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{selectedTenant.admin_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      {getStatusBadge(selectedTenant.status)}
                    </div>
                  </div>
                </div>

                {/* Action Input */}
                {modalAction !== 'view' && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {modalAction === 'approve' && 'Notes (Optional)'}
                      {modalAction === 'reject' && 'Rejection Reason *'}
                      {modalAction === 'suspend' && 'Suspension Reason *'}
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter ${modalAction} reason...`}
                      required={modalAction !== 'approve'}
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                {modalAction !== 'view' && (
                  <button
                    onClick={handleAction}
                    disabled={
                      isSubmitting ||
                      (modalAction !== 'approve' && !actionReason.trim())
                    }
                    className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                      modalAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : modalAction === 'reject'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {isSubmitting
                      ? 'Processing...'
                      : modalAction === 'approve'
                      ? 'Approve'
                      : modalAction === 'reject'
                      ? 'Reject'
                      : 'Suspend'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
