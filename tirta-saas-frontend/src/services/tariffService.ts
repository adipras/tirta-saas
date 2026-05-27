import { API_ENDPOINTS } from '../constants/api';
import type {
  BillSimulationResult,
  CreateProgressiveRateDto,
  CreateTariffCategoryDto,
  ProgressiveRate,
  SimulateBillDto,
  TariffCategory,
  TariffCategoryType,
  UpdateProgressiveRateDto,
  UpdateTariffCategoryDto,
} from '../types/tariff';
import { apiClient } from './apiClient';
import { asArray, asRecord, getBoolean, getNumber, getString, unwrapResponseData } from '../utils/dataTransform';

const mapTariffCategory = (raw: unknown): TariffCategory => {
  const data = asRecord(raw);

  return {
    id: getString(data.id),
    code: getString(data.code),
    name: getString(data.name),
    type: (getString(data.type, 'residential') as TariffCategoryType),
    description: getString(data.description),
    display_order: getNumber(data.display_order),
    is_active: getBoolean(data.is_active, true),
  };
};

const mapProgressiveRate = (raw: unknown): ProgressiveRate => {
  const data = asRecord(raw);
  const maxVolumeValue = data.max_volume;

  return {
    id: getString(data.id),
    category: mapTariffCategory(data.category),
    min_volume: getNumber(data.min_volume),
    max_volume:
      maxVolumeValue === null || maxVolumeValue === undefined
        ? null
        : getNumber(maxVolumeValue),
    price_per_unit: getNumber(data.price_per_unit),
    display_order: getNumber(data.display_order),
    is_active: getBoolean(data.is_active, true),
  };
};

const mapSimulationResult = (raw: unknown): BillSimulationResult => {
  const data = asRecord(raw);

  return {
    category: mapTariffCategory(data.category),
    usage_volume: getNumber(data.usage_volume),
    total_amount: getNumber(data.total_amount),
    breakdown: asArray<unknown>(data.breakdown).map((item) => {
      const breakdown = asRecord(item);

      return {
        tier_range: getString(breakdown.tier_range),
        volume: getNumber(breakdown.volume),
        price_per_unit: getNumber(breakdown.price_per_unit),
        amount: getNumber(breakdown.amount),
      };
    }),
  };
};

class TariffService {
  async getTariffCategories(type?: TariffCategoryType): Promise<TariffCategory[]> {
    const response = await apiClient.get(API_ENDPOINTS.TARIFFS.CATEGORIES, {
      params: type ? { type } : undefined,
    });

    return asArray<unknown>(unwrapResponseData(response)).map(mapTariffCategory);
  }

  async createTariffCategory(payload: CreateTariffCategoryDto): Promise<TariffCategory> {
    const response = await apiClient.post(API_ENDPOINTS.TARIFFS.CATEGORIES, payload);
    return mapTariffCategory(unwrapResponseData(response));
  }

  async updateTariffCategory(id: string, payload: UpdateTariffCategoryDto): Promise<TariffCategory> {
    const response = await apiClient.put(API_ENDPOINTS.TARIFFS.CATEGORY_DETAIL(id), payload);
    return mapTariffCategory(unwrapResponseData(response));
  }

  async deleteTariffCategory(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.TARIFFS.CATEGORY_DETAIL(id));
  }

  async getProgressiveRates(categoryId?: string): Promise<ProgressiveRate[]> {
    const response = await apiClient.get(API_ENDPOINTS.TARIFFS.PROGRESSIVE_RATES, {
      params: categoryId ? { category_id: categoryId } : undefined,
    });

    return asArray<unknown>(unwrapResponseData(response)).map(mapProgressiveRate);
  }

  async createProgressiveRate(payload: CreateProgressiveRateDto): Promise<ProgressiveRate> {
    const response = await apiClient.post(API_ENDPOINTS.TARIFFS.PROGRESSIVE_RATES, payload);
    return mapProgressiveRate(unwrapResponseData(response));
  }

  async updateProgressiveRate(id: string, payload: UpdateProgressiveRateDto): Promise<ProgressiveRate> {
    const response = await apiClient.put(API_ENDPOINTS.TARIFFS.PROGRESSIVE_RATE_DETAIL(id), payload);
    return mapProgressiveRate(unwrapResponseData(response));
  }

  async deleteProgressiveRate(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.TARIFFS.PROGRESSIVE_RATE_DETAIL(id));
  }

  async simulateBill(payload: SimulateBillDto): Promise<BillSimulationResult> {
    const response = await apiClient.post(API_ENDPOINTS.TARIFFS.SIMULATE, payload);
    return mapSimulationResult(unwrapResponseData(response));
  }
}

const tariffServiceInstance = new TariffService();

export default tariffServiceInstance;
export const tariffService = tariffServiceInstance;
