export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asRecord = (value: unknown): UnknownRecord =>
  isRecord(value) ? value : {};

export const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export const mapArray = <T>(
  value: unknown,
  mapper: (item: UnknownRecord, index: number) => T
): T[] =>
  asArray(value).map((item, index) => mapper(asRecord(item), index));

export const unwrapResponseData = (response: unknown): unknown => {
  const record = asRecord(response);
  return 'data' in record ? record.data : response;
};

export const getString = (value: unknown, fallback: string = ''): string =>
  typeof value === 'string' ? value : fallback;

export const getNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

export const getBoolean = (value: unknown, fallback: boolean = false): boolean =>
  typeof value === 'boolean' ? value : fallback;
