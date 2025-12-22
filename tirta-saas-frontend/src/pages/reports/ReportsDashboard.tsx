import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BeakerIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const ReportsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const reports = [
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'View revenue trends, monthly breakdown, and subscription type analysis',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      path: '/admin/reports/revenue',
    },
    {
      id: 'payments',
      title: 'Payment Report',
      description: 'Track payment collections, methods, and outstanding balances',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      path: '/admin/reports/payments',
    },
    {
      id: 'customers',
      title: 'Customer Analytics',
      description: 'Analyze customer growth, status distribution, and top customers',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      path: '/admin/reports/customers',
    },
    {
      id: 'usage',
      title: 'Usage Report',
      description: 'Monitor water usage trends and identify high consumers',
      icon: BeakerIcon,
      color: 'bg-cyan-500',
      path: '/admin/reports/usage',
    },
    {
      id: 'outstanding',
      title: 'Outstanding Report',
      description: 'View overdue invoices and aging analysis',
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      path: '/admin/reports/outstanding',
    },
  ];

  const handleViewReport = (path: string) => {
    navigate(`${path}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">
          Comprehensive reports and analytics for your water supply management
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() =>
              setDateRange({
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              })
            }
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            This Month
          </button>
          <button
            onClick={() =>
              setDateRange({
                startDate: new Date(new Date().getFullYear(), 0, 1)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              })
            }
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            This Year
          </button>
          <button
            onClick={() =>
              setDateRange({
                startDate: new Date(new Date().getFullYear() - 1, 0, 1)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date(new Date().getFullYear() - 1, 11, 31)
                  .toISOString()
                  .split('T')[0],
              })
            }
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Last Year
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewReport(report.path)}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`${report.color} p-3 rounded-lg`}>
                  <report.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">
                  {report.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">{report.description}</p>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Report →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/invoices')}
            className="p-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
          >
            <div className="text-sm font-medium text-gray-900">Generate Invoices</div>
            <div className="text-xs text-gray-600 mt-1">Create monthly invoices</div>
          </button>
          <button
            onClick={() => navigate('/admin/payments/new')}
            className="p-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
          >
            <div className="text-sm font-medium text-gray-900">Record Payment</div>
            <div className="text-xs text-gray-600 mt-1">Add new payment record</div>
          </button>
          <button
            onClick={() => navigate('/admin/usage/create')}
            className="p-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
          >
            <div className="text-sm font-medium text-gray-900">Enter Usage</div>
            <div className="text-xs text-gray-600 mt-1">Record meter readings</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
