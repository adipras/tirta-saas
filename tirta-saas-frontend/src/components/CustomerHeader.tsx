import { useEffect, useRef, useState } from 'react';
import { Bars3Icon, ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logoutAsync } from '../store/slices/authSlice';
import NotificationBell from './NotificationBell';

interface CustomerHeaderProps {
  onMenuClick?: () => void;
}

const CustomerHeader = ({ onMenuClick }: CustomerHeaderProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      <div className="flex min-h-[60px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors md:hidden"
            aria-label="Buka sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-surface-900">Portal Pelanggan</h2>
            <p className="truncate text-[12px] text-surface-400">
              {user?.name || 'Pelanggan'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell scope="customer" />

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
                {(user?.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-surface-900 leading-tight">{user?.name || 'Pelanggan'}</p>
                <p className="text-[11px] text-surface-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDownIcon className={`hidden h-4 w-4 text-surface-400 transition-transform duration-200 sm:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-surface-200 bg-white py-1.5 shadow-dropdown animate-scale-in">
                <div className="border-b border-surface-100 px-4 py-3 sm:hidden">
                  <p className="text-sm font-semibold text-surface-900">{user?.name || 'Pelanggan'}</p>
                  <p className="mt-0.5 text-[11px] text-surface-400 capitalize">{user?.role}</p>
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
    </header>
  );
};

export default CustomerHeader;
