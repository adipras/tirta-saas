import { useAppSelector } from '../hooks/redux';
import { TenantAdminDashboard, PlatformOwnerDashboard, MeterReaderDashboard } from './dashboards';

export default function RoleBasedDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  
  
  // Platform Owner gets platform management dashboard
  if (user?.role === 'platform_owner') {
    return <PlatformOwnerDashboard />;
  }
  
  // Meter Reader gets meter reading dashboard
  if (user?.role === 'meter_reader') {
    return <MeterReaderDashboard />;
  }
  
  // Tenant Admin and regular Admin get tenant operations dashboard
  return <TenantAdminDashboard />;
}
