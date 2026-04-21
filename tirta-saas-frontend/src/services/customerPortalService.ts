import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import customerAuthService from './customerAuthService';

const getAuthHeaders = () => {
  const token = customerAuthService.getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface CustomerProfil {
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
  remaining_amount: number;
  stored_penalty_amount: number;
  stored_total_amount: number;
  penalty_days: number;
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

export interface CustomerWaterPemakaian {
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
  async getProfil(): Promise<CustomerProfil> {
    const response = await axios.get(`${API_BASE_URL}/customer/profile`, getAuthHeaders());
    return response.data;
  }

  async updateProfil(data: { name: string; address: string; phone: string }): Promise<void> {
    await axios.put(`${API_BASE_URL}/customer/profile`, data, getAuthHeaders());
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await axios.put(`${API_BASE_URL}/customer/password`, data, getAuthHeaders());
  }

  async getTagihan(): Promise<CustomerInvoice[]> {
    const response = await axios.get(`${API_BASE_URL}/customer/invoices`, getAuthHeaders());
    return response.data;
  }

  async getPembayaran(): Promise<CustomerPayment[]> {
    const response = await axios.get(`${API_BASE_URL}/customer/payments`, getAuthHeaders());
    return response.data;
  }

  async getWaterPemakaian(): Promise<CustomerWaterPemakaian[]> {
    const response = await axios.get(`${API_BASE_URL}/customer/water-usage`, getAuthHeaders());
    return response.data;
  }
}

export default new CustomerPortalService();
