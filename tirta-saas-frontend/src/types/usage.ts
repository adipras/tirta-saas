
export interface WaterPemakaian {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    customerId: string;
    meterNumber?: string;
    address?: string;
  };
  usageMonth: string;
  meterStart: number;
  meterEnd: number;
  usageM3: number;
  amountCalculated: number;
  meterId?: string;
  readingSessionId?: string;
  recordedBy?: string;
  photoUrl?: string;
  readingMethod?: 'manual' | 'automatic' | 'estimated';
  notes?: string;
  isAnomaly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaterPemakaianDto {
  customerId: string;
  meterId?: string;
  usageMonth: string;
  meterEnd: number;
  notes?: string;
}

export interface UpdateWaterPemakaianDto {
  meterEnd?: number;
  notes?: string;
}

export interface WaterPemakaianFormData {
  customerId: string;
  usageMonth: string;
  meterEnd: string;
  notes: string;
}

export interface WaterPemakaianFilters {
  customerId?: string;
  usageMonth?: string;
  startMonth?: string;
  endMonth?: string;
  isAnomaly?: boolean;
}

export interface PemakaianHistory {
  month: string;
  meterStart: number;
  meterEnd: number;
  usageM3: number;
  amount: number;
}

export interface PemakaianTrend {
  month: string;
  usage: number;
}

export interface BulkImportRow {
  customerId: string;
  customerName?: string;
  meterNumber?: string;
  meterEnd: number;
  usageMonth: string;
  notes?: string;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

// Legacy support
export interface Pemakaian {
  id: string;
  customerId: string;
  meterReading: number;
  readingDate: string;
  createdAt: string;
}
