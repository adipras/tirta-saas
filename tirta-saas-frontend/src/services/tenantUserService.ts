import { apiClient } from './apiClient';

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTenantUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  tenant_id?: string;
}

export interface UpdateTenantUserRequest {
  name?: string;
  role?: string;
}

export interface RoleOption {
  value: string;
  label: string;
}

class TenantUserService {
  private readonly BASE_URL = '/tenant-users';

  async getTenantUsers(tenantId?: string): Promise<TenantUser[]> {
    const params = tenantId ? { tenant_id: tenantId } : {};
    const response = await apiClient.get(this.BASE_URL, { params });
    return response;
  }

  async createTenantUser(data: CreateTenantUserRequest): Promise<TenantUser> {
    const response = await apiClient.post(this.BASE_URL, data);
    return response;
  }

  async updateTenantUser(id: string, data: UpdateTenantUserRequest): Promise<TenantUser> {
    const response = await apiClient.put(`${this.BASE_URL}/${id}`, data);
    return response;
  }

  async deleteTenantUser(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${id}`);
  }

  async getAvailableRoles(): Promise<RoleOption[]> {
    const response = await apiClient.get(`${this.BASE_URL}/roles`);
    return response;
  }

  // Helper to generate random password
  generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}

export const tenantUserService = new TenantUserService();
