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
  useToast,
} from '../../components';
import { reportService } from '../../services/reportService';
import type { PemakaianReport as PemakaianReportType } from '../../types/report';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

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
      const data = await reportService.getPemakaianReport(filters);
      setReportData(data);
    } catch (err) {
      setReportData(null);
      showErrorToast(extractApiErrorMessage(err, 'Gagal memuat laporan pemakaian. Silakan coba lagi.'));
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
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="card h-80 animate-pulse" />
          <div className="card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="card p-8 text-center">
        <BeakerIcon className="mx-auto h-12 w-12 text-surface-300" />
        <h2 className="mt-4 text-[15px] font-semibold text-surface-800">Laporan pemakaian belum tersedia</h2>
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
        <span className="font-medium text-surface-700">Pemakaian</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Laporan Pemakaian Air</h1>
          <p className="mt-1 text-[13px] text-surface-400">Analisis tren pemakaian air. Periode: {periodLabel}</p>
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
          title="Total Pemakaian"
          value={`${reportData.totalPemakaian.toLocaleString('id-ID')} m3`}
          helper="Akumulasi periode"
          subtitle="Total volume air yang tercatat."
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
          subtitle="Jumlah titik data tren pemakaian."
          icon={UserGroupIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Konsumsi Tinggi"
          value={`${reportData.highConsumers.length}`}
          helper="Perlu dipantau"
          subtitle="Pelanggan dengan pemakaian tertinggi."
          icon={BeakerIcon}
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Tren total pemakaian</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.usageTrends}>
                <defs>
                  <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  formatter={(value: number) => `${value.toLocaleString('id-ID')} m3`}
                />
                <Area type="monotone" dataKey="totalPemakaian" stroke="#06B6D4" fill="url(#usageFill)" name="Total Pemakaian" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Rata-rata per pelanggan</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.usageTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                  formatter={(value: number) => `${Number(value).toFixed(2)} m3`}
                />
                <Line type="monotone" dataKey="averagePemakaian" stroke="#3B82F6" strokeWidth={2} name="Rata-rata" dot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Pelanggan konsumsi tertinggi</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.highConsumers}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada data konsumsi tinggi."
            columns={[
              { key: 'customerName', label: 'Pelanggan', sortable: true },
              { key: 'meterNumber', label: 'Meter', sortable: true },
              {
                key: 'usage',
                label: 'Pemakaian',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-brand-600">{Number(value || 0).toLocaleString('id-ID')} m3</span>,
              },
              {
                key: 'period',
                label: 'Periode',
                render: (_value, item) => `${item.month} ${item.year}`,
              },
            ]}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Rincian tren bulanan</h2>
        </div>
        <div className="p-5">
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
              { key: 'customerCount', label: 'Pelanggan', sortable: true, align: 'right' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
