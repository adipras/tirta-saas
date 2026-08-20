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
  BanknotesIcon,
  ChartBarIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  DashboardStatCard,
  DataTable,
  FormInput,
  useToast,
} from '../../components';
import { reportService } from '../../services/reportService';
import type { PaymentReport as PaymentReportType } from '../../types/report';
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

const ChartTooltip = ({
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

export default function PaymentReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<PaymentReportType | null>(null);
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
      const data = await reportService.getPaymentReport(filters);
      setReportData(data);
    } catch (err) {
      setReportData(null);
      showErrorToast(extractApiErrorMessage(err, 'Gagal memuat laporan pembayaran. Silakan coba lagi.'));
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

    const baseName = `laporan_pembayaran_${filters.startDate}_${filters.endDate}`;

    const dailyRows = (reportData.dailyCollection || []).map((item) => ({
      Tanggal: item.date,
      'Jumlah (IDR)': item.amount,
      Jumlah: formatIDR(item.amount),
      Transaksi: item.count,
    }));
    const methodRows = (reportData.paymentMethodBreakdown || []).map((item) => ({
      'Metode Pembayaran': item.method,
      'Jumlah (IDR)': item.amount,
      Jumlah: formatIDR(item.amount),
      Transaksi: item.count,
      Persentase: `${item.percentage.toFixed(1)}%`,
    }));
    const outstandingRows = (reportData.outstandingPembayaran || []).map((item) => ({
      Pelanggan: item.customerName,
      'No. Invoice': item.invoiceNumber,
      'Jumlah (IDR)': item.amount,
      Jumlah: formatIDR(item.amount),
      'Jatuh Tempo': item.dueDate,
      'Hari Terlambat': item.daysOverdue,
    }));

    if (format === 'csv') {
      exportToCSV(dailyRows, `${baseName}_daily.csv`);
      return;
    }

    exportToExcel(
      [
        { sheetName: 'Penerimaan Harian', data: dailyRows },
        { sheetName: 'Per Metode Pembayaran', data: methodRows },
        { sheetName: 'Tunggakan', data: outstandingRows },
      ],
      `${baseName}.xlsx`
    );
  };

  const collectionRate = useMemo(() => {
    if (!reportData) {
      return 0;
    }

    const total = reportData.totalCollected + reportData.totalOutstanding;
    return total > 0 ? (reportData.totalCollected / total) * 100 : 0;
  }, [reportData]);

  const totalTransactions = useMemo(
    () => reportData?.dailyCollection.reduce((total, item) => total + item.count, 0) || 0,
    [reportData?.dailyCollection]
  );

  const periodLabel = reportData
    ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
    : undefined;

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
        <ChartBarIcon className="mx-auto h-12 w-12 text-surface-300" />
        <h2 className="mt-4 text-[15px] font-semibold text-surface-800">Laporan pembayaran belum tersedia</h2>
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
        <span className="font-medium text-surface-700">Pembayaran</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Laporan Pembayaran</h1>
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Tertagih"
          value={formatIDR(reportData.totalCollected)}
          helper="Pendapatan terbayar"
          subtitle="Pembayaran yang sudah berhasil dikumpulkan."
          icon={BanknotesIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total Tunggakan"
          value={formatIDR(reportData.totalOutstanding)}
          helper="Perlu ditindaklanjuti"
          subtitle="Saldo outstanding yang masih perlu ditagih."
          icon={ExclamationTriangleIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Rasio Penagihan"
          value={`${collectionRate.toFixed(1)}%`}
          helper="Efektivitas koleksi"
          subtitle="Tagihan tertagih terhadap total nilai tagihan."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Total Transaksi"
          value={`${totalTransactions}`}
          helper={`${reportData.paymentMethodBreakdown.length} metode`}
          subtitle="Jumlah transaksi pada periode laporan."
          icon={CreditCardIcon}
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
          <h2 className="text-[15px] font-semibold text-surface-800">Distribusi metode pembayaran</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.paymentMethodBreakdown}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                >
                  {reportData.paymentMethodBreakdown.map((_entry, index) => (
                    <Cell key={`method-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Tren penerimaan harian</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.dailyCollection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
                  }
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip
                  content={<ChartTooltip />}
                  labelFormatter={(label) => formatDate(String(label))}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Jumlah Penerimaan"
                  dot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Rincian metode pembayaran</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.paymentMethodBreakdown}
            searchable={false}
            pageSize={6}
            emptyMessage="Belum ada data metode pembayaran."
            columns={[
              { key: 'method', label: 'Metode', sortable: true },
              {
                key: 'amount',
                label: 'Jumlah',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-brand-600">{formatIDR(Number(value || 0))}</span>,
              },
              { key: 'count', label: 'Transaksi', sortable: true, align: 'right' },
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
          <h2 className="text-[15px] font-semibold text-surface-800">Daftar tunggakan</h2>
        </div>
        <div className="p-5">
          <DataTable
            data={reportData.outstandingPembayaran}
            searchable={false}
            pageSize={8}
            emptyMessage="Tidak ada tunggakan pada periode ini."
            columns={[
              { key: 'customerName', label: 'Pelanggan', sortable: true },
              { key: 'invoiceNumber', label: 'Invoice', sortable: true },
              {
                key: 'amount',
                label: 'Jumlah',
                sortable: true,
                align: 'right',
                render: (value) => <span className="font-semibold text-danger-600">{formatIDR(Number(value || 0))}</span>,
              },
              {
                key: 'dueDate',
                label: 'Jatuh Tempo',
                sortable: true,
                render: (value) => formatDate(String(value || '')),
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
