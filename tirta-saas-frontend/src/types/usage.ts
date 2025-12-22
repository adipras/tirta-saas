
export interface WaterUsage {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    customerId: string;
    meterNumber?: string;
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

export interface CreateWaterUsageDto {
  customerId: string;
  usageMonth: string;
  meterEnd: number;
  notes?: string;
}

export interface UpdateWaterUsageDto {
  meterEnd?: number;
  notes?: string;
}

export interface WaterUsageFormData {
  customerId: string;
  usageMonth: string;
  meterEnd: string;
  notes: string;
}

export interface WaterUsageFilters {
  customerId?: string;
  usageMonth?: string;
  startMonth?: string;
  endMonth?: string;
  isAnomaly?: boolean;
}

export interface UsageHistory {
  month: string;
  meterStart: number;
  meterEnd: number;
  usageM3: number;
  amount: number;
}

export interface UsageTrend {
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
export interface Usage {
  id: string;
  customerId: string;
  meterReading: number;
  readingDate: string;
  createdAt: string;
}
