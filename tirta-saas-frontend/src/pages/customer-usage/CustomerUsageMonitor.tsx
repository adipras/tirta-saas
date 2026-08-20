import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  CalculatorIcon,
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
import { PageHeader, DashboardStatCard, useToast } from '../../components';
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

  const getChangeText = (change: number) => {
    if (change > 0) return `Naik ${change.toFixed(1)}%`;
    if (change < 0) return `Turun ${Math.abs(change).toFixed(1)}%`;
    return 'Tetap 0,0%';
  };

  const hasUsageHistory = usageHistory.length > 0;

  const periodSelect = (
    <select
      id={periodSelectId}
      value={period}
      onChange={(event) => setPeriod(event.target.value as UsagePeriod)}
      aria-describedby={periodSelectHelpId}
      className="input-base sm:w-auto"
    >
      {PERIOD_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pemakaian Air" subtitle="Pantau konsumsi air dan tren pemakaian Anda." actions={periodSelect} />
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
          <p className="text-[13px] text-danger-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadPemakaianData()}
            className="mt-4 rounded-lg bg-danger-600 px-4 py-2 text-sm text-white hover:bg-danger-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemakaian Air"
        subtitle="Pantau konsumsi air, bandingkan tren pemakaian, dan cek riwayat pembacaan meter Anda."
        actions={periodSelect}
      />

      {/* Empty State */}
      {!hasUsageHistory && (
        <div className="rounded-xl border border-dashed border-surface-300 bg-white p-8 text-center">
          <ChartBarIcon className="mx-auto h-10 w-10 text-surface-300" />
          <p className="mt-3 text-sm font-medium text-surface-600">Belum ada data pemakaian</p>
          <p className="mt-1 text-[13px] text-surface-400">
            Riwayat pemakaian air akan tampil di sini setelah pembacaan meter pertama tersedia.
          </p>
          <button
            type="button"
            onClick={() => void loadPemakaianData()}
            className="btn-secondary mt-4"
          >
            Muat Ulang Data
          </button>
        </div>
      )}

      {/* Stat Cards */}
      {stats && hasUsageHistory && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Bulan Ini"
            value={`${stats.currentMonth} m³`}
            subtitle="Pemakaian air bulan berjalan."
            icon={ChartBarIcon}
            tone="blue"
          />
          <DashboardStatCard
            title="Bulan Lalu"
            value={`${stats.lastMonth} m³`}
            subtitle="Pemakaian air bulan sebelumnya."
            icon={CalculatorIcon}
            tone="blue"
          />
          <DashboardStatCard
            title="Rata-Rata Pemakaian"
            value={`${stats.average.toFixed(1)} m³`}
            subtitle="Rata-rata dari seluruh periode."
            icon={BoltIcon}
            tone="cyan"
          />
          <DashboardStatCard
            title="Tren"
            value={`${stats.percentageChange > 0 ? '+' : ''}${stats.percentageChange.toFixed(1)}%`}
            subtitle={getChangeText(stats.percentageChange)}
            icon={stats.trend === 'up' ? ArrowTrendingUpIcon : stats.trend === 'down' ? ArrowTrendingDownIcon : BoltIcon}
            tone={stats.trend === 'up' ? 'red' : stats.trend === 'down' ? 'green' : 'blue'}
          />
        </div>
      )}

      {/* Alerts */}
      {stats && hasUsageHistory && stats.trend === 'up' && stats.percentageChange > 20 && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
          <p className="text-[13px] text-warning-700">
            <strong>Peringatan Pemakaian Tinggi!</strong> Konsumsi air Anda meningkat sebesar{' '}
            <strong>{stats.percentageChange.toFixed(1)}%</strong> dibandingkan bulan lalu.
            Periksa kemungkinan kebocoran atau kurangi pemakaian.
          </p>
        </div>
      )}

      {stats && hasUsageHistory && stats.trend === 'down' && stats.percentageChange < -20 && (
        <div className="rounded-xl border border-success-200 bg-success-50 p-4">
          <p className="text-[13px] text-success-700">
            <strong>Bagus sekali!</strong> Konsumsi air Anda berkurang sebesar{' '}
            <strong>{Math.abs(stats.percentageChange).toFixed(1)}%</strong> dibandingkan bulan
            lalu. Pertahankan terus!
          </p>
        </div>
      )}

      {/* Charts */}
      {hasUsageHistory && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card">
            <h2 className="text-sm font-semibold text-surface-900">Tren Pemakaian</h2>
            <p className="mt-1 text-[13px] text-surface-400">
              Grafik ini menampilkan total pemakaian air per bulan untuk periode yang dipilih.
            </p>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPemakaian" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} label={{ value: 'm³', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
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

          <section className="card">
            <h2 className="text-sm font-semibold text-surface-900">Perbandingan dengan Rata-Rata</h2>
            <p className="mt-1 text-[13px] text-surface-400">
              Bandingkan pemakaian enam bulan terakhir dengan rata-rata pemakaian Anda.
            </p>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} label={{ value: 'm³', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Pemakaian Bulan Ini" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rata-Rata" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {/* Meter Reading Chart */}
      {hasUsageHistory && (
        <section className="card">
          <h2 className="text-sm font-semibold text-surface-900">Riwayat Pembacaan Meter</h2>
          <p className="mt-1 text-[13px] text-surface-400">
            Grafik ini memperlihatkan perkembangan pembacaan meter awal dan akhir pada tiap periode.
          </p>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} label={{ value: 'Meter', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="previousReading"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  name="Pembacaan Awal"
                  dot={{ r: 4, fill: '#94A3B8' }}
                />
                <Line
                  type="monotone"
                  dataKey="currentReading"
                  stroke="#6366F1"
                  strokeWidth={2}
                  name="Pembacaan Akhir"
                  dot={{ r: 4, fill: '#6366F1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Usage History Table */}
      {hasUsageHistory && (
        <section className="card">
          <h2 className="text-sm font-semibold text-surface-900">Riwayat Pemakaian</h2>
          <p className="mt-1 text-[13px] text-surface-400">
            Tabel riwayat pemakaian air dengan detail pembacaan meter per periode.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-surface-100">
            <div className="grid grid-cols-[minmax(0,1.2fr)_100px_100px_100px_100px] gap-3 bg-surface-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-surface-400">
              <span>Tanggal Baca</span>
              <span className="text-right">Meter Awal</span>
              <span className="text-right">Meter Akhir</span>
              <span className="text-right">Pemakaian</span>
              <span className="text-right">Perubahan</span>
            </div>
            <div className="divide-y divide-surface-100">
              {usageHistoryRows.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-surface-400">
                  Belum ada data pemakaian
                </div>
              ) : (
                usageHistoryRows.map((usage, index, array) => {
                  const previousPemakaian = array[index + 1]?.usage;
                  const change = previousPemakaian
                    ? ((usage.usage - previousPemakaian) / previousPemakaian) * 100
                    : 0;

                  return (
                    <div
                      key={usage.id}
                      className="grid grid-cols-[minmax(0,1.2fr)_100px_100px_100px_100px] gap-3 px-4 py-3 text-sm transition hover:bg-surface-50"
                    >
                      <span className="font-medium text-surface-900">
                        {formatFullDate(usage.readingDate)}
                      </span>
                      <span className="text-right font-mono text-surface-500">
                        {usage.previousReading}
                      </span>
                      <span className="text-right font-mono text-surface-500">
                        {usage.currentReading}
                      </span>
                      <span className="text-right font-semibold text-surface-900">
                        {usage.usage} m³
                      </span>
                      <span className={`text-right font-medium ${
                        index < array.length - 1
                          ? change > 0
                            ? 'text-danger-600'
                            : change < 0
                              ? 'text-success-600'
                              : 'text-surface-500'
                          : 'text-surface-300'
                      }`}>
                        {index < array.length - 1
                          ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
                          : '-'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tips */}
      {hasUsageHistory && (
        <section className="rounded-xl border border-info-200 bg-info-50 p-5">
          <h3 className="text-sm font-semibold text-info-900">Tips Hemat Air</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] text-info-800">
            <li>• Perbaiki keran yang bocor. Satu tetesan dapat membuang hingga 80 liter per hari.</li>
            <li>• Mandi lebih singkat. Mengurangi 2 menit saja dapat menghemat hingga 40 liter.</li>
            <li>• Jalankan mesin cuci dan pencuci piring hanya saat penuh.</li>
            <li>• Gunakan perlengkapan dan peralatan hemat air.</li>
            <li>• Periksa meter secara rutin untuk mendeteksi kenaikan tidak wajar akibat kebocoran.</li>
          </ul>
        </section>
      )}
    </div>
  );
}
