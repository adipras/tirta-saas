import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ServerIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/apiClient';
import { PageHeader } from '../../components';

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

export default function PlatformAnalytics() {
  const [overview, setOverview] = useState<PlatformAnalyticsOverview | null>(null);
  const [tenantGrowth, setTenantGrowth] = useState<TenantGrowthAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, growthRes] = await Promise.all([
        apiClient.get('/platform/analytics/overview'),
        apiClient.get(`/platform/analytics/tenants?period=${selectedPeriod}`),
      ]);

      setOverview(overviewRes.data);
      setTenantGrowth(growthRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!overview || !tenantGrowth) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Analitik Platform" subtitle="Overview of platform performance and tenant statistics" />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatNumber(overview.total_tenants)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {formatNumber(overview.active_tenants)} Active
            </span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-yellow-600">
              {formatNumber(overview.trial_tenants)} Trial
            </span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(overview.monthly_revenue)}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-gray-600">Total: </span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(overview.total_revenue)}
            </span>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPercentage(overview.growth_rate_percent)}
              </p>
            </div>
            <div className={`rounded-full p-3 ${
              overview.growth_rate_percent >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {overview.growth_rate_percent >= 0 ? (
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-green-600">
              +{formatNumber(overview.new_tenants_this_month)} new
            </span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-red-600">
              -{formatNumber(overview.churned_tenants_this_month)} churned
            </span>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPercentage(overview.uptime_percent)}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <ServerIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-gray-600">Error Rate: </span>
            <span className="text-gray-900 font-medium">
              {formatPercentage(overview.error_rate_percent)}
            </span>
          </div>
        </div>
      </div>

      {/* Pemakaian Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Pemakaian</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatNumber(overview.total_users)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Pelanggan</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatNumber(overview.total_customers)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Storage Used</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {overview.total_storage_used_gb.toFixed(2)} GB
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">API Calls Today</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatNumber(overview.total_api_calls_today)}
            </p>
          </div>
        </div>
      </div>

      {/* Tenant Growth */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tenant Growth</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600">Growth Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatPercentage(tenantGrowth.growth_rate_percent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Churn Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatPercentage(tenantGrowth.churn_rate_percent)}
            </p>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Tenants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Churned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenantGrowth.monthly_breakdown.map((stat, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stat.month} {stat.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +{formatNumber(stat.new_tenants)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    -{formatNumber(stat.churned_tenants)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatNumber(stat.total_tenants)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    stat.growth_rate_percent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(stat.growth_rate_percent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenants by Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenants by Plan</h2>
          <div className="space-y-3">
            {Object.entries(tenantGrowth.tenants_by_plan).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{plan}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatNumber(count)} tenants
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tenants by Status</h2>
          <div className="space-y-3">
            {Object.entries(tenantGrowth.tenants_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{status.toLowerCase()}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatNumber(count)} tenants
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-600">Avg Response Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {overview.avg_response_time_ms.toFixed(2)} ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Error Rate</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatPercentage(overview.error_rate_percent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">System Uptime</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatPercentage(overview.uptime_percent)}
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-right text-sm text-gray-500">
        Last updated: {new Date(overview.last_updated).toLocaleString('id-ID')}
      </div>
    </div>
  );
}
