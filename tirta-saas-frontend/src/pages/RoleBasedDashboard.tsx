import { useAppSelector } from '../hooks/redux';
import { TenantAdminDashboard, PlatformOwnerDashboard, MeterReaderDashboard } from './dashboards';

export default function RoleBasedDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  
  console.log('=== RoleBasedDashboard ===');
  console.log('User role:', user?.role);
  
  // Platform Owner gets platform management dashboard
  if (user?.role === 'platform_owner') {
    console.log('Rendering PlatformOwnerDashboard');
    return <PlatformOwnerDashboard />;
  }
  
  // Meter Reader gets meter reading dashboard
  if (user?.role === 'meter_reader') {
    console.log('Rendering MeterReaderDashboard');
    return <MeterReaderDashboard />;
  }
  
  // Tenant Admin and regular Admin get tenant operations dashboard
  console.log('Rendering TenantAdminDashboard');
  return <TenantAdminDashboard />;
}
