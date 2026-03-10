import { apiClient } from './apiClient';
import type { QRCode } from './qrCodeService';

const STATIC_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api').replace('/api', '');

function withImageUrl(qr: any): QRCode {
  return {
    ...qr,
    imageDisplayUrl: qr.image_url ? `${STATIC_BASE}/${qr.image_url}` : '',
  };
}

class PlatformQRCodeService {
  async getQRCodes(): Promise<QRCode[]> {
    const res = await apiClient.get('/platform/payment-methods/qr-codes');
    const list = (res as any)?.data || [];
    return list.map(withImageUrl);
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
    return withImageUrl((res as any).data);
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
    return withImageUrl((res as any).data);
  }

  async deleteQRCode(id: string): Promise<void> {
    await apiClient.delete(`/platform/payment-methods/qr-codes/${id}`);
  }

  async setPrimaryQRCode(id: string): Promise<void> {
    await apiClient.post(`/platform/payment-methods/qr-codes/${id}/set-primary`, {});
  }
}

export const platformQrCodeService = new PlatformQRCodeService();
