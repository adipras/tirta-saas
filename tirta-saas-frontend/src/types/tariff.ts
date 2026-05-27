export type TariffCategoryType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'social'
  | 'government';

export interface TariffCategory {
  id: string;
  code: string;
  name: string;
  type: TariffCategoryType;
  description: string;
  display_order: number;
  is_active: boolean;
}

export interface ProgressiveRate {
  id: string;
  category: TariffCategory;
  min_volume: number;
  max_volume: number | null;
  price_per_unit: number;
  display_order: number;
  is_active: boolean;
}

export interface BillSimulationBreakdown {
  tier_range: string;
  volume: number;
  price_per_unit: number;
  amount: number;
}

export interface BillSimulationResult {
  category: TariffCategory;
  usage_volume: number;
  total_amount: number;
  breakdown: BillSimulationBreakdown[];
}

export interface CreateTariffCategoryDto {
  code: string;
  name: string;
  type: TariffCategoryType;
  description?: string;
}

export interface UpdateTariffCategoryDto {
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface CreateProgressiveRateDto {
  category_id: string;
  min_volume: number;
  max_volume?: number;
  price_per_unit: number;
  display_order?: number;
}

export interface UpdateProgressiveRateDto {
  min_volume: number;
  max_volume?: number;
  price_per_unit: number;
  display_order?: number;
  is_active?: boolean;
}

export interface SimulateBillDto {
  category_id: string;
  usage_volume: number;
}
