import axios from 'axios';
import customerAuthService from './customerAuthService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const getAuthHeaders = () => {
  const token = customerAuthService.getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface CustomerProfile {
  id: string;
  meter_number: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  subscription: {
    id: string;
    name: string;
    monthly_fee: number;
  };
  is_active: boolean;
  created_at: string;
}

export interface CustomerInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  usage_month: string;
  usage_year: number;
  previous_reading: number;
  current_reading: number;
  usage_amount: number;
  water_charge: number;
  subscription_fee: number;
  penalty_amount: number;
  sub_total: number;
  total_amount: number;
  total_paid: number;
  payment_status: string;
  is_paid: boolean;
  due_date: string;
  paid_date?: string;
  created_at: string;
}

export interface CustomerPayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  created_at: string;
  invoice?: {
    invoice_number: string;
    usage_month: string;
    usage_year: number;
  };
}

export interface CustomerWaterUsage {
  id: string;
  customer_id: string;
  usage_month: string;
  usage_year: number;
  previous_reading: number;
  current_reading: number;
  usage_amount: number;
  reading_date: string;
  created_at: string;
}

class CustomerPortalService {
  async getProfile(): Promise<CustomerProfile> {
    const response = await axios.get(`${API_URL}/api/customer/profile`, getAuthHeaders());
    return response.data;
  }

  async updateProfile(data: { name: string; address: string; phone: string }): Promise<void> {
    await axios.put(`${API_URL}/api/customer/profile`, data, getAuthHeaders());
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await axios.put(`${API_URL}/api/customer/password`, data, getAuthHeaders());
  }

  async getInvoices(): Promise<CustomerInvoice[]> {
    const response = await axios.get(`${API_URL}/api/customer/invoices`, getAuthHeaders());
    return response.data;
  }

  async getPayments(): Promise<CustomerPayment[]> {
    const response = await axios.get(`${API_URL}/api/customer/payments`, getAuthHeaders());
    return response.data;
  }

  async getWaterUsage(): Promise<CustomerWaterUsage[]> {
    const response = await axios.get(`${API_URL}/api/customer/water-usage`, getAuthHeaders());
    return response.data;
  }
}

export default new CustomerPortalService();
