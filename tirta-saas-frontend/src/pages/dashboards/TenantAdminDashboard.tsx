import { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  BanknotesIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { DashboardStatCard, PageHeader, QuickActionCard } from '../../components';
import type { CustomerAnalytics, PemakaianReport, RevenueReport } from '../../types/report';

interface DashboardData {
  totalPelanggan: number;
  activePelanggan: number;
  unpaidCount: number;
  totalOutstanding: number;
  totalPemakaianM3: number;
  totalRevenue: number;
  oldestTagihan: Array<{ invoice_id: string; customer_id: string; total_amount: number; outstanding: number; created_at: string }>;
}

interface OutstandingReportSummary {
  unpaid_count?: number;
  total_outstanding?: number;
  oldest_invoices?: DashboardData['oldestTagihan'];
}

export default function TenantAdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    Promise.allSettled([
      reportService.getCustomerAnalytics(),
      reportService.getOutstandingReport(),
      reportService.getPemakaianReport({ startDate: monthStart, endDate: monthEnd }),
      reportService.getRevenueReport({ startDate: monthStart, endDate: monthEnd }),
    ]).then(([custRes, outRes, usageRes, revRes]) => {
      const cust: CustomerAnalytics | null = custRes.status === 'fulfilled' ? custRes.value : null;
      const out: OutstandingReportSummary | null = outRes.status === 'fulfilled' ? outRes.value : null;
      const usage: PemakaianReport | null = usageRes.status === 'fulfilled' ? usageRes.value : null;
      const rev: RevenueReport | null = revRes.status === 'fulfilled' ? revRes.value : null;

      setData({
        totalPelanggan: cust?.totalPelanggan ?? 0,
        activePelanggan: cust?.activePelanggan ?? 0,
        unpaidCount: out?.unpaid_count ?? 0,
        totalOutstanding: out?.total_outstanding ?? 0,
        totalPemakaianM3: usage?.totalPemakaian ?? 0,
        totalRevenue: rev?.totalRevenue ?? 0,
        oldestTagihan: out?.oldest_invoices ?? [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const hasOutstandingInvoices = (data?.unpaidCount ?? 0) > 0;

  const stats = [
    {
      title: 'Total pelanggan',
      value: loading ? '—' : (data?.totalPelanggan ?? 0).toLocaleString('id-ID'),
      helper: loading ? 'Memuat...' : `${data?.activePelanggan ?? 0} aktif`,
      subtitle: 'Pantau basis pelanggan aktif untuk memastikan layanan tetap berjalan lancar.',
      icon: UserGroupIcon,
      tone: 'blue' as const,
    },
    {
      title: 'Outstanding tagihan',
      value: loading ? '—' : data ? fmt(data.totalOutstanding) : '—',
      helper: loading ? 'Memuat...' : `${data?.unpaidCount ?? 0} belum dibayar`,
      subtitle: 'Gunakan angka ini sebagai prioritas tindak lanjut pembayaran pelanggan.',
      icon: ExclamationCircleIcon,
      tone: hasOutstandingInvoices ? 'red' as const : 'yellow' as const,
    },
    {
      title: 'Pemakaian bulan ini',
      value: loading ? '—' : `${(data?.totalPemakaianM3 ?? 0).toLocaleString('id-ID')} m³`,
      subtitle: 'Membantu mengecek apakah pencatatan meter bulan berjalan sudah bergerak sesuai rencana.',
      icon: ChartBarIcon,
      tone: 'cyan' as const,
    },
    {
      title: 'Pendapatan bulan ini',
      value: loading ? '—' : data ? fmt(data.totalRevenue) : '—',
      subtitle: 'Ringkasan pemasukan yang sudah tercatat dari pembayaran pelanggan bulan ini.',
      icon: BanknotesIcon,
      tone: 'green' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Langganan & pembayaran',
      description: 'Lihat status langganan, invoice registrasi, dan proses pembayaran.',
      icon: CheckBadgeIcon,
      onClick: () => navigate('/admin/subscription/upgrade'),
      tone: 'indigo' as const,
    },
    {
      title: 'Tambah pelanggan',
      description: 'Daftarkan pelanggan baru untuk pencatatan dan billing.',
      icon: UserGroupIcon,
      onClick: () => navigate('/admin/customers/new'),
      tone: 'blue' as const,
    },
    {
      title: 'Catat pemakaian',
      description: 'Masukkan meter reading terbaru untuk tagihan bulanan.',
      icon: PencilSquareIcon,
      onClick: () => navigate('/admin/usage/create'),
      tone: 'cyan' as const,
    },
    {
      title: 'Lihat tagihan',
      description: 'Tinjau tagihan pelanggan, outstanding, dan status.',
      icon: DocumentTextIcon,
      onClick: () => navigate('/admin/invoices'),
      tone: 'green' as const,
    },
    {
      title: 'Kelola pembayaran',
      description: 'Review transaksi, cetak bukti, atau tindak lanjuti masalah.',
      icon: BanknotesIcon,
      onClick: () => navigate('/admin/payments'),
      tone: 'yellow' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan operasional tenant untuk hari ini."
      />

      {/* Hero summary */}
      <section className="relative overflow-hidden rounded-xl border border-surface-200/80 bg-white shadow-card">
        <div className="gradient-brand p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex w-fit rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Ringkasan hari ini
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {loading
                  ? 'Memuat ringkasan...'
                  : hasOutstandingInvoices
                    ? `${data?.unpaidCount ?? 0} tagihan perlu ditindaklanjuti`
                    : 'Operasional terlihat aman hari ini'}
              </h2>
              <p className="max-w-2xl text-[13px] leading-relaxed text-white/80">
                {loading
                  ? 'Menyiapkan statistik pelanggan, tagihan, dan pembayaran terbaru.'
                  : hasOutstandingInvoices
                    ? `Total outstanding ${fmt(data?.totalOutstanding ?? 0)}. Prioritaskan peninjauan tagihan agar tidak menumpuk.`
                    : 'Belum ada outstanding besar. Anda bisa melanjutkan pencatatan atau meninjau tagihan terbaru.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/admin/invoices')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-xs transition-all hover:bg-white/90 hover:shadow-sm sm:w-auto"
              >
                Tinjau tagihan
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/payments')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
              >
                Cek pembayaran
              </button>
            </div>
          </div>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-1 divide-y border-t border-surface-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Pelanggan aktif</p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {loading ? '—' : `${data?.activePelanggan ?? 0} / ${data?.totalPelanggan ?? 0}`}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Pemakaian tercatat</p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {loading ? '—' : `${(data?.totalPemakaianM3 ?? 0).toLocaleString('id-ID')} m³`}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Pendapatan</p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {loading ? '—' : fmt(data?.totalRevenue ?? 0)}
            </p>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <DashboardStatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            helper={stat.helper}
            subtitle={stat.subtitle}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      {/* Quick actions */}
      <section className="rounded-xl border border-surface-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-surface-900">Aksi cepat</h2>
          <p className="mt-1 text-[13px] text-surface-400">
            Shortcut untuk tugas yang paling sering dipakai.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              tone={action.tone}
            />
          ))}
        </div>
      </section>

      {/* Outstanding invoices */}
      <section className="rounded-xl border border-surface-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-surface-900">Tagihan Belum Dibayar</h2>
            <p className="mt-1 text-[13px] text-surface-400">Daftar tagihan terlama yang perlu ditindaklanjuti.</p>
          </div>
          <button
            onClick={() => navigate('/admin/invoices')}
            className="text-[13px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Lihat semua
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-100" />
            ))}
          </div>
        ) : data?.oldestTagihan.length === 0 ? (
          <div className="rounded-xl bg-surface-50 p-8 text-center">
            <CheckBadgeIcon className="mx-auto h-10 w-10 text-success-400" />
            <p className="mt-3 text-sm font-medium text-surface-600">Tidak ada tagihan outstanding</p>
            <p className="mt-1 text-[13px] text-surface-400">Semua tagihan sudah dibayar atau belum ada tagihan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.oldestTagihan.map((inv) => (
              <div
                key={inv.invoice_id}
                className="group flex flex-col gap-4 rounded-xl border border-surface-100 bg-surface-50/50 p-4 transition-all hover:border-surface-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-medium text-surface-700">
                    #{inv.invoice_id.slice(0, 8)}...
                  </p>
                  <p className="mt-1 text-[12px] text-surface-400">
                    Tercatat {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-base font-bold text-danger-600">{fmt(inv.outstanding)}</p>
                    <p className="text-[11px] text-surface-400">dari {fmt(inv.total_amount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/invoices')}
                    className="btn-ghost hidden group-hover:inline-flex"
                  >
                    Buka
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
