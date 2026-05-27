export interface PlatformAuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource: string;
  level: string;
  description: string;
  endpoint: string;
  method: string;
  status_code: number;
  duration_ms: number;
  success: boolean;
  error_message: string;
  ip_address: string;
  created_at: string;
}

export interface PlatformPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PlatformHealthCheck {
  status: string;
  error: string;
  message: string;
  details: Record<string, unknown>;
}

export interface PlatformSystemHealth {
  status: string;
  timestamp: string;
  checks: Record<string, PlatformHealthCheck>;
}

export interface PlatformSystemMetrics {
  timestamp: string;
  system: {
    memory: {
      alloc_mb: number;
      total_alloc_mb: number;
      sys_mb: number;
      num_gc: number;
      goroutines: number;
    };
    database: {
      open_connections: number;
      in_use: number;
      idle: number;
      max_open: number;
      wait_count: number;
      wait_duration_ms: number;
    };
  };
  application: {
    uptime_hours: number;
    active_tenants: number;
    total_users: number;
    total_customers: number;
  };
  requests_24h: {
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
    error_rate: number;
    avg_response_time: number;
  };
  top_endpoints: Array<{
    endpoint: string;
    count: number;
    avg_time: number;
  }>;
}

export interface PlatformErrorStatistics {
  total_errors: number;
  last_24_hours: number;
  last_7_days: number;
  critical_errors: number;
}

export interface PlatformAuditLogResponse {
  logs: PlatformAuditLog[];
  pagination: PlatformPagination;
}

export interface PlatformErrorLogResponse extends PlatformAuditLogResponse {
  statistics: PlatformErrorStatistics;
}
