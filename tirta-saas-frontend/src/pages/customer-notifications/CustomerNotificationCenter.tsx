import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  BellIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, DashboardStatCard, useToast } from '../../components';
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

  const hasActiveFilters = unreadOnly;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-100" />
          ))}
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUnreadOnly((prev) => !prev)}
              className={unreadOnly ? 'btn-primary' : 'btn-secondary'}
            >
              {unreadOnly ? (
                <>
                  <XMarkIcon className="h-4 w-4" />
                  Tampilkan semua
                </>
              ) : (
                <>
                  <BellIcon className="h-4 w-4" />
                  Hanya yang belum dibaca
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => void loadInbox('refresh')}
              disabled={refreshing}
              className="btn-secondary disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Menyegarkan...' : 'Segarkan'}
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardStatCard
          title="Total Notifikasi"
          value={inbox.items.length.toLocaleString('id-ID')}
          subtitle="Jumlah seluruh notifikasi yang diterima."
          icon={BellIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Belum Dibaca"
          value={inbox.unreadCount.toLocaleString('id-ID')}
          subtitle="Notifikasi yang perlu Anda tinjau."
          icon={EnvelopeOpenIcon}
          tone={inbox.unreadCount > 0 ? 'yellow' : 'green'}
        />
        <div className="rounded-xl border border-surface-200/80 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-surface-500">Aksi Cepat</p>
              <p className="mt-2 text-[13px] leading-relaxed text-surface-400">
                Tandai seluruh inbox sebagai sudah dibaca.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleMarkAllAsRead()}
            disabled={inbox.unreadCount === 0 || markingAll}
            className="btn-primary mt-4 w-full disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            {markingAll ? 'Memproses...' : 'Tandai semua'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-700" role="alert">
          {error}
        </div>
      )}

      {/* Notification List */}
      <section className="rounded-xl border border-surface-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-surface-900">Inbox Notifikasi</h2>
            <p className="mt-1 text-[13px] text-surface-400">
              {visibleNotifications.length > 0
                ? `Menampilkan ${visibleNotifications.length} notifikasi ${unreadOnly ? 'belum dibaca' : 'terbaru'}.`
                : unreadOnly
                  ? 'Tidak ada notifikasi belum dibaca.'
                  : 'Belum ada notifikasi untuk ditampilkan.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => setUnreadOnly(false)}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
            >
              <XMarkIcon className="h-3 w-3" />
              Reset filter
            </button>
          )}
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="rounded-xl bg-surface-50 p-8 text-center">
            <BellIcon className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm font-medium text-surface-600">
              {unreadOnly ? 'Semua notifikasi sudah dibaca.' : 'Inbox notifikasi masih kosong.'}
            </p>
            <p className="mt-1 text-[13px] text-surface-400">
              Update verifikasi pembayaran dan status tagihan akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleNotifications.map((notification) => {
              const invoiceId = getMetadataString(notification.metadata, 'invoice_id');
              const invoiceNumber = getMetadataString(notification.metadata, 'invoice_number');

              return (
                <article
                  key={notification.id}
                  className={`group flex flex-col gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:items-start sm:justify-between ${
                    notification.is_read
                      ? 'border-surface-100 bg-surface-50/50 hover:border-surface-200 hover:bg-white'
                      : 'border-brand-200 bg-brand-50/50 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-surface-900">
                        {notification.subject || 'Notifikasi baru'}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          notification.is_read
                            ? 'bg-surface-50 text-surface-500 ring-surface-200'
                            : 'bg-brand-50 text-brand-700 ring-brand-200'
                        }`}
                      >
                        {notification.is_read ? 'Dibaca' : 'Baru'}
                      </span>
                      {invoiceNumber && (
                        <span className="inline-flex items-center rounded-full bg-info-50 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-info-200 text-info-700">
                          {invoiceNumber}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-surface-500">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-[12px] font-medium text-surface-400">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {invoiceId && (
                      <Link
                        to={`/customer/invoices/${invoiceId}`}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        Lihat tagihan
                      </Link>
                    )}
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAsRead(notification)}
                        className="btn-primary !px-3 !py-1.5 text-xs"
                      >
                        <EnvelopeOpenIcon className="h-3.5 w-3.5" />
                        Tandai dibaca
                      </button>
                    )}
                    {notification.is_read && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-success-200 text-success-700">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Dibaca
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
