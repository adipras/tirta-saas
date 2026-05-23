import { API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';
import { asRecord, getNumber, getString, unwrapResponseData } from '../utils/dataTransform';

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

function normalizeTenantSettings(raw: unknown): TenantSettings {
  const data = asRecord(unwrapResponseData(raw));

  return {
    company_name: getString(data.company_name),
    address: getString(data.address),
    phone: getString(data.phone),
    email: getString(data.email),
    website: getString(data.website),
    logo_url: getString(data.logo_url),
    logo_display_url: resolveTenantAssetUrl(getString(data.logo_url)),
    primary_color: getString(data.primary_color),
    secondary_color: getString(data.secondary_color),
    invoice_generation_day: getNumber(data.invoice_generation_day, 5),
    invoice_due_day: getNumber(data.invoice_due_day, 25),
    operating_hours: getString(data.operating_hours),
    service_area: getString(data.service_area),
    timezone: getString(data.timezone, 'Asia/Jakarta'),
    language: getString(data.language, 'id'),
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

    const data = asRecord(unwrapResponseData(response));
    const logoUrl = getString(data.logo_url);

    return {
      logo_url: logoUrl,
      logo_display_url: resolveTenantAssetUrl(logoUrl),
    };
  }
}

export const tenantSettingsService = new TenantSettingsService();
