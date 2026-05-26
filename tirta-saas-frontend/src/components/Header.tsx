import { useEffect, useMemo, useRef, useState } from 'react';
import { Bars3Icon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
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
        match: (pathname) => pathname.startsWith('/admin/platform/tenants'),
        title: 'Tenant',
        subtitle: 'Kelola tenant dan status organisasi.',
      },
      {
        match: (pathname) => pathname.startsWith('/admin/platform/subscription-payments'),
        title: 'Verifikasi Langganan Tenant',
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
    <header className="safe-top sticky top-0 z-30 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        {/* Left: hamburger + page title */}
        <div className="flex min-w-0 items-center">
          <button
            onClick={onMenuClick}
            className="mr-3 flex-shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
            aria-label="Buka sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900 sm:text-lg">
              {pageMeta.title}
            </p>
            <div className="mt-1 space-y-1">
              <p className="truncate text-xs text-gray-500 sm:max-w-xl">
                {pageMeta.subtitle}
              </p>
              <p className="hidden truncate text-xs font-medium text-blue-700 sm:block">
                {accountLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Right: printer indicator + bell + user menu */}
        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-3">
          <div className="hidden sm:block">
            <PrinterBridgeIndicator />
          </div>
          <NotificationBell scope="user" />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Pengguna Admin'}</p>
              </div>
              <UserCircleIcon className="h-8 w-8 flex-shrink-0 text-gray-400" />
              <ChevronDownIcon className={`hidden h-4 w-4 text-gray-400 transition sm:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-gray-900">{user?.name || 'Pengguna Admin'}</p>
                  <p className="truncate text-xs text-gray-500 capitalize">{roleLabel}</p>
                  <p className="mt-1 truncate text-xs font-medium text-blue-700">{accountLabel}</p>
                </div>
                {/* Printer indicator di dropdown untuk mobile */}
                <div className="border-b border-gray-100 px-4 py-2 sm:hidden">
                  <PrinterBridgeIndicator />
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-blue-700">{accountLabel}</p>
          </div>
          {showPrinterBridge && (
            <PrinterBridgeIndicator className="inline-flex shrink-0" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
