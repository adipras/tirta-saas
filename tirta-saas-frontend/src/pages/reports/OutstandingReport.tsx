import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardStatCard,
  DataTable,
  FormInput,
  useToast,
} from '../../components';
import { reportService } from '../../services/reportService';
import type { OutstandingReportData } from '../../types/report';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function OutstandingReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<OutstandingReportData | null>(null);
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
      const data = await reportService.getOutstandingReport(filters);
      setReportData(data);
    } catch (err) {
      setReportData(null);
      showErrorToast(extractApiErrorMessage(err, 'Gagal memuat laporan tunggakan. Silakan coba lagi.'));
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

    const baseName = `laporan_tunggakan_${filters.startDate}_${filters.endDate}`;

    const invoiceRows = (reportData.outstandingTagihan || []).map((item) => ({
      Pelanggan: item.customerName,
      Invoice: item.invoiceNumber,
      'Tanggal Invoice': item.invoiceDate,
      'Jatuh Tempo': item.dueDate,
      'Jumlah (IDR)': item.amount,
      Jumlah: formatIDR(item.amount),
      'Hari Terlambat': item.daysOverdue,
    }));
    const agingRows = (reportData.agingBuckets || []).map((item) => ({
      'Rentang Aging': item.range,
      Jumlah: item.count,
      'Nominal (IDR)': item.amount,
      Nominal: formatIDR(item.amount),
      Persentase: `${item.percentage.toFixed(1)}%`,
    }));

    if (format === 'csv') {
      exportToCSV(invoiceRows, `${baseName}_invoice.csv`);
      return;
    }

    exportToExcel(
      [
        { sheetName: 'Tagihan Tertunggak', data: invoiceRows },
        { sheetName: 'Analisis Aging', data: agingRows },
      ],
      `${baseName}.xlsx`
    );
  };

  const periodLabel = useMemo(
    () => `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
    [filters.endDate, filters.startDate]
  );

  const sortedOutstanding = useMemo(
    () => [...(reportData?.outstandingTagihan || [])].sort((a, b) => b.daysOverdue - a.daysOverdue),
    [reportData?.outstandingTagihan]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100" />
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
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-surface-300" />
        <h2 className="mt-4 text-[15px] font-semibold text-surface-800">Laporan tunggakan belum tersedia</h2>
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
        <span className="font-medium text-surface-700">Tunggakan</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Laporan Tunggakan</h1>
          <p className="mt-1 text-[13px] text-surface-400">Analisis invoice overdue dan aging piutang. Periode: {periodLabel}</p>
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

      {/* Alert Banner */}
      {reportData.overdueCount > 0 && (
        <section className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-500" />
            <div>
              <p className="text-[14px] font-semibold text-danger-700">
                {reportData.overdueCount} invoice sudah melewati jatuh tempo
              </p>
              <p className="mt-1 text-[13px] text-danger-600">
                Prioritaskan penagihan pada invoice dengan hari keterlambatan tertinggi.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Outstanding"
          value={formatIDR(reportData.totalOutstanding)}
          helper="Saldo tertunggak"
          subtitle="Nilai piutang outstanding pada periode ini."
          icon={CurrencyDollarIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Pelanggan Terdampak"
          value={`${reportData.totalPelanggan}`}
          helper="Dengan tagihan tertunggak"
          subtitle="Jumlah pelanggan dengan outstanding invoice."
          icon={UserGroupIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Invoice Overdue"
          value={`${reportData.overdueCount}`}
          helper="Perlu tindak lanjut cepat"
          subtitle="Invoice yang sudah melewati jatuh tempo."
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

      {/* Aging Chart */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Analisis aging piutang</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.agingBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                formatter={(value: number) => formatIDR(value)}
              />
              <Bar dataKey="amount" fill="#EF4444" name="Nominal Outstanding" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Rincian aging bucket</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.agingBuckets}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada bucket aging."
            columns={[
              { key: 'range', label: 'Rentang', sortable: true },
              { key: 'count', label: 'Jumlah', sortable: true, align: 'right' },
              {
                key: 'amount',
                label: 'Nominal',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-danger-600">{formatIDR(Number(value || 0))}</span>,
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
          <h2 className="text-[15px] font-semibold text-surface-800">Daftar invoice tertunggak</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={sortedOutstanding}
            searchable={false}
            pageSize={8}
            emptyMessage="Tidak ada invoice tertunggak pada periode ini."
            columns={[
              { key: 'customerName', label: 'Pelanggan', sortable: true },
              { key: 'invoiceNumber', label: 'Invoice', sortable: true },
              {
                key: 'invoiceDate',
                label: 'Tanggal Invoice',
                sortable: true,
                render: (value) => formatDate(String(value || '')),
              },
              {
                key: 'dueDate',
                label: 'Jatuh Tempo',
                sortable: true,
                render: (value) => formatDate(String(value || '')),
              },
              {
                key: 'amount',
                label: 'Nominal',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-danger-600">{formatIDR(Number(value || 0))}</span>,
              },
              {
                key: 'daysOverdue',
                label: 'Hari Terlambat',
                sortable: true,
                align: 'right',
                render: (value) => {
                  const days = Number(value || 0);
                  return (
                    <span className={days > 0 ? 'font-medium text-danger-600' : 'text-surface-400'}>
                      {days > 0 ? `+${days}` : `${days}`}
                    </span>
                  );
                },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
