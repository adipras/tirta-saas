import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import TrialBanner from '../components/TrialBanner';
import { authService } from '../services/authService';
import { subscriptionPaymentService } from '../services/subscriptionPaymentService';

// Routes that are accessible even when subscription is PENDING_PAYMENT / PENDING_VERIFICATION
const PAYMENT_ALLOWED_PATHS = [
  '/admin/subscription',
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const showTrialBanner = user?.role === 'tenant_admin';

  useEffect(() => {
    if (user?.role !== 'tenant_admin' || !user?.tenant_id) return;

    const isAllowedPath = PAYMENT_ALLOWED_PATHS.some((p) => location.pathname.startsWith(p));
    if (isAllowedPath) return;

    // Quick check using stored tenant_status (available since last login)
    const status = user.tenant_status?.toUpperCase();
    if (status === 'PENDING_APPROVAL') {
      navigate('/admin/subscription/status', { replace: true });
      return;
    }
    if (status === 'PENDING_PAYMENT') {
      navigate('/admin/subscription/upgrade', { replace: true });
      return;
    }
    if (status === 'PENDING_VERIFICATION') {
      navigate('/admin/subscription/status', { replace: true });
      return;
    }

    // Fallback: API call to get fresh status (covers cases where status changed while logged in)
    subscriptionPaymentService.getSubscriptionStatus().then((subStatus) => {
      if (subStatus.status === 'pending_approval' || subStatus.status === 'pending_verification') {
        navigate('/admin/subscription/status', { replace: true });
      } else if (subStatus.status === 'pending_payment') {
        navigate('/admin/subscription/upgrade', { replace: true });
      }
    }).catch(() => {
      // Subscription status check failed — allow normal navigation
    });
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="print:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {showTrialBanner && <div className="print:hidden"><TrialBanner /></div>}
        <div className="print:hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
