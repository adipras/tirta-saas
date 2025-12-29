import { useEffect, useState } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService';
import type { SubscriptionStatus } from '../../services/subscriptionPaymentService';

const SubscriptionStatusPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const data = await subscriptionPaymentService.getSubscriptionStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (currentStatus: string) => {
    const badges = {
      trial: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <ClockIcon className="w-4 h-4" />,
        text: 'Trial',
      },
      pending_verification: {
        color: 'bg-blue-100 text-blue-800',
        icon: <ClockIcon className="w-4 h-4" />,
        text: 'Pending Verification',
      },
      active: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircleIcon className="w-4 h-4" />,
        text: 'Active',
      },
      expired: {
        color: 'bg-red-100 text-red-800',
        icon: <ExclamationCircleIcon className="w-4 h-4" />,
        text: 'Expired',
      },
      suspended: {
        color: 'bg-gray-100 text-gray-800',
        icon: <ExclamationCircleIcon className="w-4 h-4" />,
        text: 'Suspended',
      },
    };

    const badge = badges[currentStatus as keyof typeof badges] || badges.trial;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load status</h3>
          <p className="mt-1 text-sm text-gray-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscription Status</h1>

      {/* Current Status Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            {getStatusBadge(status.status)}
          </div>

          {status.status === 'trial' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trial Expires</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(status.trialEndDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Days Remaining</span>
                <span className={`text-sm font-bold ${status.daysRemaining <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                  {status.daysRemaining} days
                </span>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/subscription/upgrade')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Upgrade to Premium
                </button>
              </div>
            </>
          )}

          {status.status === 'active' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plan</span>
                <span className="text-sm font-medium text-gray-900">{status.subscriptionPlan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Started</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(status.subscriptionStart)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expires</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(status.subscriptionEnd)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Days Remaining</span>
                <span className="text-sm font-medium text-gray-900">{status.daysRemaining} days</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending Payment Card */}
      {status.pendingPayment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-900">Pending Subscription Payment</h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>
                  <span className="font-medium">Payment ID:</span> #{status.pendingPayment.id}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {status.pendingPayment.status.toUpperCase()}
                </p>
                <p>
                  <span className="font-medium">Submitted:</span>{' '}
                  {formatDate(status.pendingPayment.submittedAt)}
                </p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-blue-800">
                  ⏳ Your payment is being verified by our team. You will be notified once verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expired/Suspended Warning */}
      {(status.status === 'expired' || status.status === 'suspended') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-900">
                {status.status === 'expired' ? 'Trial Expired' : 'Account Suspended'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {status.status === 'expired' ? (
                  <p>Your trial period has ended. Please upgrade to continue using the service.</p>
                ) : (
                  <p>Your account has been suspended. Please contact support for assistance.</p>
                )}
              </div>
              {status.status === 'expired' && (
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/subscription/upgrade')}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <div className="flex items-start">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-gray-900">Need Help?</h4>
            <p className="mt-1 text-sm text-gray-600">
              If you have any questions about your subscription or payment, please contact our support
              team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusPage;
