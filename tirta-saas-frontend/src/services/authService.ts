import { API_ENDPOINTS } from '../constants/api';
import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer' | 'platform_owner' | 'tenant_admin' | 'meter_reader' | 'finance' | 'service';
  tenant_id?: string;
  tenant_name?: string | null;
  tenant_logo_url?: string | null;
  trial_ends_at?: string | null;
  tenant_status?: string | null;
}

class AuthService {
  private readonly TOKEN_KEY = 'tirta_access_token';
  private readonly REFRESH_TOKEN_KEY = 'tirta_refresh_token';
  private readonly USER_KEY = 'tirta_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      // Handle different response formats
      const authData: AuthResponse = {
        token: response.token || response.access_token || response.accessToken,
        refreshToken: response.refreshToken || response.refresh_token || '',
        user: response.user || {
          id: response.id || response.userId || '',
          email: response.email || credentials.email,
          name: response.name || response.username || 'Pengguna',
          role: response.role || 'admin',
          tenant_id: response.tenant_id || response.tenantId,
          tenant_name: response.tenant_name || null,
          tenant_logo_url: response.tenant_logo_url || null,
          trial_ends_at: response.trial_ends_at || null,
          tenant_status: response.tenant_status || null,
        }
      };
      
      this.setTokens(authData.token, authData.refreshToken);
      this.setUser(authData.user);
      
      return authData;
    } catch {
      throw new Error('Login gagal. Periksa kembali email dan kata sandi Anda.');
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
      }
    } catch  {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
        refresh_token: refreshToken
      });

      const token = response.token || response.access_token || response.accessToken;
      const newRefreshToken = response.refreshToken || response.refresh_token || refreshToken;

      this.setTokens(token, newRefreshToken);

      if (response.user) {
        this.setUser(response.user);
      }
      
      return token;
    } catch {
      this.clearAuth();
      throw new Error('Token refresh failed');
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  hasRole(role: string | string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    const userRole = user.role?.toUpperCase();
    
    if (Array.isArray(role)) {
      return role.some(r => r.toUpperCase() === userRole);
    }
    
    return role.toUpperCase() === userRole;
  }
  
  isPlatformOwner(): boolean {
    return this.hasRole('PLATFORM_OWNER');
  }
  
  isTenantAdmin(): boolean {
    return this.hasRole(['ADMIN', 'TENANT_ADMIN']);
  }

  getCurrentUser(): User | null {
    return this.getUser();
  }

  private setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /** Update stored auth after tenant setup — replaces the JWT with the new one (which includes tenant_id) */
  updateAuth(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  updateStoredUser(updates: Partial<User>): User | null {
    const currentUser = this.getUser();
    if (!currentUser) {
      return null;
    }

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

export const authService = new AuthService();
