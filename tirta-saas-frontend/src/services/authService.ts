import { API_ENDPOINTS } from '../constants/api';
import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'customer';
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer' | 'platform_owner' | 'tenant_admin' | 'meter_reader' | 'finance' | 'service';
  tenant_id?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'tirta_access_token';
  private readonly REFRESH_TOKEN_KEY = 'tirta_refresh_token';
  private readonly USER_KEY = 'tirta_user';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      console.log('Login response:', response);
      
      // Handle different response formats
      const authData: AuthResponse = {
        token: response.token || response.access_token || response.accessToken,
        refreshToken: response.refreshToken || response.refresh_token || '',
        user: response.user || {
          id: response.id || response.userId || '',
          email: response.email || credentials.email,
          name: response.name || response.username || 'Admin User',
          role: response.role || 'admin',
          tenant_id: response.tenant_id || response.tenantId
        }
      };
      
      this.setTokens(authData.token, authData.refreshToken);
      this.setUser(authData.user);
      
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {});
      }
    } catch (error) {
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
        refreshToken
      });

      const { token, refreshToken: newRefreshToken } = response;
      this.setTokens(token, newRefreshToken);
      
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

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

export const authService = new AuthService();