import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  UserGroupIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardStatCard,
  DataTable,
  FormInput,
  useToast,
} from '../../components';
import { reportService } from '../../services/reportService';
import type { CustomerAnalytics as CustomerAnalyticsType } from '../../types/report';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function CustomerAnalytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<CustomerAnalyticsType | null>(null);
  const { error: showErrorToast } = useToast();
  const [filters, setFilters] = useState({
    startDate:
      searchParams.get('startDate') ||
      new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: searchParams.get('endDate') || new Date().toISOString().split('T')[0],
  });

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getCustomerAnalytics(filters);
      setReportData(data);
    } catch (err) {
      setReportData(null);
      showErrorToast(extractApiErrorMessage(err, 'Gagal memuat analitik pelanggan. Silakan coba lagi.'));
    } finally {
      setLoading(false);
    }
  }, [filters, showErrorToast]);

  useEffect(() => {
    void fetchReportData();
  }, [fetchReportData]);

  const handleExport = (format: 'csv' | 'excel') => {
    if (!reportData) {
      return;
    }

    const baseName = `analitik_pelanggan_${filters.startDate}_${filters.endDate}`;

    const topRows = (reportData.topPelanggan || []).map((item) => ({
      Peringkat: item.rank,
      Pelanggan: item.customerName,
      'Total Pemakaian (m3)': item.totalPemakaian,
      'Total Pendapatan (IDR)': item.totalRevenue,
      'Total Pendapatan': formatIDR(item.totalRevenue),
    }));
    const growthRows = (reportData.customerGrowth || []).map((item) => ({
      Bulan: item.month,
      Tahun: item.year,
      'Pelanggan Baru': item.newPelanggan,
      'Total Pelanggan': item.totalPelanggan,
    }));
    const statusRows = (reportData.statusDistribution || []).map((item) => ({
      Status: item.status,
      Jumlah: item.count,
      Persentase: `${item.percentage.toFixed(1)}%`,
    }));

    if (format === 'csv') {
      exportToCSV(topRows, `${baseName}_top_pelanggan.csv`);
      return;
    }

    exportToExcel(
      [
        { sheetName: 'Pelanggan Teratas', data: topRows },
        { sheetName: 'Pertumbuhan Pelanggan', data: growthRows },
        { sheetName: 'Distribusi Status', data: statusRows },
      ],
      `${baseName}.xlsx`
    );
  };

  const periodLabel = useMemo(
    () => `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
    [filters.endDate, filters.startDate]
  );

  const activeRate = useMemo(() => {
    if (!reportData?.totalPelanggan) {
      return 0;
    }

    return (reportData.activePelanggan / reportData.totalPelanggan) * 100;
  }, [reportData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
        <div className="card h-80 animate-pulse" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="card p-8 text-center">
        <UserGroupIcon className="mx-auto h-12 w-12 text-surface-300" />
        <h2 className="mt-4 text-[15px] font-semibold text-surface-800">Analitik pelanggan belum tersedia</h2>
        <p className="mt-2 text-[13px] text-surface-400">Silakan coba lagi beberapa saat lagi.</p>
        <button type="button" onClick={() => void fetchReportData()} className="btn-primary mt-4">
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <button onClick={() => navigate('/admin/reports')} className="transition-colors hover:text-surface-600">
          Laporan
        </button>
        <span>/</span>
        <span className="font-medium text-surface-700">Pelanggan</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Analitik Pelanggan</h1>
          <p className="mt-1 text-[13px] text-surface-400">Ringkasan pertumbuhan dan distribusi pelanggan. Periode: {periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/admin/reports')} className="btn-secondary">
            Kembali
          </button>
          <button type="button" onClick={() => handleExport('csv')} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" />
            CSV
          </button>
          <button type="button" onClick={() => handleExport('excel')} className="btn-primary">
            <ArrowDownTrayIcon className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Pelanggan"
          value={`${reportData.totalPelanggan}`}
          helper="Basis pelanggan"
          subtitle="Jumlah pelanggan dalam cakupan laporan."
          icon={UserGroupIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pelanggan Aktif"
          value={`${reportData.activePelanggan}`}
          helper={`${activeRate.toFixed(1)}% aktif`}
          subtitle="Pelanggan dengan status aktif."
          icon={UserIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Tidak Aktif"
          value={`${reportData.inactivePelanggan}`}
          helper="Perlu tindak lanjut"
          subtitle="Pelanggan nonaktif yang perlu dipantau."
          icon={ChartBarIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Ditangguhkan"
          value={`${reportData.suspendedPelanggan}`}
          helper="Kasus prioritas"
          subtitle="Pelanggan dengan status suspend."
          icon={ExclamationTriangleIcon}
          tone="purple"
        />
      </div>

      {/* Filter */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Filter periode</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            type="date"
            label="Tanggal mulai"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <FormInput
            type="date"
            label="Tanggal selesai"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Growth Chart */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Tren pertumbuhan pelanggan</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
              />
              <Line type="monotone" dataKey="newPelanggan" stroke="#10B981" name="Pelanggan Baru" strokeWidth={2} dot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="totalPelanggan" stroke="#3B82F6" name="Total Pelanggan" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie + Top Customers */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Distribusi status pelanggan</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                >
                  {reportData.statusDistribution.map((_entry, index) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Pelanggan kontribusi tertinggi</h2>
          <div className="mt-4 space-y-2">
            {reportData.topPelanggan.slice(0, 5).map((customer) => (
              <div key={`${customer.customerId}-${customer.rank}`} className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-surface-800">
                    #{customer.rank} {customer.customerName}
                  </p>
                  <p className="text-[12px] text-surface-400">
                    Pemakaian {customer.totalPemakaian.toLocaleString('id-ID')} m3
                  </p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200/60">
                  {formatIDR(customer.totalRevenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Rincian pertumbuhan bulanan</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.customerGrowth}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada data pertumbuhan pelanggan."
            columns={[
              {
                key: 'month',
                label: 'Bulan',
                sortable: true,
                render: (value, item) => `${String(value)} ${item.year}`,
              },
              { key: 'newPelanggan', label: 'Pelanggan Baru', sortable: true, align: 'right' },
              { key: 'totalPelanggan', label: 'Total Pelanggan', sortable: true, align: 'right' },
              {
                key: 'growth_rate',
                label: 'Pertumbuhan',
                align: 'right',
                render: (_value, item) => {
                  const index = reportData.customerGrowth.findIndex(
                    (growthItem) => growthItem.month === item.month && growthItem.year === item.year
                  );
                  const prevTotal = index > 0 ? reportData.customerGrowth[index - 1].totalPelanggan : 0;
                  const growthRate = prevTotal > 0 ? ((item.totalPelanggan - prevTotal) / prevTotal) * 100 : 0;
                  return (
                    <span className={growthRate > 0 ? 'font-medium text-success-600' : 'text-surface-400'}>
                      {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
                    </span>
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Rincian pelanggan teratas</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.topPelanggan}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada data pelanggan teratas."
            columns={[
              { key: 'rank', label: 'Peringkat', sortable: true, align: 'right' },
              { key: 'customerName', label: 'Pelanggan', sortable: true },
              {
                key: 'totalPemakaian',
                label: 'Pemakaian',
                sortable: true,
                align: 'right',
                render: (value) => `${Number(value || 0).toLocaleString('id-ID')} m3`,
              },
              {
                key: 'totalRevenue',
                label: 'Pendapatan',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-brand-600">{formatIDR(Number(value || 0))}</span>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
