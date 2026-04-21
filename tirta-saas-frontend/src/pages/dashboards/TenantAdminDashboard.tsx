import { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  BanknotesIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components';

interface DashboardData {
  totalPelanggan: number;
  activePelanggan: number;
  unpaidCount: number;
  totalOutstanding: number;
  totalPemakaianM3: number;
  totalRevenue: number;
  oldestTagihan: Array<{ invoice_id: string; customer_id: string; total_amount: number; outstanding: number; created_at: string }>;
}

export default function TenantAdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    Promise.allSettled([
      reportService.getCustomerAnalytics(),
      reportService.getOutstandingReport(),
      reportService.getPemakaianReport({ month: thisMonth } as any),
      reportService.getRevenueReport(),
    ]).then(([custRes, outRes, usageRes, revRes]) => {
      const cust = custRes.status === 'fulfilled' ? custRes.value as any : {};
      const out = outRes.status === 'fulfilled' ? outRes.value as any : {};
      const usage = usageRes.status === 'fulfilled' ? usageRes.value as any : {};
      const rev = revRes.status === 'fulfilled' ? revRes.value as any : {};

      setData({
        totalPelanggan: cust.total_customers || 0,
        activePelanggan: cust.active_customers || 0,
        unpaidCount: out.unpaid_count || 0,
        totalOutstanding: out.total_outstanding || 0,
        totalPemakaianM3: usage.total_usage_m3 || 0,
        totalRevenue: rev.total_revenue || 0,
        oldestTagihan: out.oldest_invoices || [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Pengelola" subtitle="Ringkasan pengelolaan air RT/RW Anda" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Pelanggan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : data?.totalPelanggan ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Aktif: {loading ? '-' : data?.activePelanggan ?? 0}</p>
            </div>
            <div className="rounded-lg bg-blue-500 p-3"><UserGroupIcon className="h-6 w-6 text-white" /></div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Tagihan Belum Bayar</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : data ? fmt(data.totalOutstanding) : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{loading ? '-' : data?.unpaidCount ?? 0} invoice</p>
            </div>
            <div className="rounded-lg bg-yellow-500 p-3"><ExclamationCircleIcon className="h-6 w-6 text-white" /></div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Pemakaian Air Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : `${(data?.totalPemakaianM3 ?? 0).toLocaleString('id-ID')} m³`}
              </p>
            </div>
            <div className="rounded-lg bg-cyan-500 p-3"><ChartBarIcon className="h-6 w-6 text-white" /></div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Pendapatan Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : data ? fmt(data.totalRevenue) : '-'}
              </p>
            </div>
            <div className="rounded-lg bg-green-500 p-3"><BanknotesIcon className="h-6 w-6 text-white" /></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={() => navigate('/admin/customers/new')}
            className="flex min-h-28 flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
          >
            <UserGroupIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Tambah Pelanggan</span>
          </button>
          <button
            onClick={() => navigate('/admin/usage/create')}
            className="flex min-h-28 flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 text-center transition-colors hover:border-cyan-500 hover:bg-cyan-50"
          >
            <PencilSquareIcon className="h-8 w-8 text-cyan-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Catat Pemakaian</span>
          </button>
          <button
            onClick={() => navigate('/admin/invoices')}
            className="flex min-h-28 flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 text-center transition-colors hover:border-green-500 hover:bg-green-50"
          >
            <DocumentTextIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Lihat Tagihan</span>
          </button>
          <button
            onClick={() => navigate('/admin/payments')}
            className="flex min-h-28 flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 text-center transition-colors hover:border-yellow-500 hover:bg-yellow-50"
          >
            <BanknotesIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Pembayaran</span>
          </button>
        </div>
      </div>

      {/* Outstanding Tagihan */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tagihan Belum Dibayar (Terlama)</h2>
          <button
            onClick={() => navigate('/admin/invoices')}
            className="text-left text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Lihat Semua →
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : data?.oldestTagihan.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada tagihan outstanding.</p>
        ) : (
          <div className="space-y-3">
            {data?.oldestTagihan.map((inv) => (
              <div key={inv.invoice_id} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-mono">{inv.invoice_id.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sejak {new Date(inv.created_at).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-red-600">{fmt(inv.outstanding)}</p>
                  <p className="text-xs text-gray-500">dari {fmt(inv.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
