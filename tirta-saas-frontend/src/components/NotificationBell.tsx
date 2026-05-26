import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationService, type NotificationInbox, type NotificationItem, type NotificationScope } from '../services/notificationService';

interface NotificationBellProps {
  scope: NotificationScope;
}

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

const NotificationBell = ({ scope }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<NotificationInbox>(EMPTY_INBOX);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadInbox = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!silent) {
        setLoading(true);
      }

      try {
        const nextInbox = await notificationService.getInbox(scope);
        setInbox(nextInbox);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat notifikasi.');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [scope]
  );

  useEffect(() => {
    void loadInbox({ silent: true });

    const intervalId = window.setInterval(() => {
      void loadInbox({ silent: true });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [loadInbox]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const unreadBadge = useMemo(() => {
    if (inbox.unreadCount < 1) {
      return null;
    }

    return inbox.unreadCount > 9 ? '9+' : String(inbox.unreadCount);
  }, [inbox.unreadCount]);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadInbox();
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (notification.is_read) {
      return;
    }

    try {
      const updatedNotification = await notificationService.markAsRead(scope, notification.id);
      setInbox((currentInbox) => ({
        unreadCount: Math.max(currentInbox.unreadCount - 1, 0),
        items: currentInbox.items.map((item) => (item.id === updatedNotification.id ? updatedNotification : item)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui notifikasi.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(scope);
      const readAt = new Date().toISOString();
      setInbox((currentInbox) => ({
        unreadCount: 0,
        items: currentInbox.items.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || readAt,
        })),
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menandai semua notifikasi.');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          void handleToggle();
        }}
        className="relative rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        aria-label="Lihat notifikasi"
        title="Lihat notifikasi"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        {unreadBadge && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifikasi</p>
              <p className="text-xs text-gray-500">
                {inbox.unreadCount > 0 ? `${inbox.unreadCount} belum dibaca` : 'Semua notifikasi sudah dibaca'}
              </p>
            </div>
            {inbox.unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  void handleMarkAllAsRead();
                }}
                className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
              >
                Tandai semua
              </button>
            )}
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-8 text-sm text-gray-500">
                Memuat notifikasi...
              </div>
            ) : inbox.items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Belum ada notifikasi untuk ditampilkan.
              </div>
            ) : (
              inbox.items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    void handleNotificationClick(notification);
                  }}
                  className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50 ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {notification.subject || 'Notifikasi baru'}
                      </p>
                      <p className="mt-1 whitespace-normal break-words text-xs leading-5 text-gray-600">
                        {notification.body}
                      </p>
                    </div>
                    {!notification.is_read && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-gray-400">{formatRelativeTime(notification.created_at)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
