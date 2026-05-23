import { API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';
import type { QRCode } from './qrCodeService';
import { asArray, asRecord, getBoolean, getString, unwrapResponseData } from '../utils/dataTransform';

const STATIC_BASE = API_ORIGIN;

function withImageUrl(qr: unknown): QRCode {
  const data = asRecord(qr);
  const imageUrl = getString(data.image_url);

  return {
    ...(data as unknown as QRCode),
    id: getString(data.id),
    type: getString(data.type) as QRCode['type'],
    image_url: imageUrl,
    is_primary: getBoolean(data.is_primary),
    is_active: getBoolean(data.is_active),
    notes: getString(data.notes),
    imageDisplayUrl: imageUrl ? `${STATIC_BASE}/${imageUrl.replace(/^\/+/, '')}` : '',
  };
}

class PlatformQRCodeService {
  async getQRCodes(): Promise<QRCode[]> {
    const res = await apiClient.get('/platform/payment-methods/qr-codes');
    return asArray(unwrapResponseData(res)).map(withImageUrl);
  }

  async createQRCode(data: {
    type: string;
    is_primary: boolean;
    is_active: boolean;
    notes?: string;
    image?: File;
  }): Promise<QRCode> {
    const form = new FormData();
    form.append('type', data.type);
    form.append('is_primary', String(data.is_primary));
    form.append('is_active', String(data.is_active));
    if (data.notes) form.append('notes', data.notes);
    if (data.image) form.append('image', data.image);

    const res = await apiClient.post('/platform/payment-methods/qr-codes', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return withImageUrl(unwrapResponseData(res));
  }

  async updateQRCode(id: string, data: {
    type: string;
    is_primary: boolean;
    is_active: boolean;
    notes?: string;
    image?: File;
  }): Promise<QRCode> {
    const form = new FormData();
    form.append('type', data.type);
    form.append('is_primary', String(data.is_primary));
    form.append('is_active', String(data.is_active));
    if (data.notes) form.append('notes', data.notes);
    if (data.image) form.append('image', data.image);

    const res = await apiClient.put(`/platform/payment-methods/qr-codes/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return withImageUrl(unwrapResponseData(res));
  }

  async deleteQRCode(id: string): Promise<void> {
    await apiClient.delete(`/platform/payment-methods/qr-codes/${id}`);
  }

  async setPrimaryQRCode(id: string): Promise<void> {
    await apiClient.post(`/platform/payment-methods/qr-codes/${id}/set-primary`, {});
  }
}

export const platformQrCodeService = new PlatformQRCodeService();
