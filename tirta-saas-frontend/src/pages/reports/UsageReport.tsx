import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import type { UsageReport as UsageReportType } from '../../types/report';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowDownTrayIcon, BeakerIcon } from '@heroicons/react/24/outline';

const UsageReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<UsageReportType | null>(null);
  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: searchParams.get('endDate') || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await reportService.getUsageReport(filters);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch usage report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await reportService.exportReport('usage', {
        format,
        filters,
      });
      const filename = `usage_report_${filters.startDate}_${filters.endDate}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      reportService.downloadFile(blob, filename);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Water Usage Report</h1>
          <p className="text-gray-600 mt-1">
            Water consumption trends and analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/admin/reports')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export Excel
          </button>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg shadow p-8 text-white">
          <div className="flex items-center mb-2">
            <BeakerIcon className="h-8 w-8 mr-3" />
            <div className="text-sm font-medium">Total Water Usage</div>
          </div>
          <div className="text-4xl font-bold">
            {reportData.totalUsage.toLocaleString('id-ID')} m³
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-8 text-white">
          <div className="flex items-center mb-2">
            <BeakerIcon className="h-8 w-8 mr-3" />
            <div className="text-sm font-medium">Average Usage per Customer</div>
          </div>
          <div className="text-4xl font-bold">
            {reportData.averageUsage.toFixed(2)} m³
          </div>
        </div>
      </div>

      {/* Usage Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Water Usage Trends
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={reportData.usageTrends}>
            <defs>
              <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('id-ID')} m³`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="totalUsage"
              stroke="#06B6D4"
              fillOpacity={1}
              fill="url(#colorUsage)"
              name="Total Usage (m³)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Average Usage per Customer Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Average Usage per Customer
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData.usageTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)} m³`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="averageUsage"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Average Usage (m³)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* High Consumers Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top Water Consumers
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Meter Number
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Usage (m³)
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.highConsumers.map((consumer, index) => (
                <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-2 text-sm text-gray-900 font-semibold">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {consumer.customerName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {consumer.meterNumber}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                    {consumer.usage.toLocaleString('id-ID')} m³
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {consumer.month} {consumer.year}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Usage Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Usage Details
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Month
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Usage (m³)
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Avg per Customer
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Active Customers
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Change from Previous
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.usageTrends.map((item, index) => {
                const prevUsage = index > 0 ? reportData.usageTrends[index - 1].totalUsage : 0;
                const change = prevUsage > 0 ? ((item.totalUsage - prevUsage) / prevUsage) * 100 : 0;
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.month} {item.year}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                      {item.totalUsage.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      {item.averageUsage.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      {item.customerCount}
                    </td>
                    <td className="px-4 py-2 text-sm text-right">
                      {index > 0 && (
                        <span
                          className={`${
                            change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {change > 0 ? '+' : ''}
                          {change.toFixed(1)}%
                        </span>
                      )}
                      {index === 0 && <span className="text-gray-400">-</span>}
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

export default UsageReport;
