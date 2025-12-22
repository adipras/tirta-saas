import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AgingBucket {
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

interface OutstandingReportData {
  totalOutstanding: number;
  totalCustomers: number;
  overdueCount: number;
  agingBuckets: AgingBucket[];
  outstandingInvoices: Array<{
    customerId: number;
    customerName: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    daysOverdue: number;
  }>;
}

const OutstandingReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<OutstandingReportData | null>(null);
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
      const data = await reportService.getOutstandingReport(filters);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch outstanding report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await reportService.exportReport('outstanding', {
        format,
        filters,
      });
      const filename = `outstanding_report_${filters.startDate}_${filters.endDate}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      reportService.downloadFile(blob, filename);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report');
    }
  };

  const getAgingColor = (daysOverdue: number) => {
    if (daysOverdue <= 0) return 'text-gray-900';
    if (daysOverdue <= 30) return 'text-yellow-600';
    if (daysOverdue <= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAgingBgColor = (daysOverdue: number) => {
    if (daysOverdue <= 0) return '';
    if (daysOverdue <= 30) return 'bg-yellow-50';
    if (daysOverdue <= 60) return 'bg-orange-50';
    return 'bg-red-50';
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
          <h1 className="text-2xl font-bold text-gray-900">Outstanding Report</h1>
          <p className="text-gray-600 mt-1">
            Overdue invoices and aging analysis
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

      {/* Alert Banner */}
      {reportData.overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <div className="font-semibold text-red-900">
              {reportData.overdueCount} Overdue Invoice(s)
            </div>
            <div className="text-sm text-red-700">
              Immediate action required for overdue payments
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Total Outstanding</div>
          <div className="text-3xl font-bold">
            Rp {reportData.totalOutstanding.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Customers with Outstanding</div>
          <div className="text-3xl font-bold">{reportData.totalCustomers}</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Overdue Invoices</div>
          <div className="text-3xl font-bold">{reportData.overdueCount}</div>
        </div>
      </div>

      {/* Aging Analysis Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aging Analysis
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData.agingBuckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
            />
            <Legend />
            <Bar dataKey="amount" fill="#EF4444" name="Outstanding Amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aging Buckets Table */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aging Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Age Range
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Count
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.agingBuckets.map((bucket, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                    {bucket.range}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {bucket.count}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                    Rp {bucket.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {bucket.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outstanding Invoices Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Outstanding Invoices Details
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Days Overdue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.outstandingInvoices
                .sort((a, b) => b.daysOverdue - a.daysOverdue)
                .map((invoice, index) => (
                  <tr key={index} className={getAgingBgColor(invoice.daysOverdue)}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {invoice.customerName}
                    </td>
                    <td className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(invoice.invoiceDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                      Rp {invoice.amount.toLocaleString('id-ID')}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right font-semibold ${getAgingColor(invoice.daysOverdue)}`}>
                      {invoice.daysOverdue > 0 ? `+${invoice.daysOverdue}` : invoice.daysOverdue}
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

export default OutstandingReport;
