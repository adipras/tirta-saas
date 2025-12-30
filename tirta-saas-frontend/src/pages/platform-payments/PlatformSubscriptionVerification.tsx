import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  BuildingOfficeIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { platformSubscriptionService } from '../../services/platformSubscriptionService';
import type { SubscriptionPayment } from '../../services/platformSubscriptionService';

export default function PlatformSubscriptionVerification() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SubscriptionPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPayment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'verify' | 'reject' | 'view'>('view');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadPayments();
  }, [filterStatus]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = payments.filter(
        (p) =>
          p.tenant?.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tenant?.villageCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(payments);
    }
  }, [searchTerm, payments]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const statusFilter = filterStatus === 'all' ? undefined : filterStatus;
      const data = await platformSubscriptionService.getSubscriptionPayments(statusFilter);
      setPayments(data);
      setFilteredPayments(data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setError(err.response?.data?.error || 'Failed to load subscription payments');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (payment: SubscriptionPayment, action: 'verify' | 'reject' | 'view') => {
    setSelectedPayment(payment);
    setModalAction(action);
    setNotes('');
    setRejectionReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
    setNotes('');
    setRejectionReason('');
  };

  const handleAction = async () => {
    if (!selectedPayment) return;

    if (modalAction === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      if (modalAction === 'verify') {
        await platformSubscriptionService.verifyPayment(selectedPayment.id, { notes });
        alert('Payment verified successfully! Tenant has been activated.');
      } else if (modalAction === 'reject') {
        await platformSubscriptionService.rejectPayment(selectedPayment.id, { reason: rejectionReason });
        alert('Payment rejected. Tenant has been notified.');
      }

      // Reload payments to get updated data
      await loadPayments();
      closeModal();
    } catch (err: any) {
      console.error('Action failed:', err);
      setError(err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    };
    const { bg, text, label } = config[status as keyof typeof config] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>;
  };

  const getPlanBadge = (plan: string) => {
    const config = {
      BASIC: { bg: 'bg-blue-100', text: 'text-blue-800' },
      PRO: { bg: 'bg-purple-100', text: 'text-purple-800' },
      ENTERPRISE: { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    const { bg, text } = config[plan as keyof typeof config] || config.BASIC;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{plan}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Payment Verification</h1>
        <p className="text-gray-600 mt-1">Verify tenant subscription payment confirmations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold">{payments.filter((p) => p.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold">{payments.filter((p) => p.status === 'verified').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold">{payments.filter((p) => p.status === 'rejected').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tenant name or village code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No subscription payments found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.tenant?.organizationName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{payment.tenant?.villageCode || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getPlanBadge(payment.subscriptionPlan)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {payment.billingPeriod} {payment.billingPeriod === 1 ? 'month' : 'months'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.paymentDate)}</td>
                  <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button
                      onClick={() => openModal(payment, 'view')}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    {payment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openModal(payment, 'verify')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => openModal(payment, 'reject')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {modalAction === 'view' && 'Subscription Payment Details'}
                {modalAction === 'verify' && 'Verify Subscription Payment'}
                {modalAction === 'reject' && 'Reject Subscription Payment'}
              </h3>

              <div className="space-y-4">
                {/* Tenant Info */}
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                  <h4 className="font-semibold text-gray-900 mb-2">Tenant Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Tenant Name</p>
                      <p className="font-medium">{selectedPayment.tenant?.organizationName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Village Code</p>
                      <p className="font-medium">{selectedPayment.tenant?.villageCode || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-600">Subscription Plan</p>
                    {getPlanBadge(selectedPayment.subscriptionPlan)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-lg text-blue-600">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Billing Period</p>
                    <p className="font-medium">{selectedPayment.billingPeriod} {selectedPayment.billingPeriod === 1 ? 'month' : 'months'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted Date</p>
                    <p className="font-medium">{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-600">Payment Date</p>
                    <p className="font-medium">{formatDate(selectedPayment.paymentDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  {selectedPayment.accountNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Account Number</p>
                      <p className="font-medium">{selectedPayment.accountNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Account Name</p>
                    <p className="font-medium">{selectedPayment.accountName}</p>
                  </div>
                  {selectedPayment.referenceNumber && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Reference Number</p>
                      <p className="font-medium">{selectedPayment.referenceNumber}</p>
                    </div>
                  )}
                  {selectedPayment.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Notes from Tenant</p>
                      <p className="font-medium">{selectedPayment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Payment Proof */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Proof</p>
                  <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                    {selectedPayment.proofUrl.endsWith('.pdf') ? (
                      <div className="text-center">
                        <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">PDF Document</p>
                        <a
                          href={selectedPayment.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={selectedPayment.proofUrl}
                        alt="Payment proof"
                        className="max-h-96 mx-auto rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Notes Input */}
                {modalAction !== 'view' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {modalAction === 'verify' ? 'Verification Notes (Optional)' : 'Rejection Reason *'}
                    </label>
                    <textarea
                      value={modalAction === 'verify' ? notes : rejectionReason}
                      onChange={(e) => modalAction === 'verify' ? setNotes(e.target.value) : setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={modalAction === 'verify' ? 'Add notes...' : 'Enter rejection reason...'}
                      required={modalAction === 'reject'}
                    />
                    {modalAction === 'verify' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Upon verification, tenant status will be updated to ACTIVE and subscription will be activated.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                {modalAction !== 'view' && (
                  <button
                    onClick={handleAction}
                    disabled={isSubmitting || (modalAction === 'reject' && !rejectionReason.trim())}
                    className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                      modalAction === 'verify'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : modalAction === 'verify' ? 'Verify & Activate' : 'Reject Payment'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
