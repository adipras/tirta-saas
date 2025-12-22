import {
  CreditCardIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Current Balance',
    stat: '$245.30',
    icon: CreditCardIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-500',
  },
  {
    name: 'This Month Usage',
    stat: '45.2 m³',
    icon: ChartBarIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
  },
  {
    name: 'Pending Invoices',
    stat: '2',
    icon: DocumentDuplicateIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
  },
  {
    name: 'Overdue Amount',
    stat: '$0.00',
    icon: ExclamationTriangleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-500',
  },
];

const CustomerDashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Account Overview</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute ${item.bgColor} rounded-md p-3`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className={`text-2xl font-semibold ${item.color}`}>{item.stat}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Invoice #INV-2024-001</p>
                <p className="text-xs text-gray-500">January 2024</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">$89.50</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Invoice #INV-2024-002</p>
                <p className="text-xs text-gray-500">February 2024</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">$92.80</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Invoice #INV-2024-003</p>
                <p className="text-xs text-gray-500">March 2024</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">$85.20</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
              View all invoices →
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-semibold text-gray-900">45.2 m³</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Month</span>
              <span className="text-sm font-semibold text-gray-900">52.8 m³</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Monthly</span>
              <span className="text-sm font-semibold text-gray-900">48.5 m³</span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Usage Trend</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  -14% vs last month
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
              View detailed usage →
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium">
            Pay Invoice
          </button>
          <button className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
            View Usage
          </button>
          <button className="bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
            Download Receipt
          </button>
          <button className="bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;