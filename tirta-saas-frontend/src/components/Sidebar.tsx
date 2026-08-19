import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDownIcon,
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
  BellIcon,
  ServerStackIcon,
  UsersIcon,
  MapIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../hooks/redux';
import { resolveTenantAssetUrl } from '../services/tenantSettingsService';

const allNavigation = [
  // Platform Owner Menu
  { name: 'Dashboard Platform', href: '/admin', icon: HomeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Tenant', href: '/admin/platform/tenants', icon: BuildingOfficeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Verifikasi Langganan', href: '/admin/platform/subscription-payments', icon: CheckBadgeIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Paket Langganan', href: '/admin/platform/subscription-plans', icon: ClipboardDocumentListIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Analitik', href: '/admin/platform/analytics', icon: ChartBarIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Monitoring', href: '/admin/platform/monitoring', icon: ServerStackIcon, roles: ['PLATFORM_OWNER'] },
  { name: 'Pengaturan', href: '/admin/platform/settings', icon: CogIcon, roles: ['PLATFORM_OWNER'] },
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
  { name: 'Langganan', href: '/admin/subscription/upgrade', icon: CheckBadgeIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Golongan', href: '/admin/subscriptions', icon: RectangleStackIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Tarif Air', href: '/admin/water-rates', icon: CurrencyDollarIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Notifikasi', href: '/admin/notifications', icon: BellIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Tarif Progresif', href: '/admin/tariffs', icon: RectangleStackIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Area Layanan', href: '/admin/service-areas', icon: MapIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Pengguna', href: '/admin/users', icon: UsersIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
  { name: 'Pengaturan', href: '/admin/settings', icon: CogIcon, roles: ['ADMIN', 'TENANT_ADMIN'] },
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
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-5">
        <div className="flex min-w-0 items-center gap-3">
          {isTenantUser ? (
            <>
              {tenantLogoUrl ? (
                <img
                  src={tenantLogoUrl}
                  alt={`Logo ${user?.tenant_name || 'tenant'}`}
                  className="h-9 w-9 rounded-lg object-cover ring-2 ring-surface-100"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600 ring-2 ring-brand-100">
                  {(user?.tenant_name || 'T').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-surface-900">
                  {user?.tenant_name || 'Tenant'}
                </h1>
                <p className="truncate text-[11px] text-surface-400">
                  {platformName}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                <span className="text-sm font-bold text-white">T</span>
              </div>
              <h1 className="text-sm font-bold text-surface-900 tracking-tight">{platformName}</h1>
              {isPlatformOwner && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-brand-50 text-brand-700 rounded-md border border-brand-200">
                  Platform
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          aria-label="Tutup sidebar"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-1">
        <div>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
            Menu
          </p>
          <div className="space-y-0.5">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-xs'
                      : 'text-surface-500 hover:bg-surface-50 hover:text-surface-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                        isActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {hasSettingsMenu && (
          <div>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
              Pengaturan
            </p>
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                hasActiveSettingsItem
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-500 hover:bg-surface-50 hover:text-surface-900'
              }`}
            >
              <CogIcon
                className={`h-[18px] w-[18px] flex-shrink-0 transition-colors ${
                  hasActiveSettingsItem ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'
                }`}
                aria-hidden="true"
              />
              <span className="flex-1 text-left">Semua pengaturan</span>
              <ChevronDownIcon
                className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
                  settingsOpen ? 'rotate-0' : '-rotate-90'
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-200 ${
                settingsOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="mt-1 space-y-0.5 pl-5">
                {visibleSettingsNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                        (isActive || matchesSettingsItem(item.href))
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-surface-500 hover:bg-surface-50 hover:text-surface-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`h-4 w-4 flex-shrink-0 transition-colors ${
                            (isActive || matchesSettingsItem(item.href))
                              ? 'text-brand-600'
                              : 'text-surface-400 group-hover:text-surface-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* User info footer */}
      <div className="flex-shrink-0 border-t border-surface-100 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-3 transition-colors hover:bg-surface-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900">{user?.name}</p>
            <p className="truncate text-[11px] text-surface-400 capitalize">{roleLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const location = useLocation();
  const previousPathnameRef = useRef(location.pathname);

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
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 border-r border-surface-200/60 shadow-sidebar">
        <SidebarContent onClose={onClose} />
      </div>

      {/* Mobile sidebar — overlay drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-surface-900/30 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="safe-y relative flex w-[min(20rem,88vw)] flex-col flex-shrink-0 bg-white shadow-elevated animate-slide-in">
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
