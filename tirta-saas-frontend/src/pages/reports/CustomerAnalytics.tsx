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
  PageHeader,
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
      <div role="status" aria-label="Memuat analitik pelanggan..." className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" aria-hidden="true" />
        <span className="sr-only">Memuat analitik pelanggan...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-base font-semibold text-gray-900">Analitik pelanggan belum tersedia</h2>
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
        title="Analitik Pelanggan"
        subtitle={`Ringkasan pertumbuhan dan distribusi pelanggan untuk periode ${periodLabel}.`}
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
              <ArrowDownTrayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              Ekspor CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <ArrowDownTrayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              Ekspor Excel
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Pelanggan"
          value={`${reportData.totalPelanggan}`}
          helper="Basis pelanggan"
          subtitle="Jumlah pelanggan yang masuk dalam cakupan laporan ini."
          icon={UserGroupIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pelanggan Aktif"
          value={`${reportData.activePelanggan}`}
          helper={`${activeRate.toFixed(1)}% aktif`}
          subtitle="Pelanggan dengan status aktif dibanding total pelanggan."
          icon={UserIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Tidak Aktif"
          value={`${reportData.inactivePelanggan}`}
          helper="Perlu tindak lanjut"
          subtitle="Pelanggan nonaktif yang perlu dipantau ulang."
          icon={ChartBarIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Ditangguhkan"
          value={`${reportData.suspendedPelanggan}`}
          helper="Kasus prioritas"
          subtitle="Jumlah pelanggan dengan status suspend pada periode ini."
          icon={ExclamationTriangleIcon}
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
        <h2 className="text-base font-semibold text-gray-900">Tren pertumbuhan pelanggan</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="newPelanggan"
                stroke="#10B981"
                name="Pelanggan Baru"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="totalPelanggan"
                stroke="#3B82F6"
                name="Total Pelanggan"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Distribusi status pelanggan</h2>
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Pelanggan kontribusi tertinggi</h2>
          <div className="mt-4 space-y-3">
            {reportData.topPelanggan.slice(0, 5).map((customer) => (
              <div key={`${customer.customerId}-${customer.rank}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      #{customer.rank} {customer.customerName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Pemakaian {customer.totalPemakaian.toLocaleString('id-ID')} m3
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-gray-200">
                    {formatIDR(customer.totalRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Rincian pertumbuhan bulanan</h2>
        <div className="mt-4">
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
              {
                key: 'newPelanggan',
                label: 'Pelanggan Baru',
                sortable: true,
                align: 'right',
              },
              {
                key: 'totalPelanggan',
                label: 'Total Pelanggan',
                sortable: true,
                align: 'right',
              },
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
                  return `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
                },
              },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Rincian pelanggan teratas</h2>
        <div className="mt-4">
          <DataTable
            data={reportData.topPelanggan}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada data pelanggan teratas."
            columns={[
              {
                key: 'rank',
                label: 'Peringkat',
                sortable: true,
                align: 'right',
              },
              {
                key: 'customerName',
                label: 'Pelanggan',
                sortable: true,
              },
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
                render: (value) => formatIDR(Number(value || 0)),
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
