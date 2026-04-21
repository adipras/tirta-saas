import { API_ENDPOINTS } from '../constants/api';
import { apiClient } from './apiClient';

export interface TenantRegistrationPayload {
  organization_name: string;
  village_code: string;
  address: string;
  phone: string;
  email: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  admin_password: string;
  logo?: File | null;
}

export interface TenantRegistrationResponse {
  status: string;
  message: string;
  tenant?: {
    id: string;
    name: string;
    email: string;
    status: string;
    trial_ends_at?: string | null;
    admin_email: string;
  };
}

class TenantRegistrationService {
  async register(data: TenantRegistrationPayload): Promise<TenantRegistrationResponse> {
    const formData = new FormData();
    formData.append('organization_name', data.organization_name);
    formData.append('village_code', data.village_code);
    formData.append('address', data.address);
    formData.append('phone', data.phone);
    formData.append('email', data.email);
    formData.append('admin_name', data.admin_name);
    formData.append('admin_email', data.admin_email);
    formData.append('admin_phone', data.admin_phone);
    formData.append('admin_password', data.admin_password);

    if (data.logo) {
      formData.append('logo', data.logo);
    }

    return apiClient.post<TenantRegistrationResponse>(API_ENDPOINTS.PUBLIC.REGISTER, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const tenantRegistrationService = new TenantRegistrationService();
