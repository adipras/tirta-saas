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
  PageHeader,
} from '../../components';
import { reportService } from '../../services/reportService';
import type { RevenueReport as RevenueReportType } from '../../types/report';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';

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

const formatCurrencyShort = (value: number) => formatIDR(value);

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
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
      {label ? <p className="font-medium text-gray-900">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.dataKey as string} className="text-gray-600">
          {item.name}: <span className="font-semibold text-gray-900">{formatIDR(Number(item.value || 0))}</span>
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
    } catch {
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-base font-semibold text-gray-900">Laporan pendapatan belum tersedia</h2>
        <p className="mt-2 text-sm text-gray-500">Silakan coba lagi beberapa saat lagi.</p>
        <button
          type="button"
          onClick={() => void fetchReportData()}
          className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pendapatan"
        subtitle={periodLabel ? `Periode laporan: ${periodLabel}` : undefined}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/admin/reports')}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center justify-center rounded-xl bg-gray-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
              Ekspor CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
              Ekspor Excel
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Pendapatan"
          value={formatCurrencyShort(reportData.totalRevenue)}
          helper="Akumulasi periode aktif"
          subtitle="Total pemasukan yang tercatat pada rentang tanggal laporan."
          icon={CurrencyDollarIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Rata-rata Bulanan"
          value={formatCurrencyShort(averageMonthlyRevenue)}
          helper={`${reportData.monthlyRevenue.length} bulan tercatat`}
          subtitle="Rata-rata pendapatan per bulan berdasarkan data di laporan ini."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Tipe & Tagihan"
          value={`${reportData.revenueBySubscriptionType.length} / ${totalInvoices}`}
          helper="Tipe langganan / total tagihan"
          subtitle="Perbandingan jumlah segmen langganan dengan total invoice yang masuk."
          icon={TagIcon}
          tone="purple"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Filter periode</h2>
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
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Tren pendapatan bulanan</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Gunakan grafik ini untuk melihat perubahan pendapatan dari waktu ke waktu.
        </p>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Bar dataKey="revenue" fill="#3B82F6" name="Pendapatan">
                {reportData.monthlyRevenue.map((_item, index) => (
                  <Cell key={`monthly-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Distribusi pendapatan per tipe</h2>
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
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Ringkasan kontribusi tipe langganan</h2>
          <div className="mt-4 space-y-3">
            {reportData.revenueBySubscriptionType.map((item, index) => (
              <div key={`${item.subscriptionType}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.subscriptionType}</p>
                    <p className="mt-1 text-sm text-gray-500">{item.percentage.toFixed(1)}% dari total pendapatan</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-gray-200">
                    {formatIDR(item.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Rincian pendapatan per tipe</h2>
        <div className="mt-4">
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
                render: (value) => formatIDR(Number(value || 0)),
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
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Rincian bulanan</h2>
        <div className="mt-4">
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
                render: (value) => formatIDR(Number(value || 0)),
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
      </section>
    </div>
  );
}
