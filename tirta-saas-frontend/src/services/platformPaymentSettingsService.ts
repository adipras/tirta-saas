import { API_ORIGIN } from '../constants/api';
import { apiClient } from './apiClient';
import { asArray, asRecord, getString } from '../utils/dataTransform';

const STATIC_BASE = `${API_ORIGIN}/`;

function resolveImageUrl(imageUrl?: string): string {
  if (!imageUrl) {
    return '';
  }

  try {
    return new URL(imageUrl, STATIC_BASE).toString();
  } catch {
    return imageUrl;
  }
}

export interface BankAccountInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface PlatformQRCodeInfo {
  id: string;
  type: string;
  image_url: string;
  is_primary: boolean;
  is_active: boolean;
  notes?: string;
  imageDisplayUrl: string;
}

export interface PlatformPaymentSettings {
  bank_accounts: BankAccountInfo[];
  qr_codes: PlatformQRCodeInfo[];
  payment_methods: string[];
  company_name?: string;
  phone?: string;
  email?: string;
}

class PlatformPaymentSettingsService {
  async getPlatformPaymentSettings(): Promise<PlatformPaymentSettings> {
    const response = await apiClient.get('/public/platform-payment-settings');
    const settings = asRecord(response);
    const qrCodes = asArray(settings.qr_codes).map((qr) => {
      const code = asRecord(qr);

      return {
        ...(code as unknown as PlatformQRCodeInfo),
        imageDisplayUrl: resolveImageUrl(getString(code.image_url)),
      };
    });

    return {
      ...(settings as unknown as PlatformPaymentSettings),
      bank_accounts: asArray<BankAccountInfo>(settings.bank_accounts),
      qr_codes: qrCodes,
      payment_methods:
        asArray<string>(settings.payment_methods).length > 0
          ? asArray<string>(settings.payment_methods)
          : ['bank_transfer'],
    };
  }
}

export const platformPaymentSettingsService = new PlatformPaymentSettingsService();
