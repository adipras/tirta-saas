import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { DashboardStatCard, DataTable, type Column } from '../../components';
import { platformMonitoringService } from '../../services/platformMonitoringService';
import type {
  PlatformAuditLog,
  PlatformAuditLogResponse,
  PlatformErrorLogResponse,
  PlatformHealthCheck,
  PlatformSystemAlert,
  PlatformSystemAlertResponse,
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
      return 'border-success-200 bg-success-50 text-success-700';
    case 'warning':
    case 'degraded':
      return 'border-warning-200 bg-warning-50 text-warning-700';
    case 'unhealthy':
      return 'border-danger-200 bg-danger-50 text-danger-700';
    default:
      return 'border-surface-200 bg-surface-50 text-surface-600';
  }
};

const getAlertTone = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'border-danger-200 bg-danger-50 text-danger-700';
    case 'warning':
      return 'border-warning-200 bg-warning-50 text-warning-700';
    default:
      return 'border-brand-200 bg-brand-50 text-brand-700';
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
  const [alerts, setAlerts] = useState<PlatformSystemAlertResponse | null>(null);
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

      const [healthData, metricsData, alertsData, auditData, errorData] = await Promise.all([
        platformMonitoringService.getSystemHealth(),
        platformMonitoringService.getSystemMetrics(),
        platformMonitoringService.getSystemAlerts(),
        platformMonitoringService.getAuditLogs({ page: 1, page_size: 10 }),
        platformMonitoringService.getErrorLogs({ page: 1, page_size: 10 }),
      ]);

      setHealth(healthData);
      setMetrics(metricsData);
      setAlerts(alertsData);
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
        render: (value) => <span className="text-surface-400">{formatDateTime(String(value ?? ''))}</span>,
      },
      {
        key: 'action',
        label: 'Aksi',
        render: (value) => (
          <span className="font-medium text-surface-800">{formatStatus(String(value ?? '-'))}</span>
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
          <div className="space-y-0.5">
            <p className="font-medium text-surface-800">{item.method || '-'}</p>
            <p className="break-all text-[12px] text-surface-400">{item.endpoint || '-'}</p>
          </div>
        ),
      },
      {
        key: 'status_code',
        label: 'Status',
        render: (value, item) => (
          <span className={item.success ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'}>
            {formatNumber(Number(value ?? 0))}
          </span>
        ),
      },
      {
        key: 'duration_ms',
        label: 'Durasi',
        render: (value) => <span className="text-surface-500">{formatNumber(Number(value ?? 0))} ms</span>,
      },
    ],
    []
  );

  const errorColumns = useMemo<Column<PlatformAuditLog>[]>(
    () => [
      {
        key: 'created_at',
        label: 'Waktu',
        render: (value) => <span className="text-surface-400">{formatDateTime(String(value ?? ''))}</span>,
      },
      {
        key: 'level',
        label: 'Level',
        render: (value) => (
          <span className="font-medium text-danger-600">{formatStatus(String(value ?? '-'))}</span>
        ),
      },
      {
        key: 'description',
        label: 'Deskripsi',
        render: (value, item) => (
          <div className="space-y-0.5">
            <p className="font-medium text-surface-800">{String(value ?? '-')}</p>
            <p className="break-all text-[12px] text-surface-400">{item.error_message || 'Tanpa detail error'}</p>
          </div>
        ),
      },
      {
        key: 'endpoint',
        label: 'Endpoint',
        render: (_, item) => (
          <div className="space-y-0.5">
            <p className="font-medium text-surface-800">{item.method || '-'}</p>
            <p className="break-all text-[12px] text-surface-400">{item.endpoint || '-'}</p>
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
    return <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-700">{error}</div>;
  }

  if (!health || !metrics || !alerts || !auditLogs || !errorLogs) {
    return (
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-[13px] text-warning-700">
        Data monitoring platform belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Monitoring Platform</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Pantau kesehatan runtime, metrik operasional, audit log, dan error log.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchMonitoring('refresh')}
          disabled={refreshing}
          className="btn-secondary self-start"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Menyegarkan...' : 'Segarkan data'}
        </button>
      </div>

      {/* Stat Cards */}
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
          subtitle={`${formatNumber(errorLogs.statistics.critical_errors)} error kritis`}
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

      {/* Alerts */}
      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-surface-800">Alert operasional</h2>
            <p className="mt-0.5 text-[13px] text-surface-400">
              Alarm dasar untuk health, error-rate, runtime, dan koneksi database.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center self-start">
            {[
              { label: 'Critical', value: alerts.summary.critical, ring: 'ring-danger-200/60', bg: 'bg-danger-50', text: 'text-danger-700' },
              { label: 'Warning', value: alerts.summary.warning, ring: 'ring-warning-200/60', bg: 'bg-warning-50', text: 'text-warning-700' },
              { label: 'Info', value: alerts.summary.info, ring: 'ring-brand-200/60', bg: 'bg-brand-50', text: 'text-brand-700' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border px-4 py-3 ring-1 ring-inset ${item.ring} ${item.bg}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${item.text}`}>{item.label}</p>
                <p className={`mt-1 text-[20px] font-semibold ${item.text}`}>{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {alerts.alerts.map((alert: PlatformSystemAlert) => (
            <div key={alert.code} className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-surface-800">{alert.title}</p>
                  <p className="mt-0.5 text-[13px] text-surface-500">{alert.message}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${getAlertTone(alert.severity)}`}>
                  {formatStatus(alert.severity)}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-[13px]">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-surface-400">Sumber</dt>
                  <dd className="text-right font-medium text-surface-700">{formatStatus(alert.source)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-surface-400">Teramati</dt>
                  <dd className="text-right font-medium text-surface-700">{formatDateTime(alert.observed_at)}</dd>
                </div>
                {typeof alert.value === 'number' && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-surface-400">Nilai saat ini</dt>
                    <dd className="text-right font-medium text-surface-700">{formatDecimal(alert.value)}</dd>
                  </div>
                )}
                {typeof alert.threshold === 'number' && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-surface-400">Ambang</dt>
                    <dd className="text-right font-medium text-surface-700">{formatDecimal(alert.threshold)}</dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      </div>

      {/* Health Checks */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800">Kesehatan komponen</h2>
        <p className="mt-0.5 text-[13px] text-surface-400">
          Cek cepat komponen inti yang berpengaruh ke operasi tenant dan billing.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {healthChecks.map(([key, check]: [string, PlatformHealthCheck]) => {
            const detailEntries = Object.entries(check.details).filter(
              ([detailKey, value]) => renderHealthDetail(detailKey, value) !== null
            );

            return (
              <div key={key} className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium text-surface-800">{healthCheckLabels[key] || formatStatus(key)}</p>
                    <p className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${getStatusTone(check.status)}`}>
                      {formatStatus(check.status)}
                    </p>
                  </div>
                </div>

                {(check.message || check.error) && (
                  <p className="mt-3 text-[13px] text-surface-500">{check.message || check.error}</p>
                )}

                {detailEntries.length > 0 && (
                  <dl className="mt-3 space-y-1.5 text-[13px]">
                    {detailEntries.map(([detailKey, value]) => (
                      <div key={detailKey} className="flex items-start justify-between gap-3">
                        <dt className="text-surface-400">{formatStatus(detailKey)}</dt>
                        <dd className="text-right font-medium text-surface-700">
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
      </div>

      {/* Runtime Metrics + Top Endpoints */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Metrik runtime</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">Memori aplikasi dan utilisasi koneksi database.</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Memori aktif', value: `${formatDecimal(metrics.system.memory.alloc_mb)} MB`, sub: `Total alokasi ${formatDecimal(metrics.system.memory.total_alloc_mb)} MB` },
              { label: 'Goroutine', value: formatNumber(metrics.system.memory.goroutines), sub: `GC berjalan ${formatNumber(metrics.system.memory.num_gc)} kali` },
              { label: 'Koneksi DB terbuka', value: formatNumber(metrics.system.database.open_connections), sub: `${formatNumber(metrics.system.database.in_use)} dipakai • ${formatNumber(metrics.system.database.idle)} idle` },
              { label: 'Antrean koneksi', value: formatNumber(metrics.system.database.wait_count), sub: `${formatNumber(metrics.system.database.wait_duration_ms)} ms waktu tunggu` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
                <p className="text-[13px] text-surface-400">{item.label}</p>
                <p className="mt-2 text-[20px] font-semibold text-surface-800">{item.value}</p>
                <p className="mt-1 text-[12px] text-surface-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-semibold text-surface-800">Endpoint terpadat</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">API yang paling sering dipanggil dalam 24 jam.</p>

          <div className="mt-4 space-y-2">
            {metrics.top_endpoints.length === 0 ? (
              <p className="rounded-xl border border-dashed border-surface-200 px-4 py-5 text-center text-[13px] text-surface-400">
                Belum ada data endpoint dalam 24 jam terakhir.
              </p>
            ) : (
              metrics.top_endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.endpoint}-${endpoint.count}`}
                  className="rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="break-all text-[13px] font-medium text-surface-800">{endpoint.endpoint || '-'}</p>
                    <span className="text-[13px] font-semibold text-surface-700">{formatNumber(endpoint.count)}x</span>
                  </div>
                  <p className="mt-1 text-[12px] text-surface-400">
                    Respons rata-rata {formatDecimal(endpoint.avg_time)} ms
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Error Logs */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Error log terbaru</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">
            Prioritaskan error rate dan error kritis untuk menjaga operasional tenant stabil.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Total error', value: errorLogs.statistics.total_errors },
              { label: '24 jam terakhir', value: errorLogs.statistics.last_24_hours },
              { label: '7 hari terakhir', value: errorLogs.statistics.last_7_days },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-surface-100 bg-surface-50/50 px-4 py-3">
                <p className="text-[12px] text-surface-400">{item.label}</p>
                <p className="mt-1 text-[18px] font-semibold text-surface-800">{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <DataTable
          data={errorLogs.logs}
          columns={errorColumns}
          searchKeys={['description', 'error_message', 'endpoint', 'resource']}
          emptyMessage="Belum ada error log yang tercatat."
        />
      </div>

      {/* Audit Logs */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-surface-800">Audit log terbaru</h2>
          <p className="mt-0.5 text-[13px] text-surface-400">
            Pantau aktivitas sensitif, resource yang diubah, dan respons endpoint terbaru.
          </p>
        </div>

        <DataTable
          data={auditLogs.logs}
          columns={auditColumns}
          searchKeys={['action', 'resource', 'description', 'endpoint']}
          emptyMessage="Belum ada audit log yang tercatat."
        />
      </div>
    </div>
  );
}
