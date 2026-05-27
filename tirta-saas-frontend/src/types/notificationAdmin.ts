export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'WHATSAPP';
export type NotificationLanguage = 'id' | 'en';
export type NotificationRecipientType = 'USER' | 'CUSTOMER';

export interface NotificationTemplate {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  html_body: string;
  variables: string[];
  is_active: boolean;
  language: NotificationLanguage;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplateFilters {
  channel?: NotificationChannel;
  include_inactive?: boolean;
}

export interface CreateNotificationTemplateDto {
  code: string;
  name: string;
  description?: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  html_body?: string;
  variables?: string[];
  language?: NotificationLanguage;
}

export interface UpdateNotificationTemplateDto {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  html_body?: string;
  variables?: string[];
  is_active?: boolean;
  language?: NotificationLanguage;
}

export interface SendNotificationDto {
  template_code?: string;
  channel: NotificationChannel;
  recipient_type: NotificationRecipientType;
  recipient_id: string;
  variables?: Record<string, string | number | boolean>;
  custom_subject?: string;
  custom_body?: string;
}
