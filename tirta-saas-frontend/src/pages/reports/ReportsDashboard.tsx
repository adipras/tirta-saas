import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { DashboardStatCard, FormInput } from '../../components';

const today = new Date().toISOString().split('T')[0];
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .split('T')[0];
const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
const startOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
const endOfLastYear = new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0];

const REPORT_TONE_MAP: Record<string, { icon: string; badge: string }> = {
  green: { icon: 'bg-success-50 text-success-600 ring-success-200/60', badge: 'bg-success-50 text-success-700 ring-success-200/60' },
  blue: { icon: 'bg-brand-50 text-brand-600 ring-brand-200/60', badge: 'bg-brand-50 text-brand-700 ring-brand-200/60' },
  purple: { icon: 'bg-purple-50 text-purple-600 ring-purple-200/60', badge: 'bg-purple-50 text-purple-700 ring-purple-200/60' },
  cyan: { icon: 'bg-cyan-50 text-cyan-600 ring-cyan-200/60', badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60' },
  yellow: { icon: 'bg-warning-50 text-warning-600 ring-warning-200/60', badge: 'bg-warning-50 text-warning-700 ring-warning-200/60' },
};

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
    title: 'Buat Tagihan',
    description: 'Masuk ke halaman tagihan bulanan untuk proses pembuatan invoice.',
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
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Laporan & Analitik</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Pilih laporan yang ingin dibuka, atur rentang tanggal default, lalu masuk ke halaman detail.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Jenis Laporan"
          value={`${reports.length}`}
          helper="Siap dibuka"
          subtitle="Semua pintasan laporan dari satu dashboard."
          icon={ChartBarIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Rentang Default"
          value={rangeSummary}
          helper="Dipakai saat buka laporan"
          subtitle="Tanggal ini otomatis dibawa ke laporan detail."
          icon={CalendarDaysIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Aksi Cepat"
          value={`${quickActions.length}`}
          helper="Workflow operasional"
          subtitle="Shortcut ke tagihan, pembayaran, dan input pemakaian."
          icon={DocumentTextIcon}
          tone="purple"
        />
      </div>

      {/* Date Range */}
      <section className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-surface-800">Rentang tanggal default</h2>
            <p className="mt-0.5 text-[13px] text-surface-400">
              Gunakan rentang ini sebagai filter awal sebelum masuk ke laporan tertentu.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200/60">
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
          {[
            { label: 'Bulan Ini', start: startOfMonth, end: today },
            { label: 'Tahun Ini', start: startOfYear, end: today },
            { label: 'Tahun Lalu', start: startOfLastYear, end: endOfLastYear },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.start, preset.end)}
              className="rounded-full bg-surface-100 px-3 py-1.5 text-[13px] font-medium text-surface-600 transition-colors hover:bg-surface-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {/* Reports Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-surface-800">Pilih laporan</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">
            Setiap kartu akan membuka laporan dengan rentang tanggal yang sudah dipilih.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {reports.map((report) => {
            const tone = REPORT_TONE_MAP[report.tone] || REPORT_TONE_MAP.blue;
            const Icon = report.icon;
            return (
              <article
                key={report.id}
                className="card group cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => handleViewReport(report.path)}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold text-surface-800">{report.title}</h3>
                    <p className="mt-1 text-[13px] text-surface-400">{report.description}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${tone.badge}`}>
                        Default: {rangeSummary}
                      </span>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-surface-300 transition-transform group-hover:translate-x-1 group-hover:text-surface-500" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Aksi cepat operasional</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              onClick={() => navigate(action.path)}
              className="rounded-xl border border-surface-200 bg-surface-50/50 p-4 text-left transition-all hover:border-surface-300 hover:bg-white hover:shadow-sm"
            >
              <p className="text-[14px] font-semibold text-surface-800">{action.title}</p>
              <p className="mt-1.5 text-[13px] text-surface-400">{action.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
