import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';
import { unwrapResponseData } from '../utils/dataTransform';
import type { Meter, CreateMeterDto, UpdateMeterDto } from '../types/meter';

const meterService = {
  async getMetersByCustomer(customerId: string): Promise<Meter[]> {
    const response = await apiClient.get(API_ENDPOINTS.CUSTOMERS.METERS(customerId));
    const data = unwrapResponseData(response);
    return (Array.isArray(data) ? data : []) as Meter[];
  },

  async createMeter(customerId: string, dto: CreateMeterDto): Promise<Meter> {
    const response = await apiClient.post(API_ENDPOINTS.CUSTOMERS.METERS(customerId), dto);
    return unwrapResponseData(response) as Meter;
  },

  async updateMeter(customerId: string, meterId: string, dto: UpdateMeterDto): Promise<Meter> {
    const response = await apiClient.patch(API_ENDPOINTS.CUSTOMERS.METER_DETAIL(customerId, meterId), dto);
    return unwrapResponseData(response) as Meter;
  },

  async deleteMeter(customerId: string, meterId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CUSTOMERS.METER_DETAIL(customerId, meterId));
  },

  async setMeterInitialReading(customerId: string, meterId: string, initialReading: number): Promise<void> {
    await apiClient.patch(
      API_ENDPOINTS.CUSTOMERS.METER_INITIAL_READING(customerId, meterId),
      { initial_reading: initialReading }
    );
  },
};

export default meterService;
