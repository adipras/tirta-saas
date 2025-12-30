import { apiClient } from './apiClient';

export interface BankAccountInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface PlatformPaymentSettings {
  bank_accounts: BankAccountInfo[];
  payment_methods: string[];
  company_name?: string;
  phone?: string;
  email?: string;
}

class PlatformPaymentSettingsService {
  async getPlatformPaymentSettings(): Promise<PlatformPaymentSettings> {
    const response = await apiClient.get('/public/platform-payment-settings');
    return response;
  }
}

export const platformPaymentSettingsService = new PlatformPaymentSettingsService();
