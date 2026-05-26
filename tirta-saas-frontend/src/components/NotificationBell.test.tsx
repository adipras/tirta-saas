import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationBell from './NotificationBell';

const mockGetInbox = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();

vi.mock('../services/notificationService', () => ({
  notificationService: {
    getInbox: (...args: unknown[]) => mockGetInbox(...args),
    markAsRead: (...args: unknown[]) => mockMarkAsRead(...args),
    markAllAsRead: (...args: unknown[]) => mockMarkAllAsRead(...args),
  },
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    mockGetInbox.mockReset();
    mockMarkAsRead.mockReset();
    mockMarkAllAsRead.mockReset();
  });

  it('loads unread count and shows notifications in the dropdown', async () => {
    mockGetInbox.mockResolvedValue({
      unreadCount: 2,
      items: [
        {
          id: 'notif-1',
          subject: 'Tagihan baru',
          body: 'Ada tagihan baru untuk diverifikasi.',
          status: 'DELIVERED',
          is_read: false,
          created_at: new Date().toISOString(),
          channel: 'IN_APP',
          metadata: {},
        },
      ],
    });

    render(<NotificationBell scope="user" />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lihat notifikasi' }));

    expect(await screen.findByText('Tagihan baru')).toBeInTheDocument();
    expect(screen.getByText('Ada tagihan baru untuk diverifikasi.')).toBeInTheDocument();
    expect(mockGetInbox).toHaveBeenCalledWith('user');
  });

  it('marks a single unread notification as read when clicked', async () => {
    mockGetInbox.mockResolvedValue({
      unreadCount: 1,
      items: [
        {
          id: 'notif-1',
          subject: 'Bukti bayar',
          body: 'Bukti pembayaran masuk.',
          status: 'DELIVERED',
          is_read: false,
          created_at: new Date().toISOString(),
          channel: 'IN_APP',
          metadata: {},
        },
      ],
    });
    mockMarkAsRead.mockResolvedValue({
      id: 'notif-1',
      subject: 'Bukti bayar',
      body: 'Bukti pembayaran masuk.',
      status: 'DELIVERED',
      is_read: true,
      read_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      channel: 'IN_APP',
      metadata: {},
    });

    render(<NotificationBell scope="customer" />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lihat notifikasi' }));
    fireEvent.click(await screen.findByText('Bukti bayar'));

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('customer', 'notif-1');
    });
  });

  it('marks all notifications as read from the dropdown action', async () => {
    mockGetInbox.mockResolvedValue({
      unreadCount: 2,
      items: [
        {
          id: 'notif-1',
          subject: 'Notif 1',
          body: 'Isi 1',
          status: 'DELIVERED',
          is_read: false,
          created_at: new Date().toISOString(),
          channel: 'IN_APP',
          metadata: {},
        },
        {
          id: 'notif-2',
          subject: 'Notif 2',
          body: 'Isi 2',
          status: 'DELIVERED',
          is_read: false,
          created_at: new Date().toISOString(),
          channel: 'IN_APP',
          metadata: {},
        },
      ],
    });
    mockMarkAllAsRead.mockResolvedValue(undefined);

    render(<NotificationBell scope="user" />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lihat notifikasi' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tandai semua' }));

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalledWith('user');
      expect(screen.getByText('Semua notifikasi sudah dibaca')).toBeInTheDocument();
    });
  });
});
