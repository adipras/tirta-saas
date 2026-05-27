import { API_ENDPOINTS } from '../constants/api';
import type {
  CreateNotificationTemplateDto,
  NotificationTemplate,
  NotificationTemplateFilters,
  SendNotificationDto,
  UpdateNotificationTemplateDto,
} from '../types/notificationAdmin';
import { apiClient } from './apiClient';
import {
  asArray,
  asRecord,
  getBoolean,
  getString,
  unwrapResponseData,
} from '../utils/dataTransform';

const mapTemplate = (raw: unknown): NotificationTemplate => {
  const data = asRecord(raw);

  return {
    id: getString(data.id),
    tenant_id: getString(data.tenant_id),
    code: getString(data.code),
    name: getString(data.name),
    description: getString(data.description),
    channel: getString(data.channel, 'IN_APP') as NotificationTemplate['channel'],
    subject: getString(data.subject),
    body: getString(data.body),
    html_body: getString(data.html_body),
    variables: asArray<string>(data.variables).filter((item) => typeof item === 'string'),
    is_active: getBoolean(data.is_active, true),
    language: getString(data.language, 'id') as NotificationTemplate['language'],
    created_at: getString(data.created_at),
    updated_at: getString(data.updated_at),
  };
};

class NotificationAdminService {
  async getNotificationTemplates(
    filters: NotificationTemplateFilters = {}
  ): Promise<NotificationTemplate[]> {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.TENANT.TEMPLATES, {
      params: filters,
    });

    return asArray(unwrapResponseData(response)).map(mapTemplate);
  }

  async createNotificationTemplate(
    payload: CreateNotificationTemplateDto
  ): Promise<NotificationTemplate> {
    const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.TENANT.TEMPLATES, payload);
    return mapTemplate(unwrapResponseData(response));
  }

  async updateNotificationTemplate(
    id: string,
    payload: UpdateNotificationTemplateDto
  ): Promise<NotificationTemplate> {
    const response = await apiClient.put(
      API_ENDPOINTS.NOTIFICATIONS.TENANT.TEMPLATE_DETAIL(id),
      payload
    );
    return mapTemplate(unwrapResponseData(response));
  }

  async deleteNotificationTemplate(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.TENANT.TEMPLATE_DETAIL(id));
  }

  async sendNotification(payload: SendNotificationDto): Promise<void> {
    await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.TENANT.SEND, payload);
  }
}

const notificationAdminServiceInstance = new NotificationAdminService();

export default notificationAdminServiceInstance;
export const notificationAdminService = notificationAdminServiceInstance;
