import { apiClient } from './apiClient';
import type { CustomerProfile, UpdateProfileDto, ChangePasswordDto } from '../types/customerProfile';

export const customerProfileService = {
  // Get current customer profile
  getProfile: async (): Promise<CustomerProfile> => {
    const response = await apiClient.get('/customer/profile');
    return response.data;
  },

  // Update customer profile
  updateProfile: async (data: UpdateProfileDto): Promise<CustomerProfile> => {
    const response = await apiClient.put('/customer/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordDto): Promise<void> => {
    await apiClient.post('/customer/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  },

  // Verify current password
  verifyPassword: async (password: string): Promise<boolean> => {
    const response = await apiClient.post('/customer/verify-password', { password });
    return response.data.valid;
  },
};
