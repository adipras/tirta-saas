import { NavLink } from 'react-router-dom';
import {
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
} from '@heroicons/react/24/outline';
import { authService } from '../services/authService';

// Navigation items dengan role-based access
const allNavigation = [
  // Platform Owner Menu
  { 
    name: 'Platform Dashboard', 
    href: '/admin', 
    icon: HomeIcon,
    roles: ['PLATFORM_OWNER'],
  },
  { 
    name: 'Tenants', 
    href: '/admin/platform/tenants', 
    icon: BuildingOfficeIcon,
    roles: ['PLATFORM_OWNER'],
  },
  { 
    name: 'Subscription Plans', 
    href: '/admin/platform/subscription-plans', 
    icon: ClipboardDocumentListIcon,
    roles: ['PLATFORM_OWNER'],
  },
  { 
    name: 'Platform Analytics', 
    href: '/admin/platform/analytics', 
    icon: ChartBarIcon,
    roles: ['PLATFORM_OWNER'],
  },
  
  // Tenant Admin Menu (Water Operations)
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: HomeIcon,
    roles: ['ADMIN', 'TENANT_ADMIN'],
  },
  { 
    name: 'Customers', 
    href: '/admin/customers', 
    icon: UserGroupIcon,
    roles: ['ADMIN', 'TENANT_ADMIN', 'SERVICE', 'FINANCE'],
  },
  { 
    name: 'Subscription Types', 
    href: '/admin/subscriptions', 
    icon: RectangleStackIcon,
    roles: ['ADMIN', 'TENANT_ADMIN'],
  },
  { 
    name: 'Water Rates', 
    href: '/admin/water-rates', 
    icon: CurrencyDollarIcon,
    roles: ['ADMIN', 'TENANT_ADMIN'],
  },
  { 
    name: 'Invoices', 
    href: '/admin/invoices', 
    icon: DocumentDuplicateIcon,
    roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE'],
  },
  { 
    name: 'Payments', 
    href: '/admin/payments', 
    icon: CreditCardIcon,
    roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE'],
  },
  { 
    name: 'Water Usage', 
    href: '/admin/usage', 
    icon: BeakerIcon,
    roles: ['ADMIN', 'TENANT_ADMIN', 'METER_READER'],
  },
  { 
    name: 'Reports', 
    href: '/admin/reports', 
    icon: ChartBarIcon,
    roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE'],
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: CogIcon,
    roles: ['ADMIN', 'TENANT_ADMIN', 'PLATFORM_OWNER'],
  },
];

const Sidebar = () => {
  console.log('=== Sidebar Rendering ===');
  const user = authService.getUser();
  const userRole = user?.role?.toUpperCase() || 'ADMIN';
  
  console.log('Current user role:', userRole);
  
  // Filter navigation berdasarkan role
  const navigation = allNavigation.filter(item => 
    item.roles.includes(userRole)
  );
  
  return (
    <div className="flex w-64 flex-col" style={{ backgroundColor: 'lightgray' }}>
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-semibold text-gray-900">Tirta SaaS</h1>
          {userRole === 'PLATFORM_OWNER' && (
            <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
              Platform
            </span>
          )}
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
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
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
        
        {/* User info footer */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div>
              <div className="text-sm font-medium text-gray-700">{user?.name}</div>
              <div className="text-xs text-gray-500">{userRole}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;