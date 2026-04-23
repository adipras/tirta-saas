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
      value: loading ? '...' : (data?.totalPelanggan ?? 0).toLocaleString('id-ID'),
      helper: loading ? 'Memuat data' : `Aktif ${data?.activePelanggan ?? 0} pelanggan`,
      subtitle: 'Pantau basis pelanggan aktif untuk memastikan layanan tetap berjalan lancar.',
      icon: UserGroupIcon,
      tone: 'blue' as const,
    },
    {
      title: 'Outstanding tagihan',
      value: loading ? '...' : data ? fmt(data.totalOutstanding) : '-',
      helper: loading ? 'Memuat data' : `${data?.unpaidCount ?? 0} tagihan belum dibayar`,
      subtitle: 'Gunakan angka ini sebagai prioritas tindak lanjut pembayaran pelanggan.',
      icon: ExclamationCircleIcon,
      tone: 'yellow' as const,
    },
    {
      title: 'Pemakaian bulan ini',
      value: loading ? '...' : `${(data?.totalPemakaianM3 ?? 0).toLocaleString('id-ID')} m3`,
      subtitle: 'Membantu mengecek apakah pencatatan meter bulan berjalan sudah bergerak sesuai rencana.',
      icon: ChartBarIcon,
      tone: 'cyan' as const,
    },
    {
      title: 'Pendapatan bulan ini',
      value: loading ? '...' : data ? fmt(data.totalRevenue) : '-',
      subtitle: 'Ringkasan pemasukan yang sudah tercatat dari pembayaran pelanggan bulan ini.',
      icon: BanknotesIcon,
      tone: 'green' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Langganan & pembayaran',
      description: 'Lihat status langganan tenant, invoice registrasi, dan proses pembayaran.',
      icon: CheckBadgeIcon,
      onClick: () => navigate('/admin/subscription/upgrade'),
      tone: 'indigo' as const,
    },
    {
      title: 'Tambah pelanggan',
      description: 'Daftarkan pelanggan baru agar siap dipakai dalam pencatatan dan billing.',
      icon: UserGroupIcon,
      onClick: () => navigate('/admin/customers/new'),
      tone: 'blue' as const,
    },
    {
      title: 'Catat pemakaian',
      description: 'Masukkan meter reading terbaru untuk mempermudah proses tagihan bulanan.',
      icon: PencilSquareIcon,
      onClick: () => navigate('/admin/usage/create'),
      tone: 'cyan' as const,
    },
    {
      title: 'Lihat tagihan',
      description: 'Tinjau tagihan pelanggan, outstanding, dan status pembayaran terkini.',
      icon: DocumentTextIcon,
      onClick: () => navigate('/admin/invoices'),
      tone: 'green' as const,
    },
    {
      title: 'Kelola pembayaran',
      description: 'Review transaksi pembayaran, cetak bukti, atau tindak lanjuti masalah pembayaran.',
      icon: BanknotesIcon,
      onClick: () => navigate('/admin/payments'),
      tone: 'yellow' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Pengelola"
        subtitle="Mulai dari ringkasan terpenting untuk operasional tenant, lalu lanjut ke aksi harian yang paling sering dipakai."
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-600 p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-blue-50">
                Ringkasan hari ini
              </span>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {loading
                  ? 'Memuat ringkasan tenant...'
                  : hasOutstandingInvoices
                    ? `${data?.unpaidCount ?? 0} tagihan pelanggan perlu ditindaklanjuti`
                    : 'Operasional tenant terlihat aman untuk hari ini'}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-blue-50/90">
                {loading
                  ? 'Menyiapkan statistik pelanggan, tagihan, dan pembayaran terbaru.'
                  : hasOutstandingInvoices
                    ? `Total outstanding saat ini ${fmt(data?.totalOutstanding ?? 0)}. Prioritaskan peninjauan tagihan dan pembayaran agar tidak menumpuk.`
                    : 'Belum ada outstanding besar yang perlu perhatian cepat. Anda bisa melanjutkan pencatatan pemakaian atau meninjau tagihan terbaru.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/admin/invoices')}
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:w-auto"
              >
                Tinjau tagihan
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/payments')}
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 sm:w-auto"
              >
                Cek pembayaran
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Prioritas berikutnya</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Fokus pada item yang paling berdampak untuk operasional hari ini.
              </p>
            </div>
            <CheckBadgeIcon className="h-10 w-10 flex-shrink-0 text-blue-600" />
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">Status pelanggan aktif</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {loading
                  ? 'Memuat status pelanggan...'
                  : `${data?.activePelanggan ?? 0} dari ${data?.totalPelanggan ?? 0} pelanggan sudah aktif.`}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">Pencatatan pemakaian bulan ini</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {loading
                  ? 'Memuat data pemakaian...'
                  : `${(data?.totalPemakaianM3 ?? 0).toLocaleString('id-ID')} m3 sudah tercatat pada bulan berjalan.`}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">Pendapatan tercatat</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {loading
                  ? 'Memuat data pendapatan...'
                  : `${fmt(data?.totalRevenue ?? 0)} berhasil tercatat pada periode bulan ini.`}
              </p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Aksi cepat</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Shortcut untuk tugas tenant admin yang paling sering dipakai dari layar kecil maupun desktop.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tagihan Belum Dibayar (Terlama)</h2>
          <button
            onClick={() => navigate('/admin/invoices')}
            className="inline-flex items-center text-left text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Lihat semua
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : data?.oldestTagihan.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
            Tidak ada tagihan outstanding. Fokus bisa dialihkan ke pencatatan pemakaian dan peninjauan tagihan terbaru.
          </div>
        ) : (
          <div className="space-y-3">
            {data?.oldestTagihan.map((inv) => (
              <div
                key={inv.invoice_id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Invoice</p>
                    <p className="mt-1 font-mono text-sm text-gray-900">{inv.invoice_id.slice(0, 8)}...</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Tercatat sejak {new Date(inv.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:items-end">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-semibold text-red-600">{fmt(inv.outstanding)}</p>
                      <p className="text-xs text-gray-500">dari total {fmt(inv.total_amount)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/invoices')}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                      Buka daftar tagihan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
