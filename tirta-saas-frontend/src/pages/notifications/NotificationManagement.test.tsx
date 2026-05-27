import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationManagement from './NotificationManagement';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockGetNotificationTemplates = vi.fn();
const mockCreateNotificationTemplate = vi.fn();
const mockUpdateNotificationTemplate = vi.fn();
const mockDeleteNotificationTemplate = vi.fn();
const mockSendNotification = vi.fn();
const mockGetTenantUsers = vi.fn();
const mockGetCustomers = vi.fn();

vi.mock('../../components', async () => {
  const actual = await vi.importActual<typeof import('../../components')>('../../components');
  return {
    ...actual,
    useToast: () => ({
      success: mockToastSuccess,
      error: mockToastError,
      warning: vi.fn(),
      info: vi.fn(),
    }),
  };
});

vi.mock('../../services/notificationAdminService', () => ({
  notificationAdminService: {
    getNotificationTemplates: (...args: unknown[]) => mockGetNotificationTemplates(...args),
    createNotificationTemplate: (...args: unknown[]) => mockCreateNotificationTemplate(...args),
    updateNotificationTemplate: (...args: unknown[]) => mockUpdateNotificationTemplate(...args),
    deleteNotificationTemplate: (...args: unknown[]) => mockDeleteNotificationTemplate(...args),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}));

vi.mock('../../services/tenantUserService', () => ({
  tenantUserService: {
    getTenantUsers: (...args: unknown[]) => mockGetTenantUsers(...args),
  },
}));

vi.mock('../../services/customerService', () => ({
  __esModule: true,
  default: {
    getPelanggan: (...args: unknown[]) => mockGetCustomers(...args),
  },
}));

describe('NotificationManagement', () => {
  beforeEach(() => {
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockGetNotificationTemplates.mockReset();
    mockCreateNotificationTemplate.mockReset();
    mockUpdateNotificationTemplate.mockReset();
    mockDeleteNotificationTemplate.mockReset();
    mockSendNotification.mockReset();
    mockGetTenantUsers.mockReset();
    mockGetCustomers.mockReset();

    mockGetNotificationTemplates.mockResolvedValue([
      {
        id: 'tmpl-1',
        tenant_id: 'tenant-1',
        code: 'INVOICE_REMINDER',
        name: 'Pengingat Tagihan',
        description: 'Template pengingat jatuh tempo',
        channel: 'IN_APP',
        subject: '',
        body: 'Halo {{customer_name}}',
        html_body: '',
        variables: ['customer_name'],
        is_active: true,
        language: 'id',
        created_at: '2026-05-27T00:00:00Z',
        updated_at: '2026-05-27T00:00:00Z',
      },
    ]);

    mockGetTenantUsers.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Admin Tirta',
        email: 'admin@tenant.test',
        role: 'tenant_admin',
      },
    ]);

    mockGetCustomers.mockResolvedValue({
      data: [
        {
          id: 'cust-1',
          name: 'Budi',
          email: 'budi@test.id',
          phone: '08123456789',
          meter_number: 'MT-001',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 1000,
        totalPages: 1,
        currentPage: 1,
      },
    });
  });

  it('loads notification templates and recipients', async () => {
    render(<NotificationManagement />);

    expect(await screen.findByText('Manajemen Notifikasi')).toBeInTheDocument();
    expect(screen.getAllByText('Pengingat Tagihan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('INVOICE_REMINDER').length).toBeGreaterThan(0);
    expect(mockGetNotificationTemplates).toHaveBeenCalledWith({
      channel: undefined,
      include_inactive: false,
    });
    expect(mockGetTenantUsers).toHaveBeenCalled();
    expect(mockGetCustomers).toHaveBeenCalledWith(1, 1000);
  });

  it('sends a template-based in-app notification', async () => {
    render(<NotificationManagement />);

    expect(await screen.findByText('Manajemen Notifikasi')).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Admin Tirta/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Penerima'), {
      target: { value: 'user-1' },
    });
    fireEvent.change(screen.getByLabelText('Template (opsional)'), {
      target: { value: 'INVOICE_REMINDER' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /kirim notifikasi/i }).closest('form')!);

    await waitFor(() => {
      expect(mockSendNotification).toHaveBeenCalledWith({
        template_code: 'INVOICE_REMINDER',
        channel: 'IN_APP',
        recipient_type: 'USER',
        recipient_id: 'user-1',
        variables: undefined,
        custom_subject: undefined,
        custom_body: undefined,
      });
    });

    expect(mockToastSuccess).toHaveBeenCalledWith('Notifikasi berhasil dikirim');
  });
});
