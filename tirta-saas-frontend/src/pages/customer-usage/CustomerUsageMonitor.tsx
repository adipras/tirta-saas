import { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { usageService } from '../../services/usageService';

interface CustomerUsageData {
  id: string;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  usage: number;
  usageM3?: number;
}

interface UsageStats {
  currentMonth: number;
  lastMonth: number;
  average: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export default function CustomerUsageMonitor() {
  const [usageHistory, setUsageHistory] = useState<CustomerUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [period, setPeriod] = useState<'6months' | '12months' | 'all'>('6months');

  useEffect(() => {
    loadUsageData();
  }, [period]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const data = await usageService.getCustomerUsageHistory(period);
      // Transform WaterUsage to CustomerUsageData
      const transformed: CustomerUsageData[] = data.map((item: any) => ({
        id: item.id,
        readingDate: item.usageMonth || item.createdAt,
        previousReading: item.meterStart,
        currentReading: item.meterEnd,
        usage: item.usageM3,
      }));
      setUsageHistory(transformed);
      calculateStats(transformed);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: CustomerUsageData[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const sortedData = [...data].sort((a, b) => 
      new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
    );

    const currentMonth = sortedData[0]?.usage || 0;
    const lastMonth = sortedData[1]?.usage || 0;
    const total = data.reduce((sum, item) => sum + item.usage, 0);
    const average = total / data.length;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percentageChange = 0;

    if (lastMonth > 0) {
      percentageChange = ((currentMonth - lastMonth) / lastMonth) * 100;
      if (percentageChange > 5) trend = 'up';
      else if (percentageChange < -5) trend = 'down';
    }

    setStats({
      currentMonth,
      lastMonth,
      average,
      total,
      trend,
      percentageChange,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
    });
  };

  const getChartData = () => {
    return usageHistory
      .sort((a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime())
      .map(item => ({
        month: formatDate(item.readingDate),
        usage: item.usage,
        previousReading: item.previousReading,
        currentReading: item.currentReading,
      }));
  };

  const getComparisonData = () => {
    if (usageHistory.length < 2) return [];
    
    const sortedData = [...usageHistory]
      .sort((a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime())
      .slice(-6);

    return sortedData.map((item) => ({
      month: formatDate(item.readingDate),
      'Current Year': item.usage,
      'Average': stats?.average || 0,
    }));
  };

  const getTrendIcon = () => {
    if (!stats) return null;
    
    if (stats.trend === 'up') {
      return <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />;
    } else if (stats.trend === 'down') {
      return <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" />;
    }
    return <div className="h-6 w-6 text-gray-400">━</div>;
  };

  const getTrendColor = () => {
    if (!stats) return 'text-gray-600';
    if (stats.trend === 'up') return 'text-red-600';
    if (stats.trend === 'down') return 'text-green-600';
    return 'text-gray-600';
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Water Usage Monitor</h1>
          <p className="text-gray-600">Track your water consumption and trends</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.currentMonth} m³</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lastMonth} m³</p>
              </div>
              <CalculatorIcon className="h-10 w-10 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Usage</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.average.toFixed(1)} m³</p>
              </div>
              <div className="h-10 w-10 flex items-center justify-center text-gray-400">
                ≈
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trend</p>
                <p className={`text-2xl font-bold mt-2 ${getTrendColor()}`}>
                  {stats.percentageChange > 0 ? '+' : ''}{stats.percentageChange.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon()}
            </div>
          </div>
        </div>
      )}

      {/* Trend Alert */}
      {stats && stats.trend === 'up' && stats.percentageChange > 20 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>High Usage Alert!</strong> Your water consumption has increased by{' '}
                <strong>{stats.percentageChange.toFixed(1)}%</strong> compared to last month. 
                Consider checking for leaks or reducing usage.
              </p>
            </div>
          </div>
        </div>
      )}

      {stats && stats.trend === 'down' && stats.percentageChange < -20 && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Great job!</strong> Your water consumption has decreased by{' '}
                <strong>{Math.abs(stats.percentageChange).toFixed(1)}%</strong> compared to last month. 
                Keep up the good work!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trend Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getChartData()}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="usage"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorUsage)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage vs Average</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getComparisonData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Current Year" fill="#3B82F6" />
              <Bar dataKey="Average" fill="#94A3B8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meter Reading Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meter Readings History</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Meter Reading', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="previousReading"
              stroke="#94A3B8"
              strokeWidth={2}
              name="Previous Reading"
            />
            <Line
              type="monotone"
              dataKey="currentReading"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Current Reading"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Usage History Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Usage History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reading Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Reading
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Reading
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage (m³)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usageHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No usage data available
                  </td>
                </tr>
              ) : (
                usageHistory
                  .sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime())
                  .map((usage, index, array) => {
                    const previousUsage = array[index + 1]?.usage;
                    const change = previousUsage ? ((usage.usage - previousUsage) / previousUsage) * 100 : 0;
                    
                    return (
                      <tr key={usage.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(usage.readingDate).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {usage.previousReading}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {usage.currentReading}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {usage.usage} m³
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {index < array.length - 1 ? (
                            <span className={change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-600'}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Water Conservation Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Fix leaky faucets - a single drip can waste 20 gallons per day</li>
          <li>• Take shorter showers - reducing by just 2 minutes can save up to 10 gallons</li>
          <li>• Run dishwashers and washing machines only when full</li>
          <li>• Install water-efficient fixtures and appliances</li>
          <li>• Check your meter regularly for unusual increases that might indicate leaks</li>
        </ul>
      </div>
    </div>
  );
}
