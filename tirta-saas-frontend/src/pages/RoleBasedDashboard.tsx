import { useAppSelector } from '../hooks/redux';
import { TenantAdminDashboard, PlatformOwnerDashboard } from './dashboards';

export default function RoleBasedDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  
  console.log('=== RoleBasedDashboard ===');
  console.log('User role:', user?.role);
  
  // Platform Owner gets platform management dashboard
  if (user?.role === 'platform_owner') {
    console.log('Rendering PlatformOwnerDashboard');
    return <PlatformOwnerDashboard />;
  }
  
  // Tenant Admin and regular Admin get tenant operations dashboard
  console.log('Rendering TenantAdminDashboard');
  return <TenantAdminDashboard />;
}
