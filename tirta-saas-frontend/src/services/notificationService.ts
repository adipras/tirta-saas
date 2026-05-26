import { API_ENDPOINTS } from '../constants/api';
import { apiClient } from './apiClient';
import { asArray, asRecord, getBoolean, getNumber, getString, unwrapResponseData } from '../utils/dataTransform';

export type NotificationScope = 'user' | 'customer';

export interface NotificationItem {
  id: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface NotificationInbox {
  items: NotificationItem[];
  unreadCount: number;
}

const scopeEndpoints = {
  user: {
    list: API_ENDPOINTS.NOTIFICATIONS.USER_LIST,
    markRead: API_ENDPOINTS.NOTIFICATIONS.USER_MARK_READ,
    markAllRead: API_ENDPOINTS.NOTIFICATIONS.USER_MARK_ALL_READ,
  },
  customer: {
    list: API_ENDPOINTS.NOTIFICATIONS.CUSTOMER_LIST,
    markRead: API_ENDPOINTS.NOTIFICATIONS.CUSTOMER_MARK_READ,
    markAllRead: API_ENDPOINTS.NOTIFICATIONS.CUSTOMER_MARK_ALL_READ,
  },
} satisfies Record<
  NotificationScope,
  {
    list: string;
    markRead: (id: string) => string;
    markAllRead: string;
  }
>;

function mapNotificationItem(value: unknown): NotificationItem {
  const item = asRecord(value);

  return {
    id: getString(item.id),
    channel: getString(item.channel),
    subject: getString(item.subject),
    body: getString(item.body),
    status: getString(item.status),
    is_read: getBoolean(item.is_read),
    read_at: getString(item.read_at) || undefined,
    created_at: getString(item.created_at),
    metadata: asRecord(item.metadata),
  };
}

class NotificationService {
  async getInbox(scope: NotificationScope, limit = 10): Promise<NotificationInbox> {
    const response = await apiClient.get(scopeEndpoints[scope].list, {
      params: { limit },
    });
    const payload = asRecord(unwrapResponseData(response));

    return {
      items: asArray(payload.items).map(mapNotificationItem),
      unreadCount: getNumber(payload.unread_count),
    };
  }

  async markAsRead(scope: NotificationScope, notificationId: string): Promise<NotificationItem> {
    const response = await apiClient.patch(scopeEndpoints[scope].markRead(notificationId));
    return mapNotificationItem(unwrapResponseData(response));
  }

  async markAllAsRead(scope: NotificationScope): Promise<void> {
    await apiClient.patch(scopeEndpoints[scope].markAllRead);
  }
}

export const notificationService = new NotificationService();
