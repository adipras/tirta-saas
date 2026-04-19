import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: HomeIcon },
  { name: 'Profil', href: '/customer/profile', icon: UserIcon },
  { name: 'Tagihan', href: '/customer/invoices', icon: DocumentDuplicateIcon },
  { name: 'Pembayaran', href: '/customer/payments', icon: CreditCardIcon },
  { name: 'Pemakaian', href: '/customer/usage', icon: ChartBarIcon },
];

interface CustomerSidebarProps {
  open: boolean;
  onClose: () => void;
}

const SidebarContent = ({ onClose }: { onClose: () => void }) => (
  <div className="flex flex-col h-full bg-white border-r border-gray-200">
    <div className="flex items-center justify-between flex-shrink-0 px-4 py-5">
      <h1 className="text-xl font-semibold text-indigo-600">Tirta Portal</h1>
      <button
        onClick={onClose}
        className="md:hidden p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
    <nav className="flex-1 px-2 pb-4 space-y-0.5 overflow-y-auto">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          onClick={onClose}
          className={({ isActive }) =>
            `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 pl-2'
                : 'border-l-4 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`
          }
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  </div>
);

const CustomerSidebar = ({ open, onClose }: CustomerSidebarProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0">
        <SidebarContent onClose={onClose} />
      </div>

      {/* Mobile sidebar — overlay drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex w-64 flex-col flex-shrink-0 shadow-xl">
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerSidebar;
