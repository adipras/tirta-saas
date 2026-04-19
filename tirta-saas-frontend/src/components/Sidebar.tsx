import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  BeakerIcon,
  RectangleStackIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { authService } from '../services/authService';

const allNavigation = [
  // Platform Owner Menu
  { name: 'Dashboard Platform', href: '/admin', icon: HomeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Tenant', href: '/admin/platform/tenants', icon: BuildingOfficeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Pembayaran Langganan', href: '/admin/platform/subscription-payments', icon: CheckBadgeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Paket Langganan', href: '/admin/platform/subscription-plans', icon: ClipboardDocumentListIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Analitik Platform', href: '/admin/platform/analytics', icon: ChartBarIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Pengaturan Platform', href: '/admin/platform/settings', icon: CogIcon, roles: ['PLATFORM_OWNER'] },
  // Tenant Admin Menu
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, roles: ['ADMIN', 'TENANT_ADMIN', 'SERVICE', 'FINANCE', 'METER_READER'] },
  { name: 'Pelanggan', href: '/admin/customers', icon: UserGroupIcon, roles: ['ADMIN', 'TENANT_ADMIN', 'SERVICE', 'FINANCE'] },
  { name: 'Tagihan', href: '/admin/invoices', icon: DocumentDuplicateIcon, roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE'] },
  { name: 'Pembayaran', href: '/admin/payments', icon: CreditCardIcon, roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE'] },
  { name: 'Verifikasi Pembayaran', href: '/admin/payment-verification', icon: CheckBadgeIcon, roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE'] },
  { name: 'Pemakaian Air', href: '/admin/usage', icon: BeakerIcon, roles: ['ADMIN', 'TENANT_ADMIN', 'METER_READER'] },
  { name: 'Laporan', href: '/admin/reports', icon: ChartBarIcon, roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE'] },
];

const settingsNavigation = [
  { name: 'Golongan Langganan', href: '/admin/subscriptions', icon: RectangleStackIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Tarif Air', href: '/admin/water-rates', icon: CurrencyDollarIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Manajemen Pengguna', href: '/admin/users', icon: UsersIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Pengaturan Pembayaran', href: '/admin/settings', icon: CogIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const SidebarContent = ({ onClose }: { onClose: () => void }) => {
  const user = authService.getUser();
  const location = useLocation();
  const userRole = user?.role?.toUpperCase() || 'ADMIN';
  const navigation = allNavigation.filter(item => item.roles.includes(userRole));
  const visibleSettingsNavigation = useMemo(
    () => settingsNavigation.filter(item => item.roles.includes(userRole)),
    [userRole]
  );
  const hasSettingsMenu = visibleSettingsNavigation.length > 0;
  const hasActiveSettingsItem = visibleSettingsNavigation.some(item =>
    location.pathname.startsWith(item.href)
  );
  const [settingsOpen, setSettingsOpen] = useState(hasActiveSettingsItem);

  useEffect(() => {
    if (hasActiveSettingsItem) {
      setSettingsOpen(true);
    }
  }, [hasActiveSettingsItem]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-between flex-shrink-0 px-4 py-5">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Tirta SaaS</h1>
          {userRole === 'PLATFORM_OWNER' && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
              Platform
            </span>
          )}
        </div>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 pl-2'
                  : 'border-l-4 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {item.name}
          </NavLink>
        ))}

        {hasSettingsMenu && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                hasActiveSettingsItem
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center">
                <CogIcon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                Pengaturan
              </span>
              {settingsOpen ? (
                <ChevronDownIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              )}
            </button>

            {settingsOpen && (
              <div className="mt-1 space-y-0.5 pl-4">
                {visibleSettingsNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 pl-2'
                          : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User info footer */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-700 truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ open, onClose }: SidebarProps) => {
  // Close sidebar on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0">
        <SidebarContent onClose={onClose} />
      </div>

      {/* Mobile sidebar — overlay drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative flex w-64 flex-col flex-shrink-0 shadow-xl">
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
