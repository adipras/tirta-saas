import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import type { PaymentReport as PaymentReportType } from '../../types/report';
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
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PaymentReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<PaymentReportType | null>(null);
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
      const data = await reportService.getPaymentReport(filters);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch payment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await reportService.exportReport('payments', {
        format,
        filters,
      });
      const filename = `payment_report_${filters.startDate}_${filters.endDate}.${format === 'csv' ? 'csv' : 'xlsx'}`;
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

  const collectionRate = reportData.totalCollected + reportData.totalOutstanding > 0
    ? (reportData.totalCollected / (reportData.totalCollected + reportData.totalOutstanding)) * 100
    : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Report</h1>
          <p className="text-gray-600 mt-1">
            Payment collection analysis and outstanding balances
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Total Collected</div>
          <div className="text-3xl font-bold">
            Rp {reportData.totalCollected.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Outstanding</div>
          <div className="text-3xl font-bold">
            Rp {reportData.totalOutstanding.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Collection Rate</div>
          <div className="text-3xl font-bold">{collectionRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Payment Method Breakdown & Daily Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Method Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Methods Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.paymentMethodBreakdown}
                dataKey="amount"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.method}: ${entry.percentage}%`}
              >
                {reportData.paymentMethodBreakdown.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Method Details
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Count
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.paymentMethodBreakdown.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.method}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      Rp {item.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      {item.count}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Collection Trend */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Collection Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData.dailyCollection}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
              labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#10B981"
              strokeWidth={2}
              name="Collection Amount"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Outstanding Payments Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Outstanding Payments
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Days Overdue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.outstandingPayments.map((payment, index) => (
                <tr key={index} className={payment.daysOverdue > 0 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {payment.customerName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {payment.invoiceNumber}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    Rp {payment.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {new Date(payment.dueDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    <span
                      className={`${
                        payment.daysOverdue > 0
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-900'
                      }`}
                    >
                      {payment.daysOverdue > 0 ? `+${payment.daysOverdue}` : payment.daysOverdue}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentReport;
