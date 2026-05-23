import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../constants/api';
import { authService } from './authService';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  response?: AxiosResponse;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyApiPayload = any;

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string | null) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant context if available
        const user = authService.getUser();
        if (user && user.tenant_id) {
          config.headers['X-Tenant-ID'] = user.tenant_id;
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (this.shouldAttemptTokenRefresh(error) && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await authService.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            authService.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private shouldAttemptTokenRefresh(error: AxiosError<{ error?: string; message?: string }>): boolean {
    if (error.response?.status !== 401 || !error.config) {
      return false;
    }

    const authErrorMessage = String(
      error.response?.data?.error || error.response?.data?.message || ''
    ).toLowerCase();

    if (!authErrorMessage) {
      return false;
    }

    return [
      'authorization header missing or invalid',
      'token tidak valid',
      'gagal membaca klaim token',
      'invalid user_id in token',
      'invalid tenant_id in token',
      'invalid role in token',
      'invalid user_id format',
      'invalid tenant_id format',
    ].some((message) => authErrorMessage.includes(message));
  }

  private processQueue(error: unknown, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private handleError(error: unknown): ApiError {
    if (error && typeof error === 'object') {
      const axiosErr = error as AxiosError<{ error?: string; message?: string; code?: string }>;
      if (axiosErr.response) {
        const { status, data } = axiosErr.response;
        return {
          message: data?.error || data?.message || 'Terjadi kesalahan',
          code: data?.code,
          status,
          response: axiosErr.response,
        };
      } else if (axiosErr.request) {
        return {
          message: 'Tidak ada respons dari server. Periksa koneksi internet Anda.',
          code: 'NETWORK_ERROR',
        };
      } else if ((error as Error).message) {
        return {
          message: (error as Error).message,
          code: 'UNKNOWN_ERROR',
        };
      }
    }
    return {
      message: 'Terjadi kesalahan yang tidak terduga',
      code: 'UNKNOWN_ERROR',
    };
  }

  async get<T = LegacyApiPayload>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = LegacyApiPayload>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = LegacyApiPayload>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = LegacyApiPayload>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = LegacyApiPayload>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
