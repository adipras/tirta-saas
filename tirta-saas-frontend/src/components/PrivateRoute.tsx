import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer' | 'platform_owner';
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  console.log('=== PrivateRoute Render ===');
  console.log('Location:', location.pathname);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('user:', user);
  console.log('requiredRole:', requiredRole);
  console.log('user?.role:', user?.role);
  console.log('Match:', user?.role === requiredRole);

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    const loginPath = requiredRole === 'customer' ? '/customer/login' : '/admin/login';
    console.log('Redirect to:', loginPath);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Allow platform_owner to access admin routes
    const isAdminRoute = requiredRole === 'admin';
    const isPlatformOwner = user?.role === 'platform_owner';
    
    if (isAdminRoute && isPlatformOwner) {
      console.log('✅ Platform owner accessing admin route - ALLOWED');
      return <>{children}</>;
    }
    
    console.log('❌ Role mismatch, redirecting');
    console.log('Expected role:', requiredRole);
    console.log('User role:', user?.role);
    const dashboardPath = user?.role === 'customer' ? '/customer' : '/admin';
    console.log('Redirect to:', dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }

  console.log('✅ Auth check passed, rendering children');
  return <>{children}</>;
};

export default PrivateRoute;