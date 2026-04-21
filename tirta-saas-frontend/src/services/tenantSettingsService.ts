import { API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';

const STATIC_BASE = API_ORIGIN;

export interface TenantSettings {
  company_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  logo_display_url: string;
  primary_color: string;
  secondary_color: string;
  invoice_generation_day: number;
  invoice_due_day: number;
  operating_hours: string;
  service_area: string;
  timezone: string;
  language: string;
}

export interface TenantSettingsUpdatePayload {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  operating_hours?: string;
  service_area?: string;
  primary_color?: string;
  secondary_color?: string;
  invoice_generation_day?: number;
  invoice_due_day?: number;
  invoice_due_days?: number;
  grace_period_days?: number;
}

export function resolveTenantAssetUrl(path?: string | null): string {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return path.startsWith('/') ? `${STATIC_BASE}${path}` : `${STATIC_BASE}/${path}`;
}

function normalizeTenantSettings(raw: any): TenantSettings {
  const data = raw?.data || raw || {};

  return {
    company_name: data.company_name || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    logo_url: data.logo_url || '',
    logo_display_url: resolveTenantAssetUrl(data.logo_url),
    primary_color: data.primary_color || '',
    secondary_color: data.secondary_color || '',
    invoice_generation_day: Number(data.invoice_generation_day ?? 5),
    invoice_due_day: Number(data.invoice_due_day ?? 25),
    operating_hours: data.operating_hours || '',
    service_area: data.service_area || '',
    timezone: data.timezone || 'Asia/Jakarta',
    language: data.language || 'id',
  };
}

class TenantSettingsService {
  async getTenantSettings(): Promise<TenantSettings> {
    const response = await apiClient.get('/tenant/settings');
    return normalizeTenantSettings(response);
  }

  async updateTenantSettings(payload: TenantSettingsUpdatePayload): Promise<TenantSettings> {
    const response = await apiClient.put('/tenant/settings', payload);
    return normalizeTenantSettings(response);
  }

  async uploadTenantLogo(file: File): Promise<{ logo_url: string; logo_display_url: string }> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post('/tenant/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const logoUrl = response?.data?.logo_url || response?.logo_url || '';

    return {
      logo_url: logoUrl,
      logo_display_url: resolveTenantAssetUrl(logoUrl),
    };
  }
}

export const tenantSettingsService = new TenantSettingsService();
