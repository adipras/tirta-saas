import { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

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

interface TenantGrowthAnalytics {
  tenants_by_plan: Record<string, number>;
}

export default function PlatformOwnerDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<PlatformAnalyticsOverview | null>(null);
  const [pendingTenants, setPendingTenants] = useState<PendingTenant[]>([]);
  const [tenantsByPlan, setTenantsByPlan] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, pendingRes, growthRes] = await Promise.all([
        apiClient.get('/platform/analytics/overview'),
        apiClient.get('/platform/tenants/pending'),
        apiClient.get('/platform/analytics/tenants?period=6months'),
      ]);

      setOverview(overviewRes.data);
      setPendingTenants(pendingRes.data?.slice(0, 3) || []);
      setTenantsByPlan(growthRes.data?.tenants_by_plan || {});
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)} Jt`;
    }
    return formatCurrency(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPendingCount = () => {
    if (!overview) return 0;
    return overview.total_tenants - overview.active_tenants - overview.suspended_tenants - overview.trial_tenants;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Tenant',
      value: overview.total_tenants.toString(),
      change: `+${overview.new_tenants_this_month}`,
      changeType: 'increase',
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Tenant Aktif',
      value: overview.active_tenants.toString(),
      change: `${overview.growth_rate_percent.toFixed(1)}%`,
      changeType: overview.growth_rate_percent >= 0 ? 'increase' : 'decrease',
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Pending Approval',
      value: getPendingCount().toString(),
      change: `${overview.trial_tenants} trial`,
      changeType: 'increase',
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Revenue Bulan Ini',
      value: formatCompactCurrency(overview.monthly_revenue),
      change: `Total: ${formatCompactCurrency(overview.total_revenue)}`,
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Owner Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview pengelolaan tenant dan subscription platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className={`text-sm mt-2 ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? '↑' : '↓'} {stat.change}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/platform/tenants')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Kelola Tenant</span>
          </button>
          <button
            onClick={() => navigate('/admin/platform/subscription-payments')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Verifikasi Pembayaran</span>
          </button>
          <button
            onClick={() => navigate('/admin/platform/subscription-plans')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Paket Subscription</span>
          </button>
          <button
            onClick={() => navigate('/admin/platform/analytics')}
            className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Analytics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistik Sistem</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="text-lg font-semibold text-gray-900">{overview.total_users}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-gray-600">Total Customers</span>
              <span className="text-lg font-semibold text-gray-900">{overview.total_customers}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-gray-600">Storage Used</span>
              <span className="text-lg font-semibold text-gray-900">
                {overview.total_storage_used_gb.toFixed(2)} GB
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-gray-600">API Calls Today</span>
              <span className="text-lg font-semibold text-gray-900">
                {overview.total_api_calls_today.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Suspended Tenants</span>
              <span className="text-lg font-semibold text-red-600">{overview.suspended_tenants}</span>
            </div>
          </div>
        </div>

        {/* Pending Tenants */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tenant Pending Approval</h2>
            <button
              onClick={() => navigate('/admin/platform/tenants')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Semua →
            </button>
          </div>
          {pendingTenants.length > 0 ? (
            <div className="space-y-3">
              {pendingTenants.map((tenant) => (
                <div key={tenant.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Village: {tenant.village_code}</p>
                      <p className="text-xs text-gray-500">Email: {tenant.email}</p>
                    </div>
                    {tenant.subscription_plan && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium uppercase">
                        {tenant.subscription_plan}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formatDate(tenant.registered_at)}</p>
                    <button
                      onClick={() => navigate('/admin/platform/tenants')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Tidak ada tenant pending approval</p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Tenant per Plan</h2>
        {Object.keys(tenantsByPlan).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(tenantsByPlan).map(([plan, count]) => {
              const colors: Record<string, string> = {
                basic: 'bg-blue-100 text-blue-800',
                pro: 'bg-purple-100 text-purple-800',
                premium: 'bg-purple-100 text-purple-800',
                enterprise: 'bg-orange-100 text-orange-800',
              };
              const color = colors[plan.toLowerCase()] || 'bg-gray-100 text-gray-800';
              
              return (
                <div key={plan} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${color}`}>
                      {plan}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {((count / overview.total_tenants) * 100).toFixed(1)}%
                    </span> dari total tenant
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Belum ada data distribusi tenant</p>
          </div>
        )}
      </div>
    </div>
  );
}
