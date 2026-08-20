import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../hooks/redux';
import { invoiceService } from '../../services/invoiceService';
import { customerProfilService } from '../../services/customerProfileService';
import type { Invoice } from '../../types/invoice';
import type { CustomerProfil } from '../../types/customerProfile';
import { DashboardStatCard, PageHeader, QuickActionCard } from '../../components';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [profile, setProfil] = useState<CustomerProfil | null>(null);
  const [invoices, setTagihan] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, invoicesData] = await Promise.all([
        customerProfilService.getProfil(),
        invoiceService.getCustomerTagihan(),
      ]);
      setProfil(profileData);
      setTagihan(invoicesData);
    } catch {
      setError('Gagal memuat data. Silakan muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  };

  const unpaidTagihan = invoices.filter((inv) => inv.status !== 'paid');
  const totalUnpaid = unpaidTagihan.reduce((sum, inv) => sum + Number(inv.totalAmount ?? 0), 0);
  const overdueTagihan = unpaidTagihan.filter((inv) => inv.status === 'overdue');
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length;

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
        <p className="text-[13px] text-danger-700">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 rounded-lg bg-danger-600 px-4 py-2 text-sm text-white hover:bg-danger-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan tagihan, pembayaran, dan pemakaian air Anda."
      />

      {/* Hero summary */}
      <section className="relative overflow-hidden rounded-xl border border-surface-200/80 bg-white shadow-card">
        <div className="gradient-brand p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex w-fit rounded-md bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Selamat datang
              </span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {loading
                  ? 'Memuat data...'
                  : unpaidTagihan.length > 0
                    ? `Anda memiliki ${unpaidTagihan.length} tagihan yang belum dibayar`
                    : 'Semua tagihan sudah lunas'}
              </h2>
              <p className="max-w-2xl text-[13px] leading-relaxed text-white/80">
                {loading
                  ? 'Menyiapkan ringkasan tagihan dan profil Anda.'
                  : unpaidTagihan.length > 0
                    ? `Total tagihan belum dibayar ${fmt(totalUnpaid)}. Pastikan pembayaran sebelum jatuh tempo.`
                    : 'Tidak ada tagihan outstanding. Nikmati layanan air Anda tanpa khawatir.'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/customer/invoices')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-xs transition-all hover:bg-white/90 hover:shadow-sm sm:w-auto"
              >
                Lihat Tagihan
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/customer/payments')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
              >
                Riwayat Pembayaran
              </button>
            </div>
          </div>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-1 divide-y border-t border-surface-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Tagihan lunas</p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {loading ? '—' : `${paidCount} dari ${invoices.length}`}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Total belum dibayar</p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {loading ? '—' : fmt(totalUnpaid)}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Profil</p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {loading ? '—' : (profile?.name ?? user?.name ?? '-')}
            </p>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Tagihan Belum Dibayar"
          value={loading ? '—' : fmt(totalUnpaid)}
          helper={unpaidTagihan.length > 0 ? `${unpaidTagihan.length} tagihan` : undefined}
          subtitle="Jumlah total tagihan yang perlu Anda bayar."
          icon={CurrencyDollarIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Tagihan Terlambat"
          value={loading ? '—' : String(overdueTagihan.length)}
          subtitle={overdueTagihan.length > 0 ? 'Segera bayar untuk menghindari denda.' : 'Tidak ada tagihan terlambat.'}
          icon={ClockIcon}
          tone={overdueTagihan.length > 0 ? 'red' : 'green'}
        />
        <DashboardStatCard
          title="Tagihan Lunas"
          value={loading ? '—' : String(paidCount)}
          subtitle={`Dari ${invoices.length} tagihan secara keseluruhan.`}
          icon={CheckCircleIcon}
          tone="green"
        />
      </div>

      {/* Quick actions */}
      <section className="rounded-xl border border-surface-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-surface-900">Aksi cepat</h2>
          <p className="mt-1 text-[13px] text-surface-400">
            Shortcut ke halaman yang paling sering Anda kunjungi.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            title="Tagihan Saya"
            description="Lihat semua tagihan dan status pembayarannya."
            icon={DocumentTextIcon}
            onClick={() => navigate('/customer/invoices')}
            tone="blue"
          />
          <QuickActionCard
            title="Riwayat Pembayaran"
            description="Lihat catatan pembayaran yang sudah dilakukan."
            icon={CreditCardIcon}
            onClick={() => navigate('/customer/payments')}
            tone="green"
          />
          <QuickActionCard
            title="Pemakaian Air"
            description="Pantau riwayat pemakaian air bulanan Anda."
            icon={ChartBarIcon}
            onClick={() => navigate('/customer/usage')}
            tone="cyan"
          />
          <QuickActionCard
            title="Profil Saya"
            description="Kelola data diri dan informasi akun Anda."
            icon={UserCircleIcon}
            onClick={() => navigate('/customer/profile')}
            tone="purple"
          />
        </div>
      </section>

      {/* Recent unpaid invoices */}
      <section className="rounded-xl border border-surface-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-surface-900">Tagihan Belum Dibayar</h2>
            <p className="mt-1 text-[13px] text-surface-400">
              {unpaidTagihan.length > 0
                ? `Menampilkan ${Math.min(unpaidTagihan.length, 5)} tagihan terbaru.`
                : 'Semua tagihan sudah dibayar.'}
            </p>
          </div>
          {unpaidTagihan.length > 0 && (
            <Link
              to="/customer/invoices"
              className="text-[13px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Lihat semua
            </Link>
          )}
        </div>

        {unpaidTagihan.length === 0 ? (
          <div className="rounded-xl bg-surface-50 p-8 text-center">
            <CheckCircleIcon className="mx-auto h-10 w-10 text-success-400" />
            <p className="mt-3 text-sm font-medium text-surface-600">Tidak ada tagihan outstanding</p>
            <p className="mt-1 text-[13px] text-surface-400">Semua tagihan sudah dibayar atau belum ada tagihan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unpaidTagihan.slice(0, 5).map((invoice) => {
              const isOverdue = invoice.status === 'overdue';
              return (
                <div
                  key={invoice.id}
                  className="group flex flex-col gap-4 rounded-xl border border-surface-100 bg-surface-50/50 p-4 transition-all hover:border-surface-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-medium text-surface-700">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="mt-1 text-[13px] text-surface-500">
                      {invoice.billingPeriod}
                    </p>
                    {invoice.dueDate && (
                      <p className="mt-1 text-[12px] text-surface-400">
                        Jatuh tempo{' '}
                        {new Date(invoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left sm:text-right">
                      <p className={`text-base font-bold ${isOverdue ? 'text-danger-600' : 'text-surface-900'}`}>
                        {fmt(Number(invoice.totalAmount ?? 0))}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          isOverdue
                            ? 'bg-danger-50 text-danger-700 ring-danger-200'
                            : 'bg-warning-50 text-warning-700 ring-warning-200'
                        }`}
                      >
                        {isOverdue ? 'Terlambat' : 'Belum Dibayar'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/customer/pay/${invoice.id}`)}
                      className="btn-primary hidden group-hover:inline-flex !px-3 !py-1.5 text-xs"
                    >
                      Bayar
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerDashboard;
