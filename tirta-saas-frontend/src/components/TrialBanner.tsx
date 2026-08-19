import { useEffect, useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';
import type { SubscriptionStatus } from '../services/subscriptionPaymentService';
import { authService } from '../services/authService';
import { useToast } from '../hooks/useToast';
import { extractApiErrorMessage } from '../utils/apiError';

const TrialBanner = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      try {
        const userRole = authService.getUser()?.role;
        if (userRole !== 'tenant_admin') {
          setLoading(false);
          return;
        }
        const data = await subscriptionPaymentService.getSubscriptionStatus();
        setStatus(data);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Status langganan belum bisa dimuat.'));
      } finally {
        setLoading(false);
      }
    };

    void loadSubscriptionStatus();
  }, [toast]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleUpgradeClick = () => {
    navigate('/admin/subscription/upgrade');
  };

  if (loading) return null;
  if (!status) return null;
  if (!['trial', 'pending_verification', 'pending_approval', 'pending_payment'].includes(status.status)) return null;
  if (!isVisible) return null;

  const daysRemaining = status.daysRemaining;
  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200';
  const textColor = isUrgent ? 'text-danger-800' : 'text-warning-800';
  const iconColor = isUrgent ? 'text-danger-500' : 'text-warning-500';
  const buttonBg = isUrgent ? 'btn-danger' : 'inline-flex items-center gap-2 px-4 py-1.5 bg-warning-600 text-white text-[13px] font-semibold rounded-lg transition-all hover:bg-warning-700';

  return (
    <div className={`${bgColor} border-b px-4 py-2.5`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <ExclamationTriangleIcon className={`h-4 w-4 ${iconColor} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            {status.status === 'trial' && (
              <p className={`text-[13px] font-medium ${textColor}`}>
                <span className="font-bold">MODE TRIAL</span> — sisa {daysRemaining} hari
                {isUrgent && ' (Segera upgrade!)'}
              </p>
            )}
            {status.status === 'pending_verification' && (
              <p className={`text-[13px] font-medium ${textColor}`}>
                <span className="font-bold">PEMBAYARAN MENUNGGU VERIFIKASI</span> — sedang diverifikasi
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status.status === 'trial' && (
            <button
              onClick={handleUpgradeClick}
              className={buttonBg}
            >
              Upgrade
            </button>
          )}
          {status.status === 'pending_verification' && (
            <button
              onClick={() => navigate('/admin/subscription/status')}
              className="btn-primary text-[13px] px-3 py-1.5"
            >
              Lihat Status
            </button>
          )}
          <button
            onClick={handleDismiss}
            className={`rounded-lg p-1.5 transition-colors ${textColor} hover:bg-white/50`}
            aria-label="Tutup"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
