import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  BellIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, TableSkeleton, useToast } from '../../components';
import { notificationService, type NotificationInbox, type NotificationItem } from '../../services/notificationService';
import { extractApiErrorMessage } from '../../utils/apiError';

const EMPTY_INBOX: NotificationInbox = {
  items: [],
  unreadCount: 0,
};

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return '';
  }

  const diffMs = timestamp.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return formatter.format(diffDays, 'day');
  }

  return timestamp.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export default function CustomerNotificationCenter() {
  const { error: showErrorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [inbox, setInbox] = useState<NotificationInbox>(EMPTY_INBOX);
  const [error, setError] = useState<string | null>(null);

  const loadInbox = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const data = await notificationService.getInbox('customer', 50);
        setInbox(data);
        setError(null);
      } catch (err: unknown) {
        const message = extractApiErrorMessage(err, 'Gagal memuat notifikasi pelanggan.');
        setError(message);
        showErrorToast(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showErrorToast]
  );

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const visibleNotifications = useMemo(
    () => inbox.items.filter((item) => (unreadOnly ? !item.is_read : true)),
    [inbox.items, unreadOnly]
  );

  const handleMarkAsRead = async (notification: NotificationItem) => {
    if (notification.is_read) {
      return;
    }

    try {
      const updated = await notificationService.markAsRead('customer', notification.id);
      setInbox((current) => ({
        unreadCount: Math.max(current.unreadCount - 1, 0),
        items: current.items.map((item) => (item.id === updated.id ? updated : item)),
      }));
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal menandai notifikasi sebagai dibaca.');
      showErrorToast(message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead('customer');
      const readAt = new Date().toISOString();
      setInbox((current) => ({
        unreadCount: 0,
        items: current.items.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || readAt,
        })),
      }));
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal menandai semua notifikasi sebagai dibaca.');
      showErrorToast(message);
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Notifikasi"
          subtitle="Pantau update pembayaran, tagihan, dan informasi penting dari tenant Anda."
        />
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <TableSkeleton rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        subtitle="Pantau update pembayaran, tagihan, dan informasi penting dari tenant Anda."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setUnreadOnly((prev) => !prev)}
              className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
                unreadOnly
                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {unreadOnly ? 'Tampilkan semua' : 'Hanya yang belum dibaca'}
            </button>
            <button
              type="button"
              onClick={() => void loadInbox('refresh')}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Menyegarkan...' : 'Segarkan'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total notifikasi</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{inbox.items.length}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm text-blue-700">Belum dibaca</p>
          <p className="mt-2 text-2xl font-semibold text-blue-900">{inbox.unreadCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Aksi cepat</p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                Tandai seluruh inbox customer sebagai sudah dibaca.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleMarkAllAsRead()}
              disabled={inbox.unreadCount === 0 || markingAll}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {markingAll ? 'Memproses...' : 'Tandai semua'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900">Inbox notifikasi</h2>
          <p className="mt-1 text-sm text-gray-500">
            {visibleNotifications.length > 0
              ? `Menampilkan ${visibleNotifications.length} notifikasi ${unreadOnly ? 'belum dibaca' : 'terbaru'}.`
              : unreadOnly
                ? 'Tidak ada notifikasi belum dibaca.'
                : 'Belum ada notifikasi untuk ditampilkan.'}
          </p>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <BellIcon className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500">
              {unreadOnly ? 'Semua notifikasi sudah dibaca.' : 'Inbox notifikasi masih kosong.'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Update verifikasi pembayaran dan status tagihan akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleNotifications.map((notification) => {
              const invoiceId = getMetadataString(notification.metadata, 'invoice_id');
              const invoiceNumber = getMetadataString(notification.metadata, 'invoice_number');

              return (
                <article
                  key={notification.id}
                  className={`px-4 py-4 transition sm:px-6 ${notification.is_read ? 'bg-white' : 'bg-blue-50/50'}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.subject || 'Notifikasi baru'}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            notification.is_read
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {notification.is_read ? 'Sudah dibaca' : 'Baru'}
                        </span>
                        {invoiceNumber && (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            {invoiceNumber}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 whitespace-normal break-words text-sm leading-6 text-gray-600">
                        {notification.body}
                      </p>
                      <p className="mt-2 text-xs font-medium text-gray-400">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {invoiceId && (
                        <Link
                          to={`/customer/invoices/${invoiceId}`}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Lihat tagihan
                        </Link>
                      )}
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => void handleMarkAsRead(notification)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          <EnvelopeOpenIcon className="h-4 w-4" />
                          Tandai dibaca
                        </button>
                      )}
                      {notification.is_read && (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                          <CheckCircleIcon className="h-4 w-4" />
                          Sudah dibaca
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
