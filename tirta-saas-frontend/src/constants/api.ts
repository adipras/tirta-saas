const DEFAULT_API_HOST = 'localhost';
const DEFAULT_API_PORT = '8081';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function normalizeApiUrl(value?: string): string {
  return value?.trim().replace(/\/+$/, '') || '';
}

function normalizeOrigin(value?: string): string {
  return normalizeApiUrl(value);
}

function isLocalHostname(hostname?: string): boolean {
  return !!hostname && LOCAL_HOSTNAMES.has(hostname.toLowerCase());
}

function resolveDefaultApiOrigin(): string {
  const configuredLocalOrigin = normalizeOrigin(import.meta.env.VITE_API_LOCAL_ORIGIN);
  const configuredPublicOrigin = normalizeOrigin(import.meta.env.VITE_API_PUBLIC_ORIGIN);

  if (typeof window === 'undefined') {
    return configuredLocalOrigin || `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}`;
  }

  const hostname = window.location.hostname || DEFAULT_API_HOST;
  if (isLocalHostname(hostname)) {
    return configuredLocalOrigin || `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}`;
  }

  return configuredPublicOrigin || `http://${hostname}:${DEFAULT_API_PORT}`;
}

function resolveApiOrigin(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/api$/, '');
}

const configuredApiBaseUrl = normalizeApiUrl(import.meta.env.VITE_API_BASE_URL);
const shouldUseAutoApiBaseUrl = !configuredApiBaseUrl || configuredApiBaseUrl.toLowerCase() === 'auto';

export const API_BASE_URL = shouldUseAutoApiBaseUrl
  ? `${resolveDefaultApiOrigin()}/api`
  : configuredApiBaseUrl;
export const API_ORIGIN = resolveApiOrigin(API_BASE_URL);
export const PRINTER_BRIDGE_BASE_URL =
  normalizeApiUrl(import.meta.env.VITE_PRINTER_BRIDGE_URL) || 'http://127.0.0.1:3000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER_ACCOUNT: '/auth/register-account',
  },
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    DETAIL: (id: string) => `/customers/${id}`,
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
    ACTIVATE: (id: string) => `/customers/${id}/activate`,
    DEACTIVATE: (id: string) => `/customers/${id}/deactivate`,
    SUSPEND: (id: string) => `/customers/${id}/suspend`,
    STATS: '/customers/stats',
    EXPORT: '/customers/export',
    BULK_IMPORT: '/customers/bulk-import',
    BULK_UPDATE_STATUS: '/customers/bulk-update-status',
    SEARCH: '/customers/search',
    ASSIGN_METER: (id: string) => `/customers/${id}/assign-meter`,
  },
  SUBSCRIPTION_TYPES: {
    LIST: '/subscription-types',
    CREATE: '/subscription-types',
    DETAIL: (id: string) => `/subscription-types/${id}`,
    UPDATE: (id: string) => `/subscription-types/${id}`,
    DELETE: (id: string) => `/subscription-types/${id}`,
    STATS: '/subscription-types/stats',
  },
  INVOICES: {
    LIST: '/invoices',
    CREATE: '/invoices',
    DETAIL: (id: string) => `/invoices/${id}`,
    UPDATE: (id: string) => `/invoices/${id}`,
    DELETE: (id: string) => `/invoices/${id}`,
    GENERATE: '/invoices/generate-monthly',
    GENERATE_BULK: '/invoices/bulk-generate',
    SEND: (id: string) => `/invoices/${id}/send`,
    VOID: (id: string) => `/invoices/${id}/void`,
    PDF: (id: string) => `/invoices/${id}/pdf`,
  },
  PAYMENTS: {
    LIST: '/payments',
    CREATE: '/payments',
    GET: '/payments/:id',
    UPDATE: '/payments/:id',
    DELETE: '/payments/:id',
    BY_INVOICE: '/payments/invoice/:invoiceId',
    OUTSTANDING_INVOICES: '/invoices/outstanding',
    VOID: '/payments/:id/void',
    GENERATE_RECEIPT: '/payments/:id/receipt',
    GET_RECEIPT: '/payments/:id/receipt',
    EXPORT: '/payments/export',
  },
  WATER_USAGE: {
    LIST: '/water-usage',
    CREATE: '/water-usage',
    DETAIL: (id: string) => `/water-usage/${id}`,
    UPDATE: (id: string) => `/water-usage/${id}`,
    DELETE: (id: string) => `/water-usage/${id}`,
    BULK_IMPORT: '/water-usage/bulk-import',
    BY_CUSTOMER: (customerId: string) => `/water-usage/customer/${customerId}`,
  },
  WATER_RATES: {
    LIST: '/water-rates',
    CREATE: '/water-rates',
    DETAIL: (id: string) => `/water-rates/${id}`,
    UPDATE: (id: string) => `/water-rates/${id}`,
    DELETE: (id: string) => `/water-rates/${id}`,
    CURRENT: '/water-rates/current',
  },
  REPORTS: {
    REVENUE: '/reports/revenue',
    CUSTOMERS: '/reports/customers',
    USAGE: '/reports/usage',
    PAYMENTS: '/reports/payments',
    OUTSTANDING: '/reports/outstanding',
    EXPORT: '/reports/export',
  },
  PLATFORM: {
    TENANTS: '/platform/tenants',
    TENANT_STATS: '/platform/tenants/stats',
    PENDING_TENANTS: '/platform/tenants/pending',
    TENANT_DETAIL: (id: string) => `/platform/tenants/${id}`,
    APPROVE_TENANT: (id: string) => `/platform/tenants/${id}/approve`,
    REJECT_TENANT: (id: string) => `/platform/tenants/${id}/reject`,
    SUSPEND_TENANT: (id: string) => `/platform/tenants/${id}/suspend`,
    ACTIVATE_TENANT: (id: string) => `/platform/tenants/${id}/activate`,
    PAYMENT_METHODS: {
      BANK_ACCOUNTS: '/platform/payment-methods/bank-accounts',
      BANK_ACCOUNT_DETAIL: (id: string) => `/platform/payment-methods/bank-accounts/${id}`,
      BANK_ACCOUNT_SET_PRIMARY: (id: string) => `/platform/payment-methods/bank-accounts/${id}/set-primary`,
      QR_CODES: '/platform/payment-methods/qr-codes',
      QR_CODE_DETAIL: (id: string) => `/platform/payment-methods/qr-codes/${id}`,
      QR_CODE_SET_PRIMARY: (id: string) => `/platform/payment-methods/qr-codes/${id}/set-primary`,
    },
  },
  PUBLIC: {
    REGISTER: '/public/register',
    SUBSCRIPTION_PLANS: '/public/subscription-plans',
  },
  SETUP: {
    TENANT: '/setup/tenant',
  },
};
