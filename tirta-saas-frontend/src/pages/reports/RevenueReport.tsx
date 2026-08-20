import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  CurrencyDollarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardStatCard,
  DataTable,
  FormInput,
  useToast,
} from '../../components';
import { reportService } from '../../services/reportService';
import type { RevenueReport as RevenueReportType } from '../../types/report';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

interface ChartTooltipItem {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const CurrencyTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipItem[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-surface-100 bg-white px-3 py-2 text-[13px] shadow-card">
      {label ? <p className="font-medium text-surface-800">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.dataKey as string} className="text-surface-500">
          {item.name}: <span className="font-semibold text-surface-800">{formatIDR(Number(item.value || 0))}</span>
        </p>
      ))}
    </div>
  );
};

export default function RevenueReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<RevenueReportType | null>(null);
  const { error: showErrorToast } = useToast();
  const [filters, setFilters] = useState({
    startDate:
      searchParams.get('startDate') ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: searchParams.get('endDate') || new Date().toISOString().split('T')[0],
  });

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getRevenueReport(filters);
      setReportData(data);
    } catch (err) {
      setReportData(null);
      showErrorToast(extractApiErrorMessage(err, 'Gagal memuat laporan pendapatan. Silakan coba lagi.'));
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

    const baseName = `laporan_pendapatan_${filters.startDate}_${filters.endDate}`;

    const monthlyRows = (reportData.monthlyRevenue || []).map((item) => ({
      Bulan: item.month,
      Tahun: item.year,
      'Pendapatan (IDR)': item.revenue,
      Pendapatan: formatIDR(item.revenue),
      Tagihan: item.invoices,
    }));
    const byTypeRows = (reportData.revenueBySubscriptionType || []).map((item) => ({
      'Tipe Langganan': item.subscriptionType,
      'Pendapatan (IDR)': item.revenue,
      Pendapatan: formatIDR(item.revenue),
      Persentase: `${item.percentage.toFixed(1)}%`,
    }));

    if (format === 'csv') {
      exportToCSV(monthlyRows, `${baseName}_monthly.csv`);
      return;
    }

    exportToExcel(
      [
        { sheetName: 'Pendapatan Bulanan', data: monthlyRows },
        { sheetName: 'Per Tipe Langganan', data: byTypeRows },
      ],
      `${baseName}.xlsx`
    );
  };

  const averageMonthlyRevenue = useMemo(() => {
    if (!reportData?.monthlyRevenue.length) {
      return 0;
    }

    return (
      reportData.monthlyRevenue.reduce((total, item) => total + item.revenue, 0) /
      reportData.monthlyRevenue.length
    );
  }, [reportData?.monthlyRevenue]);

  const totalInvoices = useMemo(
    () => reportData?.monthlyRevenue.reduce((total, item) => total + item.invoices, 0) || 0,
    [reportData?.monthlyRevenue]
  );

  const periodLabel = reportData
    ? `${formatDate(reportData.period.startDate)} - ${formatDate(reportData.period.endDate)}`
    : undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-100" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
        <ChartBarIcon className="mx-auto h-12 w-12 text-surface-300" />
        <h2 className="mt-4 text-[15px] font-semibold text-surface-800">Laporan pendapatan belum tersedia</h2>
        <p className="mt-2 text-[13px] text-surface-400">Silakan coba lagi beberapa saat lagi.</p>
        <button
          type="button"
          onClick={() => void fetchReportData()}
          className="btn-primary mt-4"
        >
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
        <span className="font-medium text-surface-700">Pendapatan</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Laporan Pendapatan</h1>
          {periodLabel && <p className="mt-1 text-[13px] text-surface-400">Periode: {periodLabel}</p>}
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Pendapatan"
          value={formatIDR(reportData.totalRevenue)}
          helper="Akumulasi periode aktif"
          subtitle="Total pemasukan pada rentang tanggal laporan."
          icon={CurrencyDollarIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Rata-rata Bulanan"
          value={formatIDR(averageMonthlyRevenue)}
          helper={`${reportData.monthlyRevenue.length} bulan tercatat`}
          subtitle="Rata-rata pendapatan per bulan."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Tipe & Tagihan"
          value={`${reportData.revenueBySubscriptionType.length} / ${totalInvoices}`}
          helper="Tipe langganan / total tagihan"
          subtitle="Perbandingan segmen langganan dengan total invoice."
          icon={TagIcon}
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

      {/* Bar Chart */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Tren pendapatan bulanan</h2>
        <p className="mt-0.5 text-[13px] text-surface-400">
          Gunakan grafik ini untuk melihat perubahan pendapatan dari waktu ke waktu.
        </p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="revenue" name="Pendapatan" radius={[4, 4, 0, 0]}>
                {reportData.monthlyRevenue.map((_item, index) => (
                  <Cell key={`monthly-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie + Summary */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Distribusi pendapatan per tipe</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.revenueBySubscriptionType}
                  dataKey="revenue"
                  nameKey="subscriptionType"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                >
                  {reportData.revenueBySubscriptionType.map((_entry, index) => (
                    <Cell key={`type-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CurrencyTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Ringkasan kontribusi tipe langganan</h2>
          <div className="mt-4 space-y-2">
            {reportData.revenueBySubscriptionType.map((item, index) => (
              <div key={`${item.subscriptionType}-${index}`} className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-surface-800">{item.subscriptionType}</p>
                  <p className="text-[12px] text-surface-400">{item.percentage.toFixed(1)}% dari total pendapatan</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200/60">
                  {formatIDR(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Rincian pendapatan per tipe</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.revenueBySubscriptionType}
            searchable={false}
            pageSize={5}
            emptyMessage="Belum ada rincian tipe langganan."
            columns={[
              {
                key: 'subscriptionType',
                label: 'Tipe',
                sortable: true,
              },
              {
                key: 'revenue',
                label: 'Pendapatan',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-brand-600">{formatIDR(Number(value || 0))}</span>,
              },
              {
                key: 'percentage',
                label: 'Persentase',
                sortable: true,
                align: 'right',
                render: (value) => `${Number(value || 0).toFixed(1)}%`,
              },
            ]}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Rincian bulanan</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.monthlyRevenue}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada rincian bulanan."
            columns={[
              {
                key: 'month',
                label: 'Bulan',
                sortable: true,
                render: (value, item) => `${String(value)} ${item.year}`,
              },
              {
                key: 'revenue',
                label: 'Pendapatan',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-brand-600">{formatIDR(Number(value || 0))}</span>,
              },
              {
                key: 'invoices',
                label: 'Tagihan',
                sortable: true,
                align: 'right',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
