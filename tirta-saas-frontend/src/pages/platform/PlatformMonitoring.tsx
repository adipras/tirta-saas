import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { DashboardStatCard, DataTable, PageHeader, type Column } from '../../components';
import { platformMonitoringService } from '../../services/platformMonitoringService';
import type {
  PlatformAuditLog,
  PlatformAuditLogResponse,
  PlatformErrorLogResponse,
  PlatformHealthCheck,
  PlatformSystemHealth,
  PlatformSystemMetrics,
} from '../../types/platformMonitoring';

const healthCheckLabels: Record<string, string> = {
  database: 'Database',
  tenants: 'Tenant',
  errors: 'Error aplikasi',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim() !== '') {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const getStatusTone = (status: string) => {
  switch (status.toLowerCase()) {
    case 'healthy':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'warning':
    case 'degraded':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'unhealthy':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
};

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const formatDecimal = (value: number, fractionDigits = 2) =>
  new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

const formatDateTime = (value: string) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('id-ID');
};

const formatStatus = (status: string) =>
  status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const renderHealthDetail = (key: string, value: unknown) => {
  if (typeof value === 'number') {
    return formatNumber(value);
  }

  if (typeof value === 'string' && key.toLowerCase().includes('timestamp')) {
    return formatDateTime(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }

  return null;
};

export default function PlatformMonitoring() {
  const [health, setHealth] = useState<PlatformSystemHealth | null>(null);
  const [metrics, setMetrics] = useState<PlatformSystemMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<PlatformAuditLogResponse | null>(null);
  const [errorLogs, setErrorLogs] = useState<PlatformErrorLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoring = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const [healthData, metricsData, auditData, errorData] = await Promise.all([
        platformMonitoringService.getSystemHealth(),
        platformMonitoringService.getSystemMetrics(),
        platformMonitoringService.getAuditLogs({ page: 1, page_size: 10 }),
        platformMonitoringService.getErrorLogs({ page: 1, page_size: 10 }),
      ]);

      setHealth(healthData);
      setMetrics(metricsData);
      setAuditLogs(auditData);
      setErrorLogs(errorData);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat data monitoring platform.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchMonitoring();
  }, [fetchMonitoring]);

  const auditColumns = useMemo<Column<PlatformAuditLog>[]>(
    () => [
      {
        key: 'created_at',
        label: 'Waktu',
        render: (value) => formatDateTime(String(value ?? '')),
      },
      {
        key: 'action',
        label: 'Aksi',
        render: (value) => (
          <span className="font-medium text-gray-900">{formatStatus(String(value ?? '-'))}</span>
        ),
      },
      {
        key: 'resource',
        label: 'Resource',
      },
      {
        key: 'endpoint',
        label: 'Endpoint',
        render: (_, item) => (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{item.method || '-'}</p>
            <p className="break-all text-xs text-gray-500">{item.endpoint || '-'}</p>
          </div>
        ),
      },
      {
        key: 'status_code',
        label: 'Status',
        render: (value, item) => (
          <span className={item.success ? 'text-green-700' : 'text-red-700'}>
            {formatNumber(Number(value ?? 0))}
          </span>
        ),
      },
      {
        key: 'duration_ms',
        label: 'Durasi',
        render: (value) => `${formatNumber(Number(value ?? 0))} ms`,
      },
    ],
    []
  );

  const errorColumns = useMemo<Column<PlatformAuditLog>[]>(
    () => [
      {
        key: 'created_at',
        label: 'Waktu',
        render: (value) => formatDateTime(String(value ?? '')),
      },
      {
        key: 'level',
        label: 'Level',
        render: (value) => (
          <span className="font-medium text-red-700">{formatStatus(String(value ?? '-'))}</span>
        ),
      },
      {
        key: 'description',
        label: 'Deskripsi',
        render: (value, item) => (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{String(value ?? '-')}</p>
            <p className="break-all text-xs text-gray-500">{item.error_message || 'Tanpa detail error'}</p>
          </div>
        ),
      },
      {
        key: 'endpoint',
        label: 'Endpoint',
        render: (_, item) => (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{item.method || '-'}</p>
            <p className="break-all text-xs text-gray-500">{item.endpoint || '-'}</p>
          </div>
        ),
      },
      {
        key: 'status_code',
        label: 'HTTP',
      },
    ],
    []
  );

  const healthChecks = useMemo(
    () => (health ? Object.entries(health.checks) : []),
    [health]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">{error}</div>;
  }

  if (!health || !metrics || !auditLogs || !errorLogs) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 shadow-sm">
        Data monitoring platform belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Platform"
        subtitle="Pantau kesehatan runtime, metrik operasional, audit log, dan error log dari satu halaman platform owner."
        actions={
          <button
            type="button"
            onClick={() => void fetchMonitoring('refresh')}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Menyegarkan...' : 'Segarkan data'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardStatCard
          title="Status Sistem"
          value={formatStatus(health.status)}
          helper={`${healthChecks.length} pemeriksaan aktif`}
          subtitle={`Terakhir diperbarui ${formatDateTime(health.timestamp)}`}
          icon={health.status === 'healthy' ? HeartIcon : ExclamationTriangleIcon}
          tone={health.status === 'healthy' ? 'green' : health.status === 'degraded' ? 'yellow' : 'purple'}
        />
        <DashboardStatCard
          title="Request 24 Jam"
          value={formatNumber(metrics.requests_24h.total)}
          helper={`${formatDecimal(metrics.requests_24h.success_rate)}% berhasil`}
          subtitle={`${formatDecimal(metrics.requests_24h.avg_response_time)} ms rata-rata`}
          icon={ServerStackIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Error 24 Jam"
          value={formatNumber(errorLogs.statistics.last_24_hours)}
          helper={`${formatDecimal(metrics.requests_24h.error_rate)}% error rate`}
          subtitle={`${formatNumber(errorLogs.statistics.critical_errors)} error kritis terdeteksi`}
          icon={ExclamationTriangleIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Uptime Runtime"
          value={`${formatDecimal(metrics.application.uptime_hours)} jam`}
          helper={`${formatNumber(metrics.application.active_tenants)} tenant aktif`}
          subtitle={`${formatNumber(metrics.application.total_users)} user • ${formatNumber(metrics.application.total_customers)} pelanggan`}
          icon={ShieldCheckIcon}
          tone="purple"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Kesehatan komponen</h2>
          <p className="mt-1 text-sm text-gray-500">
            Cek cepat komponen inti yang paling berpengaruh ke operasi tenant dan billing.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {healthChecks.map(([key, check]: [string, PlatformHealthCheck]) => {
            const detailEntries = Object.entries(check.details).filter(([detailKey, value]) => (
              renderHealthDetail(detailKey, value) !== null
            ));

            return (
              <div key={key} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{healthCheckLabels[key] || formatStatus(key)}</p>
                    <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(check.status)}`}>
                      {formatStatus(check.status)}
                    </p>
                  </div>
                </div>

                {(check.message || check.error) && (
                  <p className="mt-3 text-sm text-gray-600">{check.message || check.error}</p>
                )}

                {detailEntries.length > 0 && (
                  <dl className="mt-4 space-y-2">
                    {detailEntries.map(([detailKey, value]) => (
                      <div key={detailKey} className="flex items-start justify-between gap-3 text-sm">
                        <dt className="text-gray-500">{formatStatus(detailKey)}</dt>
                        <dd className="text-right font-medium text-gray-900">
                          {renderHealthDetail(detailKey, value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Metrik runtime</h2>
          <p className="mt-1 text-sm text-gray-500">Memori aplikasi dan utilisasi koneksi database saat ini.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Memori aktif</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatDecimal(metrics.system.memory.alloc_mb)} MB
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Total alokasi {formatDecimal(metrics.system.memory.total_alloc_mb)} MB
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Goroutine</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(metrics.system.memory.goroutines)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                GC berjalan {formatNumber(metrics.system.memory.num_gc)} kali
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Koneksi DB terbuka</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(metrics.system.database.open_connections)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {formatNumber(metrics.system.database.in_use)} dipakai • {formatNumber(metrics.system.database.idle)} idle
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Antrean koneksi</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(metrics.system.database.wait_count)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {formatNumber(metrics.system.database.wait_duration_ms)} ms waktu tunggu kumulatif
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Endpoint terpadat</h2>
          <p className="mt-1 text-sm text-gray-500">Permukaan API yang paling sering dipanggil dalam 24 jam terakhir.</p>

          <div className="mt-4 space-y-3">
            {metrics.top_endpoints.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">
                Belum ada data endpoint dalam 24 jam terakhir.
              </p>
            ) : (
              metrics.top_endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.endpoint}-${endpoint.count}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="break-all text-sm font-medium text-gray-900">{endpoint.endpoint || '-'}</p>
                    <span className="text-sm font-semibold text-gray-900">{formatNumber(endpoint.count)}x</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Respons rata-rata {formatDecimal(endpoint.avg_time)} ms
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-gray-200 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Error log terbaru</h2>
            <p className="mt-1 text-sm text-gray-500">
              Prioritaskan error rate dan error kritis untuk menjaga operasional tenant tetap stabil.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Total error</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(errorLogs.statistics.total_errors)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">24 jam terakhir</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(errorLogs.statistics.last_24_hours)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">7 hari terakhir</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(errorLogs.statistics.last_7_days)}
              </p>
            </div>
          </div>
        </div>

        <DataTable
          data={errorLogs.logs}
          columns={errorColumns}
          searchKeys={['description', 'error_message', 'endpoint', 'resource']}
          emptyMessage="Belum ada error log yang tercatat."
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Audit log terbaru</h2>
          <p className="mt-1 text-sm text-gray-500">
            Pantau aktivitas sensitif, resource yang diubah, dan respons endpoint terbaru.
          </p>
        </div>

        <DataTable
          data={auditLogs.logs}
          columns={auditColumns}
          searchKeys={['action', 'resource', 'description', 'endpoint']}
          emptyMessage="Belum ada audit log yang tercatat."
        />
      </section>
    </div>
  );
}
