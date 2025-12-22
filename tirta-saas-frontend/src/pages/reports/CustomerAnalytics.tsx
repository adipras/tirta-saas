import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import type { CustomerAnalytics as CustomerAnalyticsType } from '../../types/report';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const CustomerAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<CustomerAnalyticsType | null>(null);
  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: searchParams.get('endDate') || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await reportService.getCustomerAnalytics(filters);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch customer analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive customer insights and trends
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/reports')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
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
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Customers</div>
          <div className="text-3xl font-bold text-gray-900">
            {reportData.totalCustomers}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Active</div>
          <div className="text-3xl font-bold text-green-600">
            {reportData.activeCustomers}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Inactive</div>
          <div className="text-3xl font-bold text-yellow-600">
            {reportData.inactiveCustomers}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Suspended</div>
          <div className="text-3xl font-bold text-red-600">
            {reportData.suspendedCustomers}
          </div>
        </div>
      </div>

      {/* Customer Growth Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData.customerGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="newCustomers"
              stroke="#10B981"
              name="New Customers"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="totalCustomers"
              stroke="#3B82F6"
              name="Total Customers"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.statusDistribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.status}: ${entry.percentage}%`}
              >
                {reportData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers by Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Customers by Revenue
          </h2>
          <div className="space-y-3">
            {reportData.topCustomers.slice(0, 5).map((customer) => (
              <div
                key={customer.customerId}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    #{customer.rank}. {customer.customerName}
                  </div>
                  <div className="text-sm text-gray-600">
                    Usage: {customer.totalUsage.toLocaleString()} m³
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    Rp {customer.totalRevenue.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Details Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Growth Details
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Month
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  New Customers
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Customers
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Growth Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.customerGrowth.map((item, index) => {
                const prevTotal =
                  index > 0 ? reportData.customerGrowth[index - 1].totalCustomers : 0;
                const growthRate =
                  prevTotal > 0
                    ? ((item.totalCustomers - prevTotal) / prevTotal) * 100
                    : 0;
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.month} {item.year}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      {item.newCustomers}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      {item.totalCustomers}
                    </td>
                    <td className="px-4 py-2 text-sm text-right">
                      <span
                        className={`${
                          growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {growthRate > 0 ? '+' : ''}
                        {growthRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;
