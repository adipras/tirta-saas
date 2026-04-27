import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ServerIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';
import {
  DashboardStatCard,
  DataTable,
  PageHeader,
  type Column,
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
  avg_response_time_ms: number;
  error_rate_percent: number;
  uptime_percent: number;
  last_updated: string;
}

interface MonthlyTenantStats {
  month: string;
  year: number;
  new_tenants: number;
  churned_tenants: number;
  total_tenants: number;
  growth_rate_percent: number;
}

interface TenantGrowthAnalytics {
  period: string;
  total_tenants: number;
  active_tenants: number;
  new_tenants: number;
  churned_tenants: number;
  growth_rate_percent: number;
  churn_rate_percent: number;
  monthly_breakdown: MonthlyTenantStats[];
  tenants_by_plan: Record<string, number>;
  tenants_by_status: Record<string, number>;
}

const periodOptions = [
  { value: '3months', label: '3 bulan terakhir' },
  { value: '6months', label: '6 bulan terakhir' },
  { value: '12months', label: '12 bulan terakhir' },
];

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export default function PlatformAnalytics() {
  const [overview, setOverview] = useState<PlatformAnalyticsOverview | null>(null);
  const [tenantGrowth, setTenantGrowth] = useState<TenantGrowthAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, growthRes] = await Promise.all([
        apiClient.get('/platform/analytics/overview'),
        apiClient.get(`/platform/analytics/tenants?period=${selectedPeriod}`),
      ]);

      setOverview(overviewRes.data);
      setTenantGrowth(growthRes.data);
    } catch (err: unknown) {
      console.error('Error fetching analytics:', err);
      setError(getErrorMessage(err, 'Gagal memuat analitik platform.'));
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const formatPercentage = (num: number) => `${num.toFixed(2)}%`;

  const monthlyBreakdownColumns: Column<MonthlyTenantStats>[] = useMemo(
    () => [
      {
        key: 'period',
        label: 'Periode',
        render: (_, stat) => `${stat.month} ${stat.year}`,
      },
      {
        key: 'new_tenants',
        label: 'Tenant Baru',
        render: (value) => <span className="font-medium text-green-600">+{formatNumber(Number(value))}</span>,
      },
      {
        key: 'churned_tenants',
        label: 'Churn',
        render: (value) => <span className="font-medium text-red-600">-{formatNumber(Number(value))}</span>,
      },
      {
        key: 'total_tenants',
        label: 'Total',
        render: (value) => formatNumber(Number(value)),
      },
      {
        key: 'growth_rate_percent',
        label: 'Growth',
        render: (value) => {
          const growth = Number(value);
          return (
            <span className={`font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(growth)}
            </span>
          );
        },
      },
    ],
    []
  );

  const planDistribution = useMemo(
    () => (tenantGrowth ? Object.entries(tenantGrowth.tenants_by_plan) : []),
    [tenantGrowth]
  );

  const statusDistribution = useMemo(
    () => (tenantGrowth ? Object.entries(tenantGrowth.tenants_by_status) : []),
    [tenantGrowth]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
        {error}
      </div>
    );
  }

  if (!overview || !tenantGrowth) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm">
        Data analitik platform belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik Platform"
        subtitle="Ringkasan tenant, pertumbuhan, dan kesehatan platform dengan tampilan yang lebih nyaman di mobile."
        actions={
          <div className="flex flex-col gap-2 sm:min-w-[220px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Periode analitik
            </label>
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Tenant"
          value={formatNumber(overview.total_tenants)}
          helper={`${formatNumber(overview.active_tenants)} aktif`}
          subtitle={`${formatNumber(overview.trial_tenants)} trial • ${formatNumber(overview.suspended_tenants)} nonaktif`}
          icon={UserGroupIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pendapatan Bulanan"
          value={formatCurrency(overview.monthly_revenue)}
          helper="Recurring bulan ini"
          subtitle={`Total akumulasi ${formatCurrency(overview.total_revenue)}`}
          icon={CurrencyDollarIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Growth Tenant"
          value={formatPercentage(overview.growth_rate_percent)}
          helper={`+${formatNumber(overview.new_tenants_this_month)} baru`}
          subtitle={`-${formatNumber(overview.churned_tenants_this_month)} churn pada bulan berjalan`}
          icon={overview.growth_rate_percent >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          tone={overview.growth_rate_percent >= 0 ? 'green' : 'yellow'}
        />
        <DashboardStatCard
          title="Uptime Sistem"
          value={formatPercentage(overview.uptime_percent)}
          helper={`Error ${formatPercentage(overview.error_rate_percent)}`}
          subtitle={`Outstanding revenue ${formatCurrency(overview.outstanding_revenue)}`}
          icon={ServerIcon}
          tone="purple"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Utilisasi platform</h2>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan resource dan beban operasional lintas tenant.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total pengguna</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatNumber(overview.total_users)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total pelanggan</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatNumber(overview.total_customers)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Storage terpakai</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {overview.total_storage_used_gb.toFixed(2)} GB
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">API call hari ini</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatNumber(overview.total_api_calls_today)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-gray-200 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Pertumbuhan tenant</h2>
            <p className="mt-1 text-sm text-gray-500">
              Summary first untuk lihat momentum tenant sebelum masuk rincian bulanan.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Growth rate</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {formatPercentage(tenantGrowth.growth_rate_percent)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {formatNumber(tenantGrowth.new_tenants)} tenant baru dalam periode ini.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Churn rate</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {formatPercentage(tenantGrowth.churn_rate_percent)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {formatNumber(tenantGrowth.churned_tenants)} tenant berhenti dalam periode ini.
              </p>
            </div>
          </div>
        </div>

        <DataTable
          data={tenantGrowth.monthly_breakdown}
          columns={monthlyBreakdownColumns}
          searchable={false}
          emptyMessage="Belum ada breakdown pertumbuhan tenant."
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Distribusi paket tenant</h2>
          <p className="mt-1 text-sm text-gray-500">
            Paket mana yang paling banyak dipakai tenant saat ini.
          </p>
          <div className="mt-4 space-y-3">
            {planDistribution.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
                Belum ada data distribusi paket.
              </p>
            ) : (
              planDistribution.map(([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize text-gray-700">{plan}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(count)} tenant
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Distribusi status tenant</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sebaran tenant berdasarkan status operasional.
          </p>
          <div className="mt-4 space-y-3">
            {statusDistribution.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
                Belum ada data distribusi status.
              </p>
            ) : (
              statusDistribution.map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize text-gray-700">
                    {status.toLowerCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(count)} tenant
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-gray-900">Kesehatan performa</h2>
        <p className="mt-1 text-sm text-gray-500">
          Metrik teknis inti untuk bantu pantau kualitas layanan.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Respons rata-rata</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {overview.avg_response_time_ms.toFixed(2)} ms
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Error rate</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatPercentage(overview.error_rate_percent)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Uptime</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatPercentage(overview.uptime_percent)}
            </p>
          </div>
        </div>
      </section>

      <p className="text-right text-xs text-gray-500">
        Terakhir diperbarui:{' '}
        {new Date(overview.last_updated).toLocaleString('id-ID')}
      </p>
    </div>
  );
}
