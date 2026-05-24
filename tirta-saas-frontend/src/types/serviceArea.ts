export type ServiceAreaType = 'RT' | 'RW' | 'Blok' | 'Zone';

export interface ServiceArea {
  id: string;
  code: string;
  name: string;
  type: ServiceAreaType;
  description: string;
  population: number;
  customer_count: number;
  coverage_area: string;
  is_active: boolean;
  parent?: ServiceArea | null;
  children?: ServiceArea[];
}

export interface CreateServiceAreaDto {
  code: string;
  name: string;
  type: ServiceAreaType;
  parent_id?: string;
  description?: string;
  population?: number;
  coverage_area?: string;
}

export interface UpdateServiceAreaDto {
  name: string;
  description?: string;
  population?: number;
  coverage_area?: string;
  is_active?: boolean;
}
