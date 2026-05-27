import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlatformMonitoring from './PlatformMonitoring';

const mockGetSystemHealth = vi.fn();
const mockGetSystemMetrics = vi.fn();
const mockGetSystemAlerts = vi.fn();
const mockGetAuditLogs = vi.fn();
const mockGetErrorLogs = vi.fn();

vi.mock('../../services/platformMonitoringService', () => ({
  platformMonitoringService: {
    getSystemHealth: (...args: unknown[]) => mockGetSystemHealth(...args),
    getSystemMetrics: (...args: unknown[]) => mockGetSystemMetrics(...args),
    getSystemAlerts: (...args: unknown[]) => mockGetSystemAlerts(...args),
    getAuditLogs: (...args: unknown[]) => mockGetAuditLogs(...args),
    getErrorLogs: (...args: unknown[]) => mockGetErrorLogs(...args),
  },
}));

vi.mock('../../components', () => ({
  DashboardStatCard: ({ title, value, helper, subtitle }: { title: string; value: ReactNode; helper?: ReactNode; subtitle?: ReactNode }) => (
    <div>
      <p>{title}</p>
      <p>{value}</p>
      {helper ? <p>{helper}</p> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
  DataTable: ({
    data,
    emptyMessage,
  }: {
    data: Array<Record<string, unknown>>;
    emptyMessage?: string;
  }) =>
    data.length ? (
      <div>
        {data.map((row, index) => (
          <div key={index}>{Object.values(row).join(' | ')}</div>
        ))}
      </div>
    ) : (
      <div>{emptyMessage}</div>
    ),
  PageHeader: ({
    title,
    subtitle,
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </div>
  ),
}));

describe('PlatformMonitoring', () => {
  beforeEach(() => {
    mockGetSystemHealth.mockReset();
    mockGetSystemMetrics.mockReset();
    mockGetSystemAlerts.mockReset();
    mockGetAuditLogs.mockReset();
    mockGetErrorLogs.mockReset();

    mockGetSystemHealth.mockResolvedValue({
      status: 'healthy',
      timestamp: '2026-05-27T00:00:00Z',
      checks: {
        database: {
          status: 'healthy',
          error: '',
          message: '',
          details: {
            open_connections: 4,
            in_use: 1,
          },
        },
        errors: {
          status: 'warning',
          error: '',
          message: 'High error rate detected',
          details: {
            errors_last_hour: 3,
            requests_last_hour: 40,
            error_rate_percent: 7.5,
          },
        },
      },
    });

    mockGetSystemMetrics.mockResolvedValue({
      timestamp: '2026-05-27T00:00:00Z',
      system: {
        memory: {
          alloc_mb: 64,
          total_alloc_mb: 96,
          sys_mb: 128,
          num_gc: 12,
          goroutines: 18,
        },
        database: {
          open_connections: 4,
          in_use: 1,
          idle: 3,
          max_open: 10,
          wait_count: 2,
          wait_duration_ms: 5,
        },
      },
      application: {
        uptime_hours: 12.5,
        active_tenants: 9,
        total_users: 23,
        total_customers: 180,
      },
      requests_24h: {
        total: 120,
        successful: 115,
        failed: 5,
        success_rate: 95.83,
        error_rate: 4.17,
        avg_response_time: 48.5,
      },
      top_endpoints: [
        {
          endpoint: '/api/invoices',
          count: 40,
          avg_time: 44.3,
        },
      ],
    });

    mockGetSystemAlerts.mockResolvedValue({
      timestamp: '2026-05-27T00:00:00Z',
      summary: {
        critical: 1,
        warning: 1,
        info: 0,
      },
      alerts: [
        {
          code: 'database-pool-high',
          severity: 'warning',
          title: 'Utilisasi pool database tinggi',
          message: 'Koneksi database aktif mendekati batas maksimum.',
          source: 'database',
          observed_at: '2026-05-27T00:00:00Z',
          value: 84,
          threshold: 80,
        },
        {
          code: 'error-rate-critical',
          severity: 'critical',
          title: 'Error rate kritis',
          message: 'Lonjakan error dalam 1 jam terakhir sudah masuk level kritis.',
          source: 'audit_log',
          observed_at: '2026-05-27T00:00:00Z',
          value: 12,
          threshold: 10,
        },
      ],
    });

    mockGetAuditLogs.mockResolvedValue({
      logs: [
        {
          id: 'audit-1',
          tenant_id: 'tenant-1',
          user_id: 'user-1',
          action: 'UPDATE',
          resource: 'invoice',
          level: 'INFO',
          description: 'Invoice diperbarui',
          endpoint: '/api/invoices/1',
          method: 'PUT',
          status_code: 200,
          duration_ms: 42,
          success: true,
          error_message: '',
          ip_address: '127.0.0.1',
          created_at: '2026-05-27T00:10:00Z',
        },
      ],
      pagination: {
        page: 1,
        page_size: 10,
        total: 1,
        total_pages: 1,
      },
    });

    mockGetErrorLogs.mockResolvedValue({
      logs: [
        {
          id: 'error-1',
          tenant_id: 'tenant-1',
          user_id: 'user-1',
          action: 'UPDATE',
          resource: 'invoice',
          level: 'CRITICAL',
          description: 'Gagal menyimpan invoice',
          endpoint: '/api/invoices/1',
          method: 'PUT',
          status_code: 500,
          duration_ms: 100,
          success: false,
          error_message: 'database timeout',
          ip_address: '127.0.0.1',
          created_at: '2026-05-27T00:15:00Z',
        },
      ],
      pagination: {
        page: 1,
        page_size: 10,
        total: 1,
        total_pages: 1,
      },
      statistics: {
        total_errors: 20,
        last_24_hours: 5,
        last_7_days: 9,
        critical_errors: 2,
      },
    });
  });

  it('loads monitoring summaries and latest logs', async () => {
    render(<PlatformMonitoring />);

    expect(await screen.findByText('Monitoring Platform')).toBeInTheDocument();
    expect(screen.getByText('Status Sistem')).toBeInTheDocument();
    expect(screen.getByText('Request 24 Jam')).toBeInTheDocument();
    expect(screen.getByText('Alert operasional')).toBeInTheDocument();
    expect(screen.getByText('Utilisasi pool database tinggi')).toBeInTheDocument();
    expect(screen.getByText('Endpoint terpadat')).toBeInTheDocument();
    expect(screen.getAllByText(/\/api\/invoices/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gagal menyimpan invoice/)).toBeInTheDocument();
    expect(screen.getByText(/Invoice diperbarui/)).toBeInTheDocument();
  });

  it('refreshes monitoring data when the refresh action is clicked', async () => {
    render(<PlatformMonitoring />);

    expect(await screen.findByText('Monitoring Platform')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /segarkan data/i }));

    await waitFor(() => {
      expect(mockGetSystemHealth).toHaveBeenCalledTimes(2);
      expect(mockGetSystemMetrics).toHaveBeenCalledTimes(2);
      expect(mockGetSystemAlerts).toHaveBeenCalledTimes(2);
      expect(mockGetAuditLogs).toHaveBeenCalledTimes(2);
      expect(mockGetErrorLogs).toHaveBeenCalledTimes(2);
    });
  });
});
