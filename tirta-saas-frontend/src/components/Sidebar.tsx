import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useAppSelector } from '../hooks/redux';
import { resolveTenantAssetUrl } from '../services/tenantSettingsService';

const allNavigation = [
  // Platform Owner Menu
  { name: 'Dashboard Platform', href: '/admin', icon: HomeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Tenant', href: '/admin/platform/tenants', icon: BuildingOfficeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Verifikasi Langganan Tenant', href: '/admin/platform/subscription-payments', icon: CheckBadgeIcon, roles: ['PLATFORM_OWNER'] },
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
  { name: 'Langganan & Pembayaran', href: '/admin/subscription/upgrade', icon: CheckBadgeIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Golongan Langganan', href: '/admin/subscriptions', icon: RectangleStackIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Tarif Air', href: '/admin/water-rates', icon: CurrencyDollarIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Manajemen Pengguna', href: '/admin/users', icon: UsersIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Pengaturan Tenant', href: '/admin/settings', icon: CogIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const SidebarContent = ({ onClose }: { onClose: () => void }) => {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const userRole = user?.role?.toUpperCase() || 'ADMIN';
  const isPlatformOwner = userRole === 'PLATFORM_OWNER';
  const isTenantUser = !isPlatformOwner && Boolean(user?.tenant_id);
  const platformName = import.meta.env.VITE_APP_NAME || 'Tirta SaaS';
  const navigation = allNavigation.filter(item => item.roles.includes(userRole));
  const visibleSettingsNavigation = useMemo(
    () => settingsNavigation.filter(item => item.roles.includes(userRole)),
    [userRole]
  );
  const hasSettingsMenu = visibleSettingsNavigation.length > 0;
  const matchesSettingsItem = (href: string) => {
    if (href === '/admin/subscription/upgrade') {
      return location.pathname.startsWith('/admin/subscription');
    }

    return location.pathname.startsWith(href);
  };

  const hasActiveSettingsItem = visibleSettingsNavigation.some((item) =>
    matchesSettingsItem(item.href)
  );
  const [settingsOpen, setSettingsOpen] = useState(hasActiveSettingsItem);

  useEffect(() => {
    if (hasActiveSettingsItem) {
      setSettingsOpen(true);
    }
  }, [hasActiveSettingsItem]);

  const tenantLogoUrl = useMemo(() => {
    const resolvedUrl = resolveTenantAssetUrl(user?.tenant_logo_url);
    return resolvedUrl || null;
  }, [user?.tenant_logo_url]);
  const roleLabel = user?.role?.replace('_', ' ') || 'admin';

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-5">
        <div className="flex min-w-0 items-center">
          {isTenantUser ? (
            <>
              {tenantLogoUrl ? (
                <img
                  src={tenantLogoUrl}
                  alt={`Logo ${user?.tenant_name || 'tenant'}`}
                  className="mr-3 h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700">
                  {(user?.tenant_name || 'T').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-gray-900">
                  {user?.tenant_name || 'Tenant'}
                </h1>
                <p className="truncate text-xs text-gray-500">
                  Supported by {platformName}
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900">{platformName}</h1>
              {isPlatformOwner && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                  Platform
                </span>
              )}
            </>
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
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-4">
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Menu utama
          </p>
          <div className="space-y-0.5">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-l-4 border-blue-500 bg-blue-50 pl-2 text-blue-700'
                      : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>

        {hasSettingsMenu && (
          <div>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Pengaturan
            </p>
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                hasActiveSettingsItem
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center">
                <CogIcon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                Semua pengaturan
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
                      `group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        (isActive || matchesSettingsItem(item.href))
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
        <div className="rounded-2xl bg-gray-50 p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-700">{user?.name}</div>
            <div className="mt-1 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
              {roleLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (previousPathnameRef.current !== location.pathname && open) {
      onClose();
    }

    previousPathnameRef.current = location.pathname;
  }, [location.pathname, open, onClose]);

  useEffect(() => {
    if (!open) {
      document.body.style.removeProperty('overflow');
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [open]);

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
          <div className="safe-y relative flex w-[min(20rem,88vw)] flex-col flex-shrink-0 shadow-xl">
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
