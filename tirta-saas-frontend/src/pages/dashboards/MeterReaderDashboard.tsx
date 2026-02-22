import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function MeterReaderDashboard() {
  const navigate = useNavigate();

  const quickActions = [
    {
      name: 'New Meter Reading',
      description: 'Record new water meter reading',
      icon: PlusIcon,
      color: 'blue',
      onClick: () => navigate('/admin/usage/new'),
    },
    {
      name: 'View All Readings',
      description: 'Browse all meter readings',
      icon: ClipboardDocumentListIcon,
      color: 'green',
      onClick: () => navigate('/admin/usage'),
    },
    {
      name: 'Reading History',
      description: 'View reading history',
      icon: ClockIcon,
      color: 'purple',
      onClick: () => navigate('/admin/usage/history'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meter Reader Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record and manage water meter readings
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.name}
            onClick={action.onClick}
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 hover:shadow-lg transition-shadow rounded-lg border border-gray-200"
          >
            <div>
              <span
                className={`rounded-lg inline-flex p-3 ring-4 ring-white bg-${action.color}-50`}
              >
                <action.icon
                  className={`h-6 w-6 text-${action.color}-600`}
                  aria-hidden="true"
                />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">
                <span className="absolute inset-0" aria-hidden="true" />
                {action.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{action.description}</p>
            </div>
            <span
              className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
              aria-hidden="true"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Welcome, Meter Reader!</h3>
        <p className="text-sm text-blue-700">
          Your role is to record water meter readings for customers. You can create new readings
          and view the reading history. All readings you enter will be used to calculate customer
          water usage and generate invoices.
        </p>
      </div>

      {/* Recent Activity - Can be enhanced later */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}
