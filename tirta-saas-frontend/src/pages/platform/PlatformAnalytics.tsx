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
        render: (value) => <span className="font-medium text-success-600">+{formatNumber(Number(value))}</span>,
      },
      {
        key: 'churned_tenants',
        label: 'Tenant Berhenti',
        render: (value) => <span className="font-medium text-danger-600">-{formatNumber(Number(value))}</span>,
      },
      {
        key: 'total_tenants',
        label: 'Total',
        render: (value) => formatNumber(Number(value)),
      },
      {
        key: 'growth_rate_percent',
        label: 'Pertumbuhan',
        render: (value) => {
          const growth = Number(value);
          return (
            <span className={`font-medium ${growth >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
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
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-700">
        {error}
      </div>
    );
  }

  if (!overview || !tenantGrowth) {
    return (
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-[13px] text-warning-700">
        Data analitik platform belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Analitik Platform</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Ringkasan tenant, pertumbuhan, dan kesehatan platform.
          </p>
        </div>
        <div className="self-start">
          <label className="block text-[12px] font-semibold uppercase tracking-wide text-surface-400 mb-1">
            Periode analitik
          </label>
          <select
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value)}
            className="input-base"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
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
          helper="Pendapatan berulang bulan ini"
          subtitle={`Total akumulasi ${formatCurrency(overview.total_revenue)}`}
          icon={CurrencyDollarIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Pertumbuhan Tenant"
          value={formatPercentage(overview.growth_rate_percent)}
          helper={`+${formatNumber(overview.new_tenants_this_month)} baru`}
          subtitle={`-${formatNumber(overview.churned_tenants_this_month)} tenant berhenti`}
          icon={overview.growth_rate_percent >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          tone={overview.growth_rate_percent >= 0 ? 'green' : 'yellow'}
        />
        <DashboardStatCard
          title="Uptime Sistem"
          value={formatPercentage(overview.uptime_percent)}
          helper={`Galat ${formatPercentage(overview.error_rate_percent)}`}
          subtitle={`Tertunggak ${formatCurrency(overview.outstanding_revenue)}`}
          icon={ServerIcon}
          tone="purple"
        />
      </div>

      {/* Platform Utilization */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Utilisasi platform</h2>
        <p className="mt-0.5 text-[13px] text-surface-400">
          Ringkasan sumber daya dan beban operasional lintas tenant.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total pengguna', value: formatNumber(overview.total_users) },
            { label: 'Total pelanggan', value: formatNumber(overview.total_customers) },
            { label: 'Penyimpanan terpakai', value: `${overview.total_storage_used_gb.toFixed(2)} GB` },
            { label: 'Panggilan API hari ini', value: formatNumber(overview.total_api_calls_today) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
              <p className="text-[13px] text-surface-400">{item.label}</p>
              <p className="mt-2 text-[20px] font-semibold text-surface-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant Growth */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Pertumbuhan tenant</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">
            Ringkasan momentum tenant sebelum masuk rincian bulanan.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
              <p className="text-[13px] text-surface-400">Tingkat pertumbuhan</p>
              <p className="mt-2 text-[28px] font-semibold text-surface-800">
                {formatPercentage(tenantGrowth.growth_rate_percent)}
              </p>
              <p className="mt-1 text-[12px] text-surface-400">
                {formatNumber(tenantGrowth.new_tenants)} tenant baru dalam periode ini.
              </p>
            </div>
            <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
              <p className="text-[13px] text-surface-400">Tingkat tenant berhenti</p>
              <p className="mt-2 text-[28px] font-semibold text-surface-800">
                {formatPercentage(tenantGrowth.churn_rate_percent)}
              </p>
              <p className="mt-1 text-[12px] text-surface-400">
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
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Distribusi paket tenant</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">
            Paket mana yang paling banyak dipakai tenant.
          </p>
          <div className="mt-4 space-y-2">
            {planDistribution.length === 0 ? (
              <p className="rounded-xl border border-dashed border-surface-200 px-4 py-5 text-center text-[13px] text-surface-400">
                Belum ada data distribusi paket.
              </p>
            ) : (
              planDistribution.map(([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3"
                >
                  <span className="text-[13px] font-medium capitalize text-surface-600">{plan}</span>
                  <span className="text-[13px] font-semibold text-surface-800">
                    {formatNumber(count)} tenant
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Distribusi status tenant</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">
            Sebaran tenant berdasarkan status operasional.
          </p>
          <div className="mt-4 space-y-2">
            {statusDistribution.length === 0 ? (
              <p className="rounded-xl border border-dashed border-surface-200 px-4 py-5 text-center text-[13px] text-surface-400">
                Belum ada data distribusi status.
              </p>
            ) : (
              statusDistribution.map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3"
                >
                  <span className="text-[13px] font-medium capitalize text-surface-600">
                    {status.toLowerCase()}
                  </span>
                  <span className="text-[13px] font-semibold text-surface-800">
                    {formatNumber(count)} tenant
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Performance Health */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Kesehatan performa</h2>
        <p className="mt-0.5 text-[13px] text-surface-400">
          Metrik teknis inti untuk pantau kualitas layanan.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Respons rata-rata', value: `${overview.avg_response_time_ms.toFixed(2)} ms` },
            { label: 'Error rate', value: formatPercentage(overview.error_rate_percent) },
            { label: 'Uptime', value: formatPercentage(overview.uptime_percent) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
              <p className="text-[13px] text-surface-400">{item.label}</p>
              <p className="mt-2 text-[20px] font-semibold text-surface-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-right text-[12px] text-surface-400">
        Terakhir diperbarui: {new Date(overview.last_updated).toLocaleString('id-ID')}
      </p>
    </div>
  );
}
