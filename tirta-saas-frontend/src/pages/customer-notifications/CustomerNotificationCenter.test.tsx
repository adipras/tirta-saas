import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerNotificationCenter from './CustomerNotificationCenter';

const mockGetInbox = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockToast = {
  error: vi.fn(),
};

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    getInbox: (...args: unknown[]) => mockGetInbox(...args),
    markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
    markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
  },
}));

vi.mock('../../components', () => ({
  PageHeader: ({
    title,
    subtitle,
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </div>
  ),
  TableSkeleton: () => <div>Loading...</div>,
  useToast: () => mockToast,
}));

describe('CustomerNotificationCenter', () => {
  beforeEach(() => {
    mockGetInbox.mockReset();
    mockMarkAsRead.mockReset();
    mockMarkAllAsRead.mockReset();
    mockToast.error.mockReset();
  });

  it('loads customer notifications and shows invoice shortcut', async () => {
    mockGetInbox.mockResolvedValue({
      unreadCount: 1,
      items: [
        {
          id: 'notif-1',
          subject: 'Pembayaran diverifikasi',
          body: 'Tagihan INV-001 sudah diverifikasi.',
          status: 'DELIVERED',
          is_read: false,
          created_at: '2026-05-27T08:00:00.000Z',
          channel: 'IN_APP',
          metadata: {
            invoice_id: 'invoice-1',
            invoice_number: 'INV-001',
          },
        },
      ],
    });

    render(
      <MemoryRouter>
        <CustomerNotificationCenter />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pembayaran diverifikasi')).toBeInTheDocument();
    expect(mockGetInbox).toHaveBeenCalledWith('customer', 50);
    expect(screen.getByRole('link', { name: 'Lihat tagihan' })).toHaveAttribute(
      'href',
      '/customer/invoices/invoice-1'
    );
  });

  it('marks notifications as read from page actions', async () => {
    mockGetInbox.mockResolvedValue({
      unreadCount: 2,
      items: [
        {
          id: 'notif-1',
          subject: 'Tagihan overdue',
          body: 'Segera lakukan pembayaran.',
          status: 'DELIVERED',
          is_read: false,
          created_at: '2026-05-27T08:00:00.000Z',
          channel: 'IN_APP',
          metadata: {},
        },
        {
          id: 'notif-2',
          subject: 'Notifikasi kedua',
          body: 'Isi notifikasi kedua.',
          status: 'DELIVERED',
          is_read: false,
          created_at: '2026-05-27T09:00:00.000Z',
          channel: 'IN_APP',
          metadata: {},
        },
      ],
    });
    mockMarkAsRead.mockResolvedValue({
      id: 'notif-1',
      subject: 'Tagihan overdue',
      body: 'Segera lakukan pembayaran.',
      status: 'DELIVERED',
      is_read: true,
      read_at: '2026-05-27T10:00:00.000Z',
      created_at: '2026-05-27T08:00:00.000Z',
      channel: 'IN_APP',
      metadata: {},
    });
    mockMarkAllAsRead.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <CustomerNotificationCenter />
      </MemoryRouter>
    );

    expect(await screen.findByText('Tagihan overdue')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Tandai dibaca' })[0]);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('customer', 'notif-1');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tandai semua' }));

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalledWith('customer');
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
