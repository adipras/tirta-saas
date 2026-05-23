import { API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';
import { asArray, asRecord, getBoolean, getString, unwrapResponseData } from '../utils/dataTransform';

const STATIC_BASE = API_ORIGIN;

export interface QRCode {
  id: string;
  type: 'QRIS' | 'DANA' | 'GOPAY' | 'OVO' | 'SHOPEEPAY';
  image_url: string;
  is_primary: boolean;
  is_active: boolean;
  notes?: string;
  /** Full URL for displaying image (prefixed with backend base) */
  imageDisplayUrl?: string;
}

function withImageUrl(qr: unknown): QRCode {
  const data = asRecord(qr);
  const imageUrl = getString(data.image_url);

  return {
    ...(data as unknown as QRCode),
    image_url: imageUrl,
    imageDisplayUrl: imageUrl ? `${STATIC_BASE}/${imageUrl.replace(/^\/+/, '')}` : '',
    id: getString(data.id),
    type: getString(data.type) as QRCode['type'],
    is_primary: getBoolean(data.is_primary),
    is_active: getBoolean(data.is_active),
    notes: getString(data.notes),
  };
}

class QRCodeService {
  async getQRCodes(): Promise<QRCode[]> {
    const res = await apiClient.get('/payment-methods/qr-codes');
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

    const res = await apiClient.post('/payment-methods/qr-codes', form, {
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

    const res = await apiClient.put(`/payment-methods/qr-codes/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return withImageUrl(unwrapResponseData(res));
  }

  async deleteQRCode(id: string): Promise<void> {
    await apiClient.delete(`/payment-methods/qr-codes/${id}`);
  }

  async setPrimaryQRCode(id: string): Promise<void> {
    await apiClient.post(`/payment-methods/qr-codes/${id}/set-primary`, {});
  }
}

export const qrCodeService = new QRCodeService();
