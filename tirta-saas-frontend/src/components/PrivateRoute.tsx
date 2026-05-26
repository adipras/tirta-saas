import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { authService } from '../services/authService';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer' | 'platform_owner' | 'tenant_admin' | 'meter_reader' | 'finance' | 'service';
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const hasStoredSession = authService.isAuthenticated();

  if (!isAuthenticated || !hasStoredSession) {
    const loginPath = requiredRole === 'customer' ? '/customer/login' : '/admin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Allow operational tenant roles to access admin routes
    const isAdminRoute = requiredRole === 'admin';
    const allowedAdminRoles = ['platform_owner', 'tenant_admin', 'meter_reader', 'finance', 'service'] as const;
    const canAccessAdminRoute = Boolean(user?.role && allowedAdminRoles.includes(user.role as (typeof allowedAdminRoles)[number]));
    
    if (isAdminRoute && canAccessAdminRoute) {
      return <>{children}</>;
    }
    
    const dashboardPath = user?.role === 'customer' ? '/customer' : '/admin';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
