import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: HomeIcon },
  { name: 'Profil', href: '/customer/profile', icon: UserIcon },
  { name: 'Tagihan', href: '/customer/invoices', icon: DocumentDuplicateIcon },
  { name: 'Notifikasi', href: '/customer/notifications', icon: BellIcon },
  { name: 'Pembayaran', href: '/customer/payments', icon: CreditCardIcon },
  { name: 'Pemakaian', href: '/customer/usage', icon: ChartBarIcon },
];

interface CustomerSidebarProps {
  open: boolean;
  onClose: () => void;
}

const SidebarContent = ({ onClose }: { onClose: () => void }) => (
  <div className="flex flex-col h-full bg-white">
    {/* Logo */}
    <div className="flex items-center justify-between flex-shrink-0 px-5 py-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <span className="text-sm font-bold text-white">T</span>
        </div>
        <h1 className="text-sm font-bold text-surface-900 tracking-tight">Tirta Portal</h1>
      </div>
      <button
        onClick={onClose}
        className="md:hidden p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        aria-label="Tutup menu navigasi pelanggan"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-3 pb-4 pt-1 space-y-1 overflow-y-auto">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
        Menu
      </p>
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
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
    </nav>
  </div>
);

const CustomerSidebar = ({ open, onClose }: CustomerSidebarProps) => {
  const location = useLocation();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (open) {
      onClose();
    }
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
            aria-hidden="true"
          />
          <div
            className="safe-y relative flex w-[min(20rem,88vw)] flex-col flex-shrink-0 bg-white shadow-elevated animate-slide-in"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi pelanggan"
          >
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerSidebar;
