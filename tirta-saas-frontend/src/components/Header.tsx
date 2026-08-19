import { useEffect, useMemo, useRef, useState } from 'react';
import { Bars3Icon, ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logoutAsync } from '../store/slices/authSlice';
import PrinterBridgeIndicator from './PrinterBridgeIndicator';
import NotificationBell from './NotificationBell';
import { thermalPrinterService } from '../services/thermalPrinterService';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageMeta = useMemo(() => {
    const pageMap: Array<{ match: (pathname: string) => boolean; title: string; subtitle: string }> = [
      {
        match: (pathname) => pathname === '/admin',
        title: 'Dashboard',
        subtitle: 'Ringkasan cepat untuk operasional hari ini.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/customers'),
        title: 'Pelanggan',
        subtitle: 'Kelola data pelanggan dan status layanan.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/invoices'),
        title: 'Tagihan',
        subtitle: 'Pantau invoice, jatuh tempo, dan outstanding.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/payments'),
        title: 'Pembayaran',
        subtitle: 'Monitor transaksi dan bukti pembayaran.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/usage'),
        title: 'Pemakaian Air',
        subtitle: 'Tinjau pencatatan meter dan anomali pemakaian.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/reports'),
        title: 'Laporan',
        subtitle: 'Ringkasan data dan insight operasional.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/subscription'),
        title: 'Langganan & Pembayaran',
        subtitle: 'Status paket, invoice, dan pembayaran tenant.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/tariffs'),
        title: 'Tarif Progresif',
        subtitle: 'Kelola kategori tarif, tier progresif, dan simulasi tagihan.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/platform/tenants'),
        title: 'Tenant',
        subtitle: 'Kelola tenant dan status organisasi.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/platform/subscription-payments'),
        title: 'Verifikasi Langganan',
        subtitle: 'Tinjau pembayaran langganan tenant.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/platform/subscription-plans'),
        title: 'Paket Langganan',
        subtitle: 'Atur paket dan harga langganan platform.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/platform/analytics'),
        title: 'Analitik Platform',
        subtitle: 'Pantau performa tenant dan subscription.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/platform/monitoring'),
        title: 'Monitoring',
        subtitle: 'Pantau health, metrik, audit log, dan error log.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/platform/settings'),
        title: 'Pengaturan Platform',
        subtitle: 'Kelola konfigurasi utama platform.',
      },
    ];

    return pageMap.find((item) => item.match(location.pathname)) ?? {
      title: user?.tenant_name || import.meta.env.VITE_APP_NAME || 'Tirta SaaS',
      subtitle: 'Kelola aplikasi dari navigasi utama.',
    };
  }, [location.pathname, user?.tenant_name]);

  const accountLabel = useMemo(() => {
    if (user?.tenant_name) {
      return user.tenant_name;
    }
    return import.meta.env.VITE_APP_NAME || 'Tirta SaaS';
  }, [user?.tenant_name]);

  const roleLabel = useMemo(() => {
    return user?.role?.replace(/_/g, ' ') || 'admin';
  }, [user?.role]);

  const showPrinterBridge = thermalPrinterService.shouldUseBridge();

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logoutAsync());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-surface-200/60 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/90">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: hamburger + page title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors md:hidden"
            aria-label="Buka sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-surface-900">
              {pageMeta.title}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-surface-400 sm:max-w-xl">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: printer indicator + bell + user menu */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <div className="hidden sm:block">
            <PrinterBridgeIndicator />
          </div>
          <NotificationBell scope="user" />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface-100"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-surface-900 leading-tight">{user?.name || 'Pengguna'}</p>
                <p className="text-[11px] text-surface-400 capitalize">{roleLabel}</p>
              </div>
              <ChevronDownIcon className={`hidden h-4 w-4 text-surface-400 transition-transform duration-200 sm:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-surface-200 bg-white py-1.5 shadow-dropdown animate-scale-in">
                <div className="border-b border-surface-100 px-4 py-3">
                  <p className="text-sm font-semibold text-surface-900">{user?.name || 'Pengguna'}</p>
                  <p className="mt-0.5 text-[11px] text-surface-400 capitalize">{roleLabel}</p>
                  <p className="mt-1 text-[11px] font-medium text-brand-600">{accountLabel}</p>
                </div>
                {/* Printer indicator on mobile */}
                <div className="border-b border-surface-100 px-4 py-2.5 sm:hidden">
                  <PrinterBridgeIndicator />
                </div>
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-900"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: account label + printer indicator */}
      <div className="border-t border-surface-100 px-4 py-2 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[11px] font-medium text-brand-600">{accountLabel}</p>
          {showPrinterBridge && (
            <PrinterBridgeIndicator className="inline-flex shrink-0" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
