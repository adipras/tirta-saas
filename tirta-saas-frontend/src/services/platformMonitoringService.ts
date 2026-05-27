import { API_ENDPOINTS } from '../constants/api';
import type {
  PlatformAuditLog,
  PlatformAuditLogResponse,
  PlatformErrorLogResponse,
  PlatformErrorStatistics,
  PlatformHealthCheck,
  PlatformPagination,
  PlatformSystemHealth,
  PlatformSystemMetrics,
} from '../types/platformMonitoring';
import { apiClient } from './apiClient';
import { asArray, asRecord, getBoolean, getNumber, getString, unwrapResponseData } from '../utils/dataTransform';

type MonitoringListParams = {
  page?: number;
  page_size?: number;
};

const mapPagination = (raw: unknown): PlatformPagination => {
  const data = asRecord(raw);

  return {
    page: getNumber(data.page, 1),
    page_size: getNumber(data.page_size, 10),
    total: getNumber(data.total),
    total_pages: getNumber(data.total_pages),
  };
};

const mapAuditLog = (raw: unknown): PlatformAuditLog => {
  const data = asRecord(raw);

  return {
    id: getString(data.id),
    tenant_id: getString(data.tenant_id),
    user_id: getString(data.user_id),
    action: getString(data.action),
    resource: getString(data.resource),
    level: getString(data.level),
    description: getString(data.description),
    endpoint: getString(data.endpoint),
    method: getString(data.method),
    status_code: getNumber(data.status_code),
    duration_ms: getNumber(data.duration_ms, getNumber(data.duration)),
    success: getBoolean(data.success),
    error_message: getString(data.error_message),
    ip_address: getString(data.ip_address),
    created_at: getString(data.created_at),
  };
};

const mapHealthCheck = (raw: unknown): PlatformHealthCheck => {
  const data = asRecord(raw);
  const { status, error, message, ...details } = data;

  return {
    status: getString(status, 'unknown'),
    error: getString(error),
    message: getString(message),
    details,
  };
};

const mapSystemHealth = (raw: unknown): PlatformSystemHealth => {
  const data = asRecord(raw);
  const checks = asRecord(data.checks);

  return {
    status: getString(data.status, 'unknown'),
    timestamp: getString(data.timestamp),
    checks: Object.fromEntries(
      Object.entries(checks).map(([key, value]) => [key, mapHealthCheck(value)])
    ),
  };
};

const mapSystemMetrics = (raw: unknown): PlatformSystemMetrics => {
  const data = asRecord(raw);
  const system = asRecord(data.system);
  const memory = asRecord(system.memory);
  const database = asRecord(system.database);
  const application = asRecord(data.application);
  const requests = asRecord(data.requests_24h);

  return {
    timestamp: getString(data.timestamp),
    system: {
      memory: {
        alloc_mb: getNumber(memory.alloc_mb),
        total_alloc_mb: getNumber(memory.total_alloc_mb),
        sys_mb: getNumber(memory.sys_mb),
        num_gc: getNumber(memory.num_gc),
        goroutines: getNumber(memory.goroutines),
      },
      database: {
        open_connections: getNumber(database.open_connections),
        in_use: getNumber(database.in_use),
        idle: getNumber(database.idle),
        max_open: getNumber(database.max_open),
        wait_count: getNumber(database.wait_count),
        wait_duration_ms: getNumber(database.wait_duration_ms),
      },
    },
    application: {
      uptime_hours: getNumber(application.uptime_hours),
      active_tenants: getNumber(application.active_tenants),
      total_users: getNumber(application.total_users),
      total_customers: getNumber(application.total_customers),
    },
    requests_24h: {
      total: getNumber(requests.total),
      successful: getNumber(requests.successful),
      failed: getNumber(requests.failed),
      success_rate: getNumber(requests.success_rate),
      error_rate: getNumber(requests.error_rate),
      avg_response_time: getNumber(requests.avg_response_time),
    },
    top_endpoints: asArray<unknown>(data.top_endpoints).map((item) => {
      const endpoint = asRecord(item);

      return {
        endpoint: getString(endpoint.endpoint),
        count: getNumber(endpoint.count),
        avg_time: getNumber(endpoint.avg_time),
      };
    }),
  };
};

const mapErrorStatistics = (raw: unknown): PlatformErrorStatistics => {
  const data = asRecord(raw);

  return {
    total_errors: getNumber(data.total_errors, getNumber(data.TotalErrors)),
    last_24_hours: getNumber(data.last_24_hours, getNumber(data.Last24Hours)),
    last_7_days: getNumber(data.last_7_days, getNumber(data.Last7Days)),
    critical_errors: getNumber(data.critical_errors, getNumber(data.CriticalErrors)),
  };
};

class PlatformMonitoringService {
  async getSystemHealth(): Promise<PlatformSystemHealth> {
    const response = await apiClient.get(API_ENDPOINTS.PLATFORM.SYSTEM.HEALTH);
    return mapSystemHealth(unwrapResponseData(response));
  }

  async getSystemMetrics(): Promise<PlatformSystemMetrics> {
    const response = await apiClient.get(API_ENDPOINTS.PLATFORM.SYSTEM.METRICS);
    return mapSystemMetrics(unwrapResponseData(response));
  }

  async getAuditLogs(params: MonitoringListParams = {}): Promise<PlatformAuditLogResponse> {
    const response = await apiClient.get(API_ENDPOINTS.PLATFORM.LOGS.AUDIT, { params });
    const data = asRecord(unwrapResponseData(response));

    return {
      logs: asArray<unknown>(data.logs).map(mapAuditLog),
      pagination: mapPagination(data.pagination),
    };
  }

  async getErrorLogs(params: MonitoringListParams = {}): Promise<PlatformErrorLogResponse> {
    const response = await apiClient.get(API_ENDPOINTS.PLATFORM.LOGS.ERRORS, { params });
    const data = asRecord(unwrapResponseData(response));

    return {
      logs: asArray<unknown>(data.logs).map(mapAuditLog),
      pagination: mapPagination(data.pagination),
      statistics: mapErrorStatistics(data.statistics),
    };
  }
}

const platformMonitoringServiceInstance = new PlatformMonitoringService();

export default platformMonitoringServiceInstance;
export const platformMonitoringService = platformMonitoringServiceInstance;
