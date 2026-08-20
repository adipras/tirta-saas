import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';
import {
  DashboardStatCard,
  QuickActionCard,
} from '../../components';

interface PlatformAnalyticsOverview {
  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  trial_tenants: number;
  total_revenue: number;
  monthly_revenue: number;
  outstanding_revenue: number;
  new_tenants_this_month: number;
  churned_tenants_this_month: number;
  growth_rate_percent: number;
  total_users: number;
  total_customers: number;
  total_storage_used_gb: number;
  total_api_calls_today: number;
}

interface PendingTenant {
  id: string;
  name: string;
  village_code: string;
  email: string;
  registered_at: string;
  subscription_plan?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatCompactCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)} Jt`;
  }

  return formatCurrency(amount);
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function PlatformOwnerDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<PlatformAnalyticsOverview | null>(null);
  const [pendingTenants, setPendingTenants] = useState<PendingTenant[]>([]);
  const [tenantsByPlan, setTenantsByPlan] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [overviewRes, pendingRes, growthRes] = await Promise.all([
        apiClient.get('/platform/analytics/overview'),
        apiClient.get('/platform/tenants/pending'),
        apiClient.get('/platform/analytics/tenants?period=6months'),
      ]);

      const overviewData = overviewRes.data || overviewRes;
      const pendingData = pendingRes.data || pendingRes;
      const growthData = growthRes.data || growthRes;

      setOverview(overviewData);
      setPendingTenants((pendingData || []).slice(0, 3));
      setTenantsByPlan(growthData?.tenants_by_plan || {});
    } catch {
      setError('Dashboard platform owner belum bisa dimuat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const quickActions = [
    {
      title: 'Kelola Tenant',
      description: 'Tinjau daftar tenant, approval, dan status organisasi.',
      icon: BuildingOfficeIcon,
      tone: 'indigo' as const,
      onClick: () => navigate('/admin/platform/tenants'),
    },
    {
      title: 'Verifikasi Pembayaran',
      description: 'Periksa pembayaran langganan tenant yang menunggu verifikasi.',
      icon: CurrencyDollarIcon,
      tone: 'green' as const,
      onClick: () => navigate('/admin/platform/subscription-payments'),
    },
    {
      title: 'Kelola Paket',
      description: 'Atur paket subscription yang aktif dan siap ditawarkan.',
      icon: ChartBarIcon,
      tone: 'blue' as const,
      onClick: () => navigate('/admin/platform/subscription-plans'),
    },
    {
      title: 'Buka Analitik',
      description: 'Melihat tren tenant dan kesehatan bisnis platform.',
      icon: UserGroupIcon,
      tone: 'yellow' as const,
      onClick: () => navigate('/admin/platform/analytics'),
    },
  ];

  const planCards = useMemo(
    () =>
      Object.entries(tenantsByPlan).map(([plan, count]) => ({
        plan,
        count,
        percentage: overview?.total_tenants ? ((count / overview.total_tenants) * 100).toFixed(1) : '0.0',
      })),
    [overview?.total_tenants, tenantsByPlan]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-64 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="card h-64 animate-pulse" />
          <div className="card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-5 text-[13px] text-warning-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error || 'Ringkasan platform belum tersedia.'}</span>
          <button
            type="button"
            onClick={() => void fetchDashboardData()}
            className="btn-primary self-start"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Dashboard Platform Owner</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Pantau pertumbuhan tenant, revenue, dan approval tenant.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Tenant"
          value={overview.total_tenants.toLocaleString('id-ID')}
          helper={`+${overview.new_tenants_this_month} tenant baru`}
          subtitle="Tenant terdaftar di platform."
          icon={BuildingOfficeIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Tenant Aktif"
          value={overview.active_tenants.toLocaleString('id-ID')}
          helper={`${overview.growth_rate_percent.toFixed(1)}% pertumbuhan`}
          subtitle="Tenant aktif dari total terdaftar."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Menunggu Aktivasi"
          value={pendingTenants.length.toLocaleString('id-ID')}
          helper={`${overview.trial_tenants} tenant trial`}
          subtitle="Tenant menunggu review atau aktivasi."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Pendapatan Bulan Ini"
          value={formatCompactCurrency(overview.monthly_revenue)}
          helper={`Total ${formatCompactCurrency(overview.total_revenue)}`}
          subtitle="Ringkasan pendapatan platform."
          icon={CurrencyDollarIcon}
          tone="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {quickActions.map((action) => (
          <QuickActionCard
            key={action.title}
            title={action.title}
            description={action.description}
            icon={action.icon}
            tone={action.tone}
            onClick={action.onClick}
          />
        ))}
      </div>

      {/* Stats + Pending */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Statistik sistem</h2>
          <div className="mt-4 space-y-2 text-[13px]">
            {[
              { label: 'Total pengguna', value: overview.total_users.toLocaleString('id-ID') },
              { label: 'Total pelanggan', value: overview.total_customers.toLocaleString('id-ID') },
              { label: 'Penyimpanan terpakai', value: `${overview.total_storage_used_gb.toFixed(2)} GB` },
              { label: 'Panggilan API hari ini', value: overview.total_api_calls_today.toLocaleString('id-ID') },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3">
                <span className="text-surface-500">{item.label}</span>
                <span className="font-semibold text-surface-800">{item.value}</span>
              </div>
            ))}
            {overview.suspended_tenants > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-danger-200 bg-danger-50 px-4 py-3">
                <span className="text-danger-600">Tenant ditangguhkan</span>
                <span className="font-semibold text-danger-700">{overview.suspended_tenants.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-surface-800">Tenant pending</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/platform/tenants')}
              className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
            >
              Lihat Semua
            </button>
          </div>

          {pendingTenants.length > 0 ? (
            <div className="mt-4 space-y-2">
              {pendingTenants.map((tenant) => (
                <div key={tenant.id} className="rounded-xl border border-warning-200 bg-warning-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-surface-800">{tenant.name}</p>
                      <p className="mt-0.5 text-[12px] text-surface-400">Kode wilayah: {tenant.village_code}</p>
                      <p className="text-[12px] text-surface-400">{tenant.email}</p>
                    </div>
                    {tenant.subscription_plan && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium uppercase text-brand-700 ring-1 ring-inset ring-brand-200/60">
                        {tenant.subscription_plan}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-[12px] text-surface-400">{formatDate(tenant.registered_at)}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/platform/tenants')}
                      className="text-[12px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-surface-200 p-6 text-center text-[13px] text-surface-400">
              Tidak ada tenant pending saat ini.
            </div>
          )}
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Distribusi tenant per plan</h2>
        {planCards.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {planCards.map((item) => (
              <div key={item.plan} className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3">
                <div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-semibold uppercase text-brand-700 ring-1 ring-inset ring-brand-200/60">
                    {item.plan}
                  </span>
                  <p className="mt-2 text-[12px] text-surface-400">{item.percentage}% dari total tenant</p>
                </div>
                <span className="text-2xl font-semibold text-surface-800">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-surface-200 p-6 text-center text-[13px] text-surface-400">
            Belum ada data distribusi tenant per plan.
          </div>
        )}
      </div>
    </div>
  );
}
