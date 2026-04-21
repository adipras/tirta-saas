import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BeakerIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../../components';
const LaporanDashboard: React.FC = () => {
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
      title: 'Laporan Pendapatan',
      description: 'Lihat tren pendapatan, rincian bulanan, dan analisis tipe langganan',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      path: '/admin/reports/revenue',
    },
    {
      id: 'payments',
      title: 'Laporan Pembayaran',
      description: 'Pantau penerimaan pembayaran, metode pembayaran, dan saldo tertunggak',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      path: '/admin/reports/payments',
    },
    {
      id: 'customers',
      title: 'Analitik Pelanggan',
      description: 'Analisis pertumbuhan pelanggan, distribusi status, dan pelanggan teratas',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      path: '/admin/reports/customers',
    },
    {
      id: 'usage',
      title: 'Laporan Pemakaian',
      description: 'Pantau tren pemakaian air dan identifikasi pelanggan dengan konsumsi tinggi',
      icon: BeakerIcon,
      color: 'bg-cyan-500',
      path: '/admin/reports/usage',
    },
    {
      id: 'outstanding',
      title: 'Laporan Tunggakan',
      description: 'Lihat tagihan terlambat dan analisis umur piutang',
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      path: '/admin/reports/outstanding',
    },
  ];

  const handleViewReport = (path: string) => {
    navigate(`${path}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan & Analitik" subtitle="Kumpulan laporan dan analitik untuk pengelolaan layanan air Anda" />

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rentang Tanggal Default</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
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
              Tanggal Selesai
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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            onClick={() =>
              setDateRange({
                startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              })
            }
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Bulan Ini
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
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Tahun Ini
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
            className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Tahun Lalu
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                  Lihat Laporan -&gt;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() => navigate('/admin/invoices')}
            className="rounded-md border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-sm font-medium text-gray-900">Generate Tagihan</div>
            <div className="text-xs text-gray-600 mt-1">Buat tagihan bulanan</div>
          </button>
          <button
            onClick={() => navigate('/admin/payments/new')}
            className="rounded-md border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-sm font-medium text-gray-900">Catat Pembayaran</div>
            <div className="text-xs text-gray-600 mt-1">Tambahkan catatan pembayaran baru</div>
          </button>
          <button
            onClick={() => navigate('/admin/usage/create')}
            className="rounded-md border border-gray-300 p-4 text-left hover:bg-gray-50"
          >
            <div className="text-sm font-medium text-gray-900">Input Pemakaian</div>
            <div className="text-xs text-gray-600 mt-1">Catat hasil pembacaan meter</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaporanDashboard;
