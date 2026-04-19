export interface CustomerProfil {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  meterNumber?: string;
  meterLocation?: string;
  subscriptionType: {
    id: string;
    name: string;
    monthlyFee: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastPaymentDate?: string;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
