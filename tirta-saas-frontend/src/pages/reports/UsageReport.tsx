import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownTrayIcon,
  BeakerIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardStatCard,
  DataTable,
  FormInput,
  PageHeader,
} from '../../components';
import { reportService } from '../../services/reportService';
import type { PemakaianReport as PemakaianReportType } from '../../types/report';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function PemakaianReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<PemakaianReportType | null>(null);
  const [filters, setFilters] = useState({
    startDate:
      searchParams.get('startDate') ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: searchParams.get('endDate') || new Date().toISOString().split('T')[0],
  });

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getPemakaianReport(filters);
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

    const baseName = `laporan_pemakaian_${filters.startDate}_${filters.endDate}`;

    const trendsRows = (reportData.usageTrends || []).map((item) => ({
      Bulan: item.month,
      Tahun: item.year,
      'Total Pemakaian (m3)': item.totalPemakaian,
      'Rata-rata Pemakaian (m3)': item.averagePemakaian.toFixed(2),
      'Jumlah Pelanggan': item.customerCount,
    }));
    const highRows = (reportData.highConsumers || []).map((item) => ({
      Pelanggan: item.customerName,
      Meter: item.meterNumber,
      'Pemakaian (m3)': item.usage,
      Bulan: item.month,
      Tahun: item.year,
    }));

    if (format === 'csv') {
      exportToCSV(trendsRows, `${baseName}_tren.csv`);
      return;
    }

    exportToExcel(
      [
        { sheetName: 'Tren Pemakaian', data: trendsRows },
        { sheetName: 'Konsumsi Tertinggi', data: highRows },
      ],
      `${baseName}.xlsx`
    );
  };

  const periodLabel = useMemo(
    () => `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
    [filters.endDate, filters.startDate]
  );

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
        <BeakerIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-base font-semibold text-gray-900">Laporan pemakaian belum tersedia</h2>
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
        title="Laporan Pemakaian Air"
        subtitle={`Analisis tren pemakaian air untuk periode ${periodLabel}.`}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Pemakaian"
          value={`${reportData.totalPemakaian.toLocaleString('id-ID')} m3`}
          helper="Akumulasi periode"
          subtitle="Total volume air yang tercatat dalam laporan ini."
          icon={BeakerIcon}
          tone="cyan"
        />
        <DashboardStatCard
          title="Rata-rata"
          value={`${reportData.averagePemakaian.toFixed(2)} m3`}
          helper="Per pelanggan"
          subtitle="Rerata konsumsi air per pelanggan aktif."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Titik Tren"
          value={`${reportData.usageTrends.length}`}
          helper="Periode terukur"
          subtitle="Jumlah titik data yang digunakan untuk membaca tren pemakaian."
          icon={UserGroupIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Konsumsi Tinggi"
          value={`${reportData.highConsumers.length}`}
          helper="Perlu dipantau"
          subtitle="Pelanggan dengan pemakaian paling tinggi pada periode laporan."
          icon={BeakerIcon}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Tren total pemakaian</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.usageTrends}>
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('id-ID')} m3`} />
                <Area
                  type="monotone"
                  dataKey="totalPemakaian"
                  stroke="#06B6D4"
                  fill="url(#usageFill)"
                  name="Total Pemakaian"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Rata-rata per pelanggan</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.usageTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${Number(value).toFixed(2)} m3`} />
                <Line
                  type="monotone"
                  dataKey="averagePemakaian"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Rata-rata"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Pelanggan konsumsi tertinggi</h2>
        <div className="mt-4">
          <DataTable
            data={reportData.highConsumers}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada data konsumsi tinggi."
            columns={[
              {
                key: 'customerName',
                label: 'Pelanggan',
                sortable: true,
              },
              {
                key: 'meterNumber',
                label: 'Meter',
                sortable: true,
              },
              {
                key: 'usage',
                label: 'Pemakaian',
                sortable: true,
                align: 'right',
                render: (value) => `${Number(value || 0).toLocaleString('id-ID')} m3`,
              },
              {
                key: 'period',
                label: 'Periode',
                render: (_value, item) => `${item.month} ${item.year}`,
              },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Rincian tren bulanan</h2>
        <div className="mt-4">
          <DataTable
            data={reportData.usageTrends}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada tren pemakaian."
            columns={[
              {
                key: 'month',
                label: 'Bulan',
                sortable: true,
                render: (value, item) => `${String(value)} ${item.year}`,
              },
              {
                key: 'totalPemakaian',
                label: 'Total',
                sortable: true,
                align: 'right',
                render: (value) => `${Number(value || 0).toLocaleString('id-ID')} m3`,
              },
              {
                key: 'averagePemakaian',
                label: 'Rata-rata',
                sortable: true,
                align: 'right',
                render: (value) => `${Number(value || 0).toFixed(2)} m3`,
              },
              {
                key: 'customerCount',
                label: 'Pelanggan',
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
