import { useEffect, useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';
import type { SubscriptionStatus } from '../services/subscriptionPaymentService';

const TrialBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      // Only load for platform owner role, skip for tenant_admin
      const userRole = localStorage.getItem('user_role');
      if (userRole !== 'platform_owner') {
        setLoading(false);
        return;
      }
      
      const data = await subscriptionPaymentService.getSubscriptionStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleUpgradeClick = () => {
    navigate('/subscription/upgrade');
  };

  // Don't show banner if not loading and (no status or not trial/pending)
  if (loading) return null;
  if (!status) return null;
  if (status.status !== 'trial' && status.status !== 'pending_verification') return null;
  if (!isVisible) return null;

  // Determine banner color based on days remaining
  const daysRemaining = status.daysRemaining;
  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = isUrgent ? 'text-red-800' : 'text-yellow-800';
  const iconColor = isUrgent ? 'text-red-600' : 'text-yellow-600';
  const buttonColor = isUrgent
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-yellow-600 hover:bg-yellow-700 text-white';

  return (
    <div className={`${bgColor} border-b ${textColor} px-4 py-3`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 flex-1">
          <ExclamationTriangleIcon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
          <div className="flex-1">
            {status.status === 'trial' && (
              <p className="text-sm font-medium">
                <span className="font-bold">TRIAL MODE</span> - {daysRemaining} days remaining
                {isUrgent && ' (Upgrade soon to avoid service interruption!)'}
              </p>
            )}
            {status.status === 'pending_verification' && (
              <p className="text-sm font-medium">
                <span className="font-bold">PAYMENT PENDING</span> - Your subscription payment is
                being verified by our team
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {status.status === 'trial' && (
            <button
              onClick={handleUpgradeClick}
              className={`${buttonColor} px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex-shrink-0`}
            >
              Upgrade Now
            </button>
          )}
          {status.status === 'pending_verification' && (
            <button
              onClick={() => navigate('/subscription/status')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex-shrink-0"
            >
              View Status
            </button>
          )}
          <button
            onClick={handleDismiss}
            className={`${textColor} hover:bg-opacity-20 hover:bg-black rounded-md p-1 transition-colors duration-200 flex-shrink-0`}
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
