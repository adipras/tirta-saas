import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export interface CustomerLoginData {
  email: string;
  password: string;
}

export interface CustomerAuthResponse {
  token: string;
  meter_number: string;
  name: string;
}

class CustomerAuthService {
  async login(data: CustomerLoginData): Promise<CustomerAuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/customer/login`, data);
    
    if (response.data.token) {
      localStorage.setItem('customer_token', response.data.token);
      localStorage.setItem('customer_meter_number', response.data.meter_number);
      localStorage.setItem('customer_name', response.data.name);
    }
    
    return response.data;
  }

  logout() {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_meter_number');
    localStorage.removeItem('customer_name');
  }

  getToken(): string | null {
    return localStorage.getItem('customer_token');
  }

  getMeterNumber(): string | null {
    return localStorage.getItem('customer_meter_number');
  }

  getName(): string | null {
    return localStorage.getItem('customer_name');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new CustomerAuthService();
