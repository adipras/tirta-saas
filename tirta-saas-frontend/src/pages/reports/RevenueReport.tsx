import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import type { RevenueReport as RevenueReportType } from '../../types/report';
import {
  BarChart,
  Bar,
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
import { PageHeader } from '../../components';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const RevenueReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<RevenueReportType | null>(null);
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
      const data = await reportService.getRevenueReport(filters);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (!reportData) return;
    const baseName = `laporan_pendapatan_${filters.startDate}_${filters.endDate}`;

    const monthlyRows = (reportData.monthlyRevenue || []).map((item) => ({
      'Bulan': item.month,
      'Tahun': item.year,
      'Pendapatan (IDR)': item.revenue,
      'Pendapatan': formatIDR(item.revenue),
      'Tagihan': item.invoices,
    }));
    const byTypeRows = (reportData.revenueBySubscriptionType || []).map((item) => ({
      'Tipe Langganan': item.subscriptionType,
      'Pendapatan (IDR)': item.revenue,
      'Pendapatan': formatIDR(item.revenue),
      'Persentase': `${item.percentage.toFixed(1)}%`,
    }));

    if (format === 'csv') {
      exportToCSV(monthlyRows, `${baseName}_monthly.csv`);
    } else {
      exportToExcel(
        [
          { sheetName: 'Pendapatan Bulanan', data: monthlyRows },
          { sheetName: 'Per Tipe Langganan', data: byTypeRows },
        ],
        `${baseName}.xlsx`
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Data belum tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <PageHeader
        title="Laporan Pendapatan"
        subtitle={reportData ? `Periode: ${new Date(reportData.period.startDate).toLocaleDateString('id-ID')} - ${new Date(reportData.period.endDate).toLocaleDateString('id-ID')}` : undefined}
        actions={
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/admin/reports')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Kembali
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Ekspor CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Ekspor Excel
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
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
              Tanggal Selesai
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

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-8 mb-6 text-white">
        <h2 className="text-lg font-medium mb-2">Total Pendapatan</h2>
        <div className="text-4xl font-bold">
          Rp {reportData.totalRevenue.toLocaleString('id-ID')}
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pendapatan Bulanan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3B82F6" name="Pendapatan" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Subscription Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pendapatan per Tipe Langganan
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.revenueBySubscriptionType}
                dataKey="revenue"
                nameKey="subscriptionType"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.subscriptionType}: ${entry.percentage}%`}
              >
                {reportData.revenueBySubscriptionType.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[Number(index) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rincian per Tipe Langganan
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipe
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Pendapatan
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Persentase
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.revenueBySubscriptionType.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.subscriptionType}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                      Rp {item.revenue.toLocaleString('id-ID')}
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

      {/* Monthly Details Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rincian Bulanan</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Bulan
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Pendapatan
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Tagihan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.monthlyRevenue.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {item.month} {item.year}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">
                    {item.invoices}
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

export default RevenueReport;
