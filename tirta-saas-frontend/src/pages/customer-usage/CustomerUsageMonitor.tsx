import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalculatorIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader, Skeleton, TableSkeleton, useToast } from '../../components';
import { usageService } from '../../services/usageService';
import type { WaterPemakaian } from '../../types/usage';
import { extractApiErrorMessage } from '../../utils/apiError';

interface CustomerPemakaianData {
  id: string;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  usage: number;
}

interface PemakaianStats {
  currentMonth: number;
  lastMonth: number;
  average: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

type UsagePeriod = '6months' | '12months' | 'all';

const PERIOD_OPTIONS: Array<{ value: UsagePeriod; label: string }> = [
  { value: '6months', label: '6 Bulan Terakhir' },
  { value: '12months', label: '12 Bulan Terakhir' },
  { value: 'all', label: 'Semua Waktu' },
];

export default function CustomerPemakaianMonitor() {
  const { error: showErrorToast } = useToast();
  const [usageHistory, setPemakaianHistory] = useState<CustomerPemakaianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PemakaianStats | null>(null);
  const [period, setPeriod] = useState<UsagePeriod>('6months');
  const periodSelectId = useId();
  const periodSelectHelpId = `${periodSelectId}-help`;

  const calculateStats = useCallback((data: CustomerPemakaianData[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const sortedData = [...data].sort(
      (a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
    );

    const currentMonth = sortedData[0]?.usage || 0;
    const lastMonth = sortedData[1]?.usage || 0;
    const total = data.reduce((sum, item) => sum + item.usage, 0);
    const average = total / data.length;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percentageChange = 0;

    if (lastMonth > 0) {
      percentageChange = ((currentMonth - lastMonth) / lastMonth) * 100;

      if (percentageChange > 5) {
        trend = 'up';
      } else if (percentageChange < -5) {
        trend = 'down';
      }
    }

    setStats({
      currentMonth,
      lastMonth,
      average,
      total,
      trend,
      percentageChange,
    });
  }, []);

  const loadPemakaianData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await usageService.getCustomerPemakaianHistory(period);
      const transformed: CustomerPemakaianData[] = data.map((item: WaterPemakaian) => ({
        id: item.id,
        readingDate: item.usageMonth || item.createdAt,
        previousReading: item.meterStart,
        currentReading: item.meterEnd,
        usage: item.usageM3,
      }));

      setPemakaianHistory(transformed);
      calculateStats(transformed);
    } catch (err: unknown) {
      const errorMessage = extractApiErrorMessage(
        err,
        'Gagal memuat data pemakaian. Silakan coba lagi.'
      );
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [calculateStats, period, showErrorToast]);

  useEffect(() => {
    void loadPemakaianData();
  }, [loadPemakaianData]);

  const formatMonth = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
    });

  const formatFullDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const chartData = useMemo(
    () =>
      [...usageHistory]
        .sort((a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime())
        .map((item) => ({
          month: formatMonth(item.readingDate),
          usage: item.usage,
          previousReading: item.previousReading,
          currentReading: item.currentReading,
        })),
    [usageHistory]
  );

  const comparisonData = useMemo(() => {
    if (chartData.length < 2) return [];

    return chartData.slice(-6).map((item) => ({
      month: item.month,
      'Pemakaian Bulan Ini': item.usage,
      'Rata-Rata': stats?.average || 0,
    }));
  }, [chartData, stats?.average]);

  const usageHistoryRows = useMemo(
    () =>
      [...usageHistory].sort(
        (a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
      ),
    [usageHistory]
  );

  const getTrendIcon = () => {
    if (!stats) return null;

    if (stats.trend === 'up') {
      return <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" aria-hidden="true" />;
    }

    if (stats.trend === 'down') {
      return <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" aria-hidden="true" />;
    }

    return (
      <div className="flex h-6 w-6 items-center justify-center text-gray-400" aria-hidden="true">
        ━
      </div>
    );
  };

  const getTrendColor = () => {
    if (!stats) return 'text-gray-600';
    if (stats.trend === 'up') return 'text-red-600';
    if (stats.trend === 'down') return 'text-green-600';
    return 'text-gray-600';
  };

  const getChangeText = (change: number) => {
    if (change > 0) return `Naik ${change.toFixed(1)}%`;
    if (change < 0) return `Turun ${Math.abs(change).toFixed(1)}%`;
    return 'Tetap 0,0%';
  };

  const hasUsageHistory = usageHistory.length > 0;
  const pageTitle = 'Pemakaian Air';
  const pageSubtitle =
    'Pantau konsumsi air, bandingkan tren pemakaian, dan cek riwayat pembacaan meter Anda.';

  const periodSelect = (
    <div className="space-y-1">
      <label htmlFor={periodSelectId} className="sr-only">
        Pilih periode riwayat pemakaian
      </label>
      <select
        id={periodSelectId}
        value={period}
        onChange={(event) => setPeriod(event.target.value as UsagePeriod)}
        aria-describedby={periodSelectHelpId}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto"
      >
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p id={periodSelectHelpId} className="sr-only">
        Pilih rentang waktu untuk menampilkan grafik dan tabel pemakaian air Anda.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={<Skeleton height={40} width={220} className="rounded-lg" />}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow">
              <Skeleton height={16} width="45%" />
              <Skeleton height={32} width="55%" className="mt-3" />
              <Skeleton height={14} width="35%" className="mt-3" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-hidden="true">
          <div className="rounded-lg bg-white p-6 shadow">
            <Skeleton height={24} width="45%" />
            <Skeleton height={280} className="mt-4" />
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <Skeleton height={24} width="55%" />
            <Skeleton height={280} className="mt-4" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow" aria-hidden="true">
          <Skeleton height={24} width="30%" />
          <div className="mt-4">
            <TableSkeleton rows={5} cols={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} actions={periodSelect} />

        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center" role="alert">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadPemakaianData()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} actions={periodSelect} />

      {!hasUsageHistory && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Belum ada data pemakaian</h2>
          <p className="mt-2 text-sm text-gray-500">
            Riwayat pemakaian air akan tampil di sini setelah pembacaan meter pertama tersedia.
          </p>
          <button
            type="button"
            onClick={() => void loadPemakaianData()}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Muat Ulang Data
          </button>
        </div>
      )}

      {stats && hasUsageHistory && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bulan Ini</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.currentMonth} m³</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-indigo-600" aria-hidden="true" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bulan Lalu</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.lastMonth} m³</p>
              </div>
              <CalculatorIcon className="h-10 w-10 text-gray-600" aria-hidden="true" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rata-Rata Pemakaian</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats.average.toFixed(1)} m³</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center text-gray-400" aria-hidden="true">
                ≈
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tren</p>
                <p className={`mt-2 text-2xl font-bold ${getTrendColor()}`}>
                  {stats.percentageChange > 0 ? '+' : ''}
                  {stats.percentageChange.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-gray-500">{getChangeText(stats.percentageChange)}</p>
              </div>
              {getTrendIcon()}
            </div>
          </div>
        </div>
      )}

      {stats && hasUsageHistory && stats.trend === 'up' && stats.percentageChange > 20 && (
        <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4" role="status">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Peringatan Pemakaian Tinggi!</strong> Konsumsi air Anda meningkat sebesar{' '}
                <strong>{stats.percentageChange.toFixed(1)}%</strong> dibandingkan bulan lalu.
                Periksa kemungkinan kebocoran atau kurangi pemakaian.
              </p>
            </div>
          </div>
        </div>
      )}

      {stats && hasUsageHistory && stats.trend === 'down' && stats.percentageChange < -20 && (
        <div className="border-l-4 border-green-400 bg-green-50 p-4" role="status">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>Bagus sekali!</strong> Konsumsi air Anda berkurang sebesar{' '}
                <strong>{Math.abs(stats.percentageChange).toFixed(1)}%</strong> dibandingkan bulan
                lalu. Pertahankan terus!
              </p>
            </div>
          </div>
        </div>
      )}

      {hasUsageHistory && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow" aria-labelledby="customer-usage-trend-chart">
            <h2 id="customer-usage-trend-chart" className="mb-2 text-lg font-semibold text-gray-900">
              Tren Pemakaian
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Grafik ini menampilkan total pemakaian air per bulan untuk periode yang dipilih.
            </p>
            <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPemakaian" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="usage"
                    stroke="#6366F1"
                    fillOpacity={1}
                    fill="url(#colorPemakaian)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section
            className="rounded-lg bg-white p-6 shadow"
            aria-labelledby="customer-usage-comparison-chart"
          >
            <h2
              id="customer-usage-comparison-chart"
              className="mb-2 text-lg font-semibold text-gray-900"
            >
              Perbandingan dengan Rata-Rata
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Bandingkan pemakaian enam bulan terakhir dengan rata-rata pemakaian Anda.
            </p>
            <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Pemakaian Bulan Ini" fill="#6366F1" />
                  <Bar dataKey="Rata-Rata" fill="#94A3B8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {hasUsageHistory && (
        <section className="rounded-lg bg-white p-6 shadow" aria-labelledby="customer-meter-reading-chart">
          <h2 id="customer-meter-reading-chart" className="mb-2 text-lg font-semibold text-gray-900">
            Riwayat Pembacaan Meter
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Grafik ini memperlihatkan perkembangan pembacaan meter awal dan akhir pada tiap periode.
          </p>
          <div aria-hidden="true">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Meter', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="previousReading"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  name="Pembacaan Awal"
                />
                <Line
                  type="monotone"
                  dataKey="currentReading"
                  stroke="#6366F1"
                  strokeWidth={2}
                  name="Pembacaan Akhir"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Pemakaian</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">
              Tabel riwayat pemakaian air yang menampilkan tanggal baca, meter awal, meter akhir,
              total pemakaian, dan perubahan dibanding periode sebelumnya.
            </caption>
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Tanggal Baca
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Meter Awal
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Meter Akhir
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Pemakaian (m³)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Perubahan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {usageHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data pemakaian
                  </td>
                </tr>
              ) : (
                usageHistoryRows.map((usage, index, array) => {
                  const previousPemakaian = array[index + 1]?.usage;
                  const change = previousPemakaian
                    ? ((usage.usage - previousPemakaian) / previousPemakaian) * 100
                    : 0;

                  return (
                    <tr key={usage.id} className="hover:bg-gray-50">
                      <th
                        scope="row"
                        className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium text-gray-900"
                      >
                        {formatFullDate(usage.readingDate)}
                      </th>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {usage.previousReading}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {usage.currentReading}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {usage.usage} m³
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {index < array.length - 1 ? (
                          <span
                            className={
                              change > 0
                                ? 'text-red-600'
                                : change < 0
                                  ? 'text-green-600'
                                  : 'text-gray-600'
                            }
                            aria-label={getChangeText(change)}
                          >
                            {change > 0 ? '+' : ''}
                            {change.toFixed(1)}%
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

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-indigo-900">Tips Hemat Air</h3>
        <ul className="space-y-2 text-sm text-indigo-800">
          <li>• Perbaiki keran yang bocor. Satu tetesan dapat membuang hingga 80 liter per hari.</li>
          <li>• Mandi lebih singkat. Mengurangi 2 menit saja dapat menghemat hingga 40 liter.</li>
          <li>• Jalankan mesin cuci dan pencuci piring hanya saat penuh.</li>
          <li>• Gunakan perlengkapan dan peralatan hemat air.</li>
          <li>• Periksa meter secara rutin untuk mendeteksi kenaikan tidak wajar akibat kebocoran.</li>
        </ul>
      </div>
    </div>
  );
}
