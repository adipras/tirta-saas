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
  PageHeader,
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
      <div role="status" aria-label="Memuat laporan pembayaran..." className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" aria-hidden="true" />
        <span className="sr-only">Memuat laporan pembayaran...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-base font-semibold text-gray-900">Laporan pembayaran belum tersedia</h2>
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
        title="Laporan Pembayaran"
        subtitle={periodLabel ? `Analisis penerimaan pembayaran untuk periode ${periodLabel}` : undefined}
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
          title="Total Tertagih"
          value={formatIDR(reportData.totalCollected)}
          helper="Pendapatan terbayar"
          subtitle="Jumlah pembayaran yang sudah berhasil dikumpulkan."
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
          subtitle="Perbandingan tagihan tertagih terhadap total nilai tagihan."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Total Transaksi"
          value={`${totalTransactions}`}
          helper={`${reportData.paymentMethodBreakdown.length} metode`}
          subtitle="Jumlah transaksi yang tercatat pada periode laporan."
          icon={CreditCardIcon}
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
          <h2 className="text-base font-semibold text-gray-900">Distribusi metode pembayaran</h2>
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
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Tren penerimaan harian</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.dailyCollection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} />
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
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Rincian metode pembayaran</h2>
        <div className="mt-4">
          <DataTable
            data={reportData.paymentMethodBreakdown}
            searchable={false}
            pageSize={6}
            emptyMessage="Belum ada data metode pembayaran."
            columns={[
              {
                key: 'method',
                label: 'Metode',
                sortable: true,
              },
              {
                key: 'amount',
                label: 'Jumlah',
                sortable: true,
                align: 'right',
                render: (value) => formatIDR(Number(value || 0)),
              },
              {
                key: 'count',
                label: 'Transaksi',
                sortable: true,
                align: 'right',
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
        <h2 className="text-base font-semibold text-gray-900">Daftar tunggakan</h2>
        <div className="mt-4">
          <DataTable
            data={reportData.outstandingPembayaran}
            searchable={false}
            pageSize={8}
            emptyMessage="Tidak ada tunggakan pada periode ini."
            columns={[
              {
                key: 'customerName',
                label: 'Pelanggan',
                sortable: true,
              },
              {
                key: 'invoiceNumber',
                label: 'Invoice',
                sortable: true,
              },
              {
                key: 'amount',
                label: 'Jumlah',
                sortable: true,
                align: 'right',
                render: (value) => formatIDR(Number(value || 0)),
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
                  return days > 0 ? `+${days}` : `${days}`;
                },
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
