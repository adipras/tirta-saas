import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { DashboardStatCard, FormInput, PageHeader } from '../../components';

const today = new Date().toISOString().split('T')[0];
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .split('T')[0];
const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
const startOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
const endOfLastYear = new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0];

const reports = [
  {
    id: 'revenue',
    title: 'Laporan Pendapatan',
    description: 'Lihat tren pendapatan, rincian bulanan, dan analisis tipe langganan.',
    icon: CurrencyDollarIcon,
    tone: 'green' as const,
    path: '/admin/reports/revenue',
  },
  {
    id: 'payments',
    title: 'Laporan Pembayaran',
    description: 'Pantau penerimaan pembayaran, metode pembayaran, dan saldo tertunggak.',
    icon: ChartBarIcon,
    tone: 'blue' as const,
    path: '/admin/reports/payments',
  },
  {
    id: 'customers',
    title: 'Analitik Pelanggan',
    description: 'Analisis pertumbuhan pelanggan, distribusi status, dan pelanggan teratas.',
    icon: UserGroupIcon,
    tone: 'purple' as const,
    path: '/admin/reports/customers',
  },
  {
    id: 'usage',
    title: 'Laporan Pemakaian',
    description: 'Pantau tren pemakaian air dan identifikasi pelanggan dengan konsumsi tinggi.',
    icon: BeakerIcon,
    tone: 'cyan' as const,
    path: '/admin/reports/usage',
  },
  {
    id: 'outstanding',
    title: 'Laporan Tunggakan',
    description: 'Lihat tagihan terlambat dan analisis umur piutang secara ringkas.',
    icon: DocumentTextIcon,
    tone: 'yellow' as const,
    path: '/admin/reports/outstanding',
  },
];

const quickActions = [
  {
    title: 'Generate Tagihan',
    description: 'Masuk ke halaman tagihan bulanan untuk proses generate invoice.',
    path: '/admin/invoices',
  },
  {
    title: 'Catat Pembayaran',
    description: 'Tambahkan catatan pembayaran baru secara manual dari admin.',
    path: '/admin/payments/new',
  },
  {
    title: 'Input Pemakaian',
    description: 'Catat hasil pembacaan meter terbaru pelanggan.',
    path: '/admin/usage/create',
  },
];

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth,
    endDate: today,
  });

  const rangeSummary = useMemo(() => {
    const start = new Date(dateRange.startDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const end = new Date(dateRange.endDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${start} - ${end}`;
  }, [dateRange.endDate, dateRange.startDate]);

  const handleViewReport = (path: string) => {
    navigate(`${path}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
  };

  const applyPreset = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan & Analitik"
        subtitle="Pilih laporan yang ingin dibuka, atur rentang tanggal default, lalu masuk ke halaman detail dari tampilan yang lebih nyaman di mobile."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Jenis Laporan"
          value={`${reports.length}`}
          helper="Siap dibuka"
          subtitle="Semua pintasan laporan tersedia dari satu dashboard ringkas."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Rentang Default"
          value={rangeSummary}
          helper="Dipakai saat buka laporan"
          subtitle="Tanggal ini otomatis dibawa saat Anda membuka halaman laporan detail."
          icon={CalendarDaysIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Aksi Cepat"
          value={`${quickActions.length}`}
          helper="Workflow operasional"
          subtitle="Shortcut ke halaman tagihan, pembayaran, dan input pemakaian."
          icon={DocumentTextIcon}
          tone="purple"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Rentang tanggal default</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Gunakan rentang ini sebagai filter awal sebelum masuk ke laporan tertentu.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {rangeSummary}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            type="date"
            label="Tanggal mulai"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <FormInput
            type="date"
            label="Tanggal selesai"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset(startOfMonth, today)}
            className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => applyPreset(startOfYear, today)}
            className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Tahun Ini
          </button>
          <button
            type="button"
            onClick={() => applyPreset(startOfLastYear, endOfLastYear)}
            className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Tahun Lalu
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Pilih laporan</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Setiap kartu akan membuka laporan dengan rentang tanggal yang sudah dipilih di atas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {reports.map((report) => (
            <article
              key={report.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-100">
                  <report.icon className="h-6 w-6 text-gray-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{report.description}</p>
                  <span
                    className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      report.tone === 'green'
                        ? 'bg-green-50 text-green-700'
                        : report.tone === 'blue'
                          ? 'bg-blue-50 text-blue-700'
                          : report.tone === 'purple'
                            ? 'bg-purple-50 text-purple-700'
                            : report.tone === 'cyan'
                              ? 'bg-cyan-50 text-cyan-700'
                              : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    Default: {rangeSummary}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleViewReport(report.path)}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
              >
                Buka Laporan
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Aksi cepat operasional</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              onClick={() => navigate(action.path)}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-gray-300 hover:bg-white"
            >
              <p className="text-sm font-semibold text-gray-900">{action.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">{action.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
