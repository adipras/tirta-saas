import { useEffect, useRef, useState } from 'react';
import { Bars3Icon, BellIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logoutAsync } from '../store/slices/authSlice';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
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
    <header className="safe-top bg-white shadow-sm border-b border-gray-200">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center">
          {/* Hamburger — only shown on mobile */}
          <button
            onClick={onMenuClick}
            className="mr-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
            aria-label="Buka sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user?.tenant_name || import.meta.env.VITE_APP_NAME || 'Tirta SaaS'}
            </p>
            <p className="truncate text-xs text-gray-500">
              {user?.role?.replace('_', ' ') || 'admin'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="rounded-full p-2 text-gray-400 hover:text-gray-500">
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Pengguna Admin'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
              </div>
              <UserCircleIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
              <ChevronDownIcon className={`hidden h-4 w-4 text-gray-400 transition sm:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-2 sm:hidden">
                  <p className="truncate text-sm font-medium text-gray-900">{user?.name || 'Pengguna Admin'}</p>
                  <p className="truncate text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
                </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Keluar
              </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
