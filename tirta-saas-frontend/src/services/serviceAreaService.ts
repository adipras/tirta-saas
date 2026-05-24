import { apiClient } from './apiClient';
import type { CreateServiceAreaDto, ServiceArea, ServiceAreaType, UpdateServiceAreaDto } from '../types/serviceArea';
import { API_ENDPOINTS } from '../constants/api';
import { asArray, asRecord, getBoolean, getNumber, getString, unwrapResponseData } from '../utils/dataTransform';

const SERVICE_AREA_ENDPOINT = API_ENDPOINTS.SERVICE_AREAS;

function mapServiceArea(raw: unknown, includeRelations = true): ServiceArea {
  const data = asRecord(raw);
  const parentRaw = includeRelations && data.parent ? mapServiceArea(data.parent, false) : null;
  const childrenRaw = includeRelations ? asArray<unknown>(data.children).map((item) => mapServiceArea(item, false)) : [];

  return {
    id: getString(data.id),
    code: getString(data.code),
    name: getString(data.name),
    type: (getString(data.type) || 'Zone') as ServiceAreaType,
    description: getString(data.description),
    population: getNumber(data.population),
    customer_count: getNumber(data.customer_count),
    coverage_area: getString(data.coverage_area),
    is_active: getBoolean(data.is_active),
    parent: parentRaw,
    children: childrenRaw,
  };
}

class ServiceAreaService {
  async getServiceAreas(type?: ServiceAreaType): Promise<ServiceArea[]> {
    const response = await apiClient.get(SERVICE_AREA_ENDPOINT.LIST, {
      params: type ? { type } : undefined,
    });
    const items = asArray<unknown>(unwrapResponseData(response));
    return items.map((item) => mapServiceArea(item));
  }

  async createServiceArea(data: CreateServiceAreaDto): Promise<ServiceArea> {
    const response = await apiClient.post(SERVICE_AREA_ENDPOINT.CREATE, data);
    return mapServiceArea(unwrapResponseData(response));
  }

  async updateServiceArea(id: string, data: UpdateServiceAreaDto): Promise<ServiceArea> {
    const response = await apiClient.put(SERVICE_AREA_ENDPOINT.UPDATE(id), data);
    return mapServiceArea(unwrapResponseData(response));
  }

  async deleteServiceArea(id: string): Promise<void> {
    await apiClient.delete(SERVICE_AREA_ENDPOINT.DELETE(id));
  }
}

const serviceAreaServiceInstance = new ServiceAreaService();
export default serviceAreaServiceInstance;
export const serviceAreaService = serviceAreaServiceInstance;
