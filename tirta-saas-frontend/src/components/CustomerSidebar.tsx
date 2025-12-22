import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/customer', icon: HomeIcon },
  { name: 'Profile', href: '/customer/profile', icon: UserIcon },
  { name: 'Invoices', href: '/customer/invoices', icon: DocumentDuplicateIcon },
  { name: 'Payments', href: '/customer/payments', icon: CreditCardIcon },
  { name: 'Usage', href: '/customer/usage', icon: ChartBarIcon },
];

const CustomerSidebar = () => {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-semibold text-indigo-600">Tirta Portal</h1>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `${
                    isActive
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } group flex items-center px-2 py-2 text-sm font-medium border-l-4`
                }
              >
                <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default CustomerSidebar;