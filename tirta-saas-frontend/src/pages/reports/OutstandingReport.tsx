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
  PageHeader,
  useToast,
} from '../../components';
import { reportService } from '../../services/reportService';
import { exportToCSV, exportToExcel, formatIDR } from '../../utils/exportUtils';
import { extractApiErrorMessage } from '../../utils/apiError';

interface AgingBucket {
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

interface OutstandingInvoice {
  customerId: number;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
}

interface OutstandingReportData {
  totalOutstanding: number;
  totalPelanggan: number;
  overdueCount: number;
  agingBuckets: AgingBucket[];
  outstandingTagihan: OutstandingInvoice[];
}

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
      const data = (await reportService.getOutstandingReport(filters)) as OutstandingReportData;
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
      <div role="status" aria-label="Memuat laporan tunggakan..." className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" aria-hidden="true" />
        <span className="sr-only">Memuat laporan tunggakan...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-base font-semibold text-gray-900">Laporan tunggakan belum tersedia</h2>
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
        title="Laporan Tunggakan"
        subtitle={`Analisis invoice overdue dan aging piutang untuk periode ${periodLabel}.`}
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

      {reportData.overdueCount > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
            <div>
              <h2 className="text-base font-semibold text-red-900">
                {reportData.overdueCount} invoice sudah melewati jatuh tempo
              </h2>
              <p className="mt-2 text-sm leading-6 text-red-900">
                Prioritaskan penagihan pada invoice dengan hari keterlambatan tertinggi.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Outstanding"
          value={formatIDR(reportData.totalOutstanding)}
          helper="Saldo tertunggak"
          subtitle="Nilai piutang outstanding pada periode laporan ini."
          icon={CurrencyDollarIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Pelanggan Terdampak"
          value={`${reportData.totalPelanggan}`}
          helper="Dengan tagihan tertunggak"
          subtitle="Jumlah pelanggan yang memiliki outstanding invoice."
          icon={UserGroupIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Invoice Overdue"
          value={`${reportData.overdueCount}`}
          helper="Perlu tindak lanjut cepat"
          subtitle="Jumlah invoice yang sudah melewati jatuh tempo."
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
        <h2 className="text-base font-semibold text-gray-900">Analisis aging piutang</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.agingBuckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)} jt`} />
              <Tooltip formatter={(value: number) => formatIDR(value)} />
              <Bar dataKey="amount" fill="#EF4444" name="Nominal Outstanding" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Rincian aging bucket</h2>
        <div className="mt-4">
          <DataTable
            data={reportData.agingBuckets}
            searchable={false}
            pageSize={8}
            emptyMessage="Belum ada bucket aging."
            columns={[
              {
                key: 'range',
                label: 'Rentang',
                sortable: true,
              },
              {
                key: 'count',
                label: 'Jumlah',
                sortable: true,
                align: 'right',
              },
              {
                key: 'amount',
                label: 'Nominal',
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
        <h2 className="text-base font-semibold text-gray-900">Daftar invoice tertunggak</h2>
        <div className="mt-4">
          <DataTable
            data={sortedOutstanding}
            searchable={false}
            pageSize={8}
            emptyMessage="Tidak ada invoice tertunggak pada periode ini."
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
                render: (value) => formatIDR(Number(value || 0)),
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
