import { apiClient } from './apiClient';
import type { CustomerProfil, UpdateProfilDto, ChangePasswordDto } from '../types/customerProfile';
import { asRecord, getBoolean, unwrapResponseData } from '../utils/dataTransform';

export const customerProfilService = {
  // Get current customer profile
  getProfil: async (): Promise<CustomerProfil> => {
    const response = await apiClient.get('/customer/profile');
    return unwrapResponseData(response) as CustomerProfil;
  },

  // Update customer profile
  updateProfil: async (data: UpdateProfilDto): Promise<void> => {
    await apiClient.put('/customer/profile', data);
  },

  // Change password
  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await apiClient.put('/customer/password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  },

  // Verify current password
  verifyPassword: async (password: string): Promise<boolean> => {
    const response = await apiClient.post('/customer/verify-password', { password });
    return getBoolean(asRecord(unwrapResponseData(response)).valid);
  },
};
