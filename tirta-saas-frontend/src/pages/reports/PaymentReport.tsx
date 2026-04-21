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
import { PageHeader } from '../../components';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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

  const handleExport = (format: 'csv' | 'excel') => {
    if (!reportData) return;
    const baseName = `laporan_pembayaran_${filters.startDate}_${filters.endDate}`;

    const dailyRows = (reportData.dailyCollection || []).map((item) => ({
      'Tanggal': item.date,
      'Jumlah (IDR)': item.amount,
      'Jumlah': formatIDR(item.amount),
      'Transaksi': item.count,
    }));
    const methodRows = (reportData.paymentMethodBreakdown || []).map((item) => ({
      'Metode Pembayaran': item.method,
      'Jumlah (IDR)': item.amount,
      'Jumlah': formatIDR(item.amount),
      'Transaksi': item.count,
      'Persentase': `${item.percentage.toFixed(1)}%`,
    }));
    const outstandingRows = (reportData.outstandingPembayaran || []).map((item) => ({
      'Pelanggan': item.customerName,
      'No. Invoice': item.invoiceNumber,
      'Jumlah (IDR)': item.amount,
      'Jumlah': formatIDR(item.amount),
      'Jatuh Tempo': item.dueDate,
      'Hari Terlambat': item.daysOverdue,
    }));

    if (format === 'csv') {
      exportToCSV(dailyRows, `${baseName}_daily.csv`);
    } else {
      exportToExcel(
        [
          { sheetName: 'Penerimaan Harian', data: dailyRows },
          { sheetName: 'Per Metode Pembayaran', data: methodRows },
          { sheetName: 'Tunggakan', data: outstandingRows },
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

  const collectionRate = reportData.totalCollected + reportData.totalOutstanding > 0
    ? (reportData.totalCollected / (reportData.totalCollected + reportData.totalOutstanding)) * 100
    : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <PageHeader
        title="Laporan Pembayaran"
        subtitle="Analisis penerimaan pembayaran dan saldo tertunggak"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Total Tertagih</div>
          <div className="text-3xl font-bold">
            Rp {reportData.totalCollected.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Total Tunggakan</div>
          <div className="text-3xl font-bold">
            Rp {reportData.totalOutstanding.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="text-sm font-medium mb-2">Rasio Penagihan</div>
          <div className="text-3xl font-bold">{collectionRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Payment Method Breakdown & Daily Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Method Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rincian Metode Pembayaran
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
            Detail Metode Pembayaran
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Metode
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Jumlah
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Transaksi
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Persentase
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
          Tren Penerimaan Harian
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
              name="Jumlah Penerimaan"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Outstanding Pembayaran Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daftar Tunggakan
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Pelanggan
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Jumlah
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Jatuh Tempo
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Hari Terlambat
                  </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.outstandingPembayaran.map((payment, index) => (
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
