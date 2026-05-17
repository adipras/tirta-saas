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
  PageHeader,
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
      description: 'Tinjau daftar tenant, approval, dan status organisasi yang terdaftar.',
      icon: BuildingOfficeIcon,
      tone: 'indigo' as const,
      onClick: () => navigate('/admin/platform/tenants'),
    },
    {
      title: 'Verifikasi Pembayaran',
      description: 'Periksa pembayaran langganan tenant yang masih menunggu verifikasi.',
      icon: CurrencyDollarIcon,
      tone: 'green' as const,
      onClick: () => navigate('/admin/platform/subscription-payments'),
    },
    {
      title: 'Kelola Paket',
      description: 'Atur paket subscription yang aktif dan siap ditawarkan ke tenant.',
      icon: ChartBarIcon,
      tone: 'blue' as const,
      onClick: () => navigate('/admin/platform/subscription-plans'),
    },
    {
      title: 'Buka Analitik',
      description: 'Masuk ke analitik platform untuk melihat tren tenant dan kesehatan bisnis.',
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-900 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error || 'Ringkasan platform belum tersedia.'}</span>
          <button
            type="button"
            onClick={() => void fetchDashboardData()}
            className="inline-flex w-full items-center justify-center rounded-xl bg-yellow-600 px-4 py-2.5 font-medium text-white hover:bg-yellow-700 sm:w-auto"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Platform Owner"
        subtitle="Pantau pertumbuhan tenant, revenue, dan approval tenant dari layout yang lebih konsisten di mobile."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Tenant"
          value={overview.total_tenants.toLocaleString('id-ID')}
          helper={`+${overview.new_tenants_this_month} tenant baru`}
          subtitle="Jumlah tenant terdaftar di platform pada periode berjalan."
          icon={BuildingOfficeIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Tenant Aktif"
          value={overview.active_tenants.toLocaleString('id-ID')}
          helper={`${overview.growth_rate_percent.toFixed(1)}% growth`}
          subtitle="Tenant aktif dibanding total tenant yang terdaftar."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Pending Aktivasi"
          value={pendingTenants.length.toLocaleString('id-ID')}
          helper={`${overview.trial_tenants} tenant trial`}
          subtitle="Tenant yang masih menunggu review atau proses aktivasi berikutnya."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Revenue Bulan Ini"
          value={formatCompactCurrency(overview.monthly_revenue)}
          helper={`Total ${formatCompactCurrency(overview.total_revenue)}`}
          subtitle="Ringkasan revenue platform untuk bulan berjalan."
          icon={CurrencyDollarIcon}
          tone="blue"
        />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
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
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Statistik sistem</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-gray-600">Total user</span>
              <span className="font-semibold text-gray-900">{overview.total_users.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-gray-600">Total pelanggan</span>
              <span className="font-semibold text-gray-900">{overview.total_customers.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-gray-600">Storage terpakai</span>
              <span className="font-semibold text-gray-900">{overview.total_storage_used_gb.toFixed(2)} GB</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-gray-600">API call hari ini</span>
              <span className="font-semibold text-gray-900">{overview.total_api_calls_today.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
              <span className="text-red-700">Tenant suspended</span>
              <span className="font-semibold text-red-700">{overview.suspended_tenants.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">Tenant pending</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/platform/tenants')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Lihat Semua
            </button>
          </div>

          {pendingTenants.length > 0 ? (
            <div className="mt-4 space-y-3">
              {pendingTenants.map((tenant) => (
                <div key={tenant.id} className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{tenant.name}</p>
                      <p className="mt-1 text-xs text-gray-500">Kode wilayah: {tenant.village_code}</p>
                      <p className="text-xs text-gray-500">{tenant.email}</p>
                    </div>
                    {tenant.subscription_plan && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium uppercase text-blue-800">
                        {tenant.subscription_plan}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">{formatDate(tenant.registered_at)}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/platform/tenants')}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Tidak ada tenant pending saat ini.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Distribusi tenant per plan</h2>
        {planCards.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {planCards.map((item) => (
              <div key={item.plan} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold uppercase text-gray-700 ring-1 ring-gray-200">
                    {item.plan}
                  </span>
                  <span className="text-2xl font-semibold text-gray-900">{item.count}</span>
                </div>
                <p className="mt-3 text-sm text-gray-500">{item.percentage}% dari total tenant</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            Belum ada data distribusi tenant per plan.
          </div>
        )}
      </section>
    </div>
  );
}
