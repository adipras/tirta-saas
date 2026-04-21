import { PRINTER_BRIDGE_BASE_URL } from '../constants/api';
import type {
  ThermalPrinterDevice,
  ThermalPrinterStatus,
  ThermalReceiptPayload,
} from '../types/thermalPrinter';

interface PrinterBridgeOperationResponse {
  success: boolean;
  message?: string;
  status?: ThermalPrinterStatus;
}

interface PrinterBridgeStatusResponse extends ThermalPrinterStatus {
  success: boolean;
}

interface PrinterBridgePrintersResponse {
  success: boolean;
  printers?: ThermalPrinterDevice[];
  status?: ThermalPrinterStatus;
}

const DEFAULT_TIMEOUT_MS = 1500;

const request = async <T>(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${PRINTER_BRIDGE_BASE_URL}${path}`, {
      ...init,
      mode: 'cors',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });

    const payload = (await response.json()) as T & { success?: boolean; message?: string };
    if (!response.ok) {
      throw new Error(payload.message || 'Bridge printer thermal mengembalikan error');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Bridge printer thermal tidak merespons');
    }

    throw error instanceof Error
      ? error
      : new Error('Bridge printer thermal tidak tersedia');
  } finally {
    window.clearTimeout(timeout);
  }
};

const getStatus = async (timeoutMs?: number): Promise<ThermalPrinterStatus> => {
  const response = await request<PrinterBridgeStatusResponse>('/status', {}, timeoutMs);
  return {
    connected: response.connected,
    printerName: response.printerName,
    printerAddress: response.printerAddress,
    message: response.message,
    bridgeAvailable: true,
    bridgeRunning: response.bridgeRunning,
    preferredPrinterId: response.preferredPrinterId,
    preferredPrinterName: response.preferredPrinterName,
    serverUrl: response.serverUrl,
  };
};

const scanPrinters = async (): Promise<ThermalPrinterDevice[]> => {
  const response = await request<PrinterBridgePrintersResponse>('/printers', {}, 3000);
  return response.printers || [];
};

const connectPrinter = async (deviceId: string): Promise<ThermalPrinterStatus> => {
  const response = await request<PrinterBridgeOperationResponse>(
    '/connect',
    {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    },
    8000,
  );

  if (!response.success) {
    throw new Error(response.message || 'Gagal menghubungkan printer');
  }

  return response.status || { connected: false, bridgeAvailable: true };
};

const printReceipt = async (payload: ThermalReceiptPayload): Promise<ThermalPrinterStatus> => {
  const response = await request<PrinterBridgeOperationResponse>(
    '/print',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    10000,
  );

  if (!response.success) {
    throw new Error(response.message || 'Gagal mencetak ke printer thermal');
  }

  return response.status || { connected: false, bridgeAvailable: true };
};

const ping = async (): Promise<boolean> => {
  try {
    await getStatus(DEFAULT_TIMEOUT_MS);
    return true;
  } catch {
    return false;
  }
};

export const printerBridgeHttpService = {
  getBaseUrl: () => PRINTER_BRIDGE_BASE_URL,
  getStatus,
  scanPrinters,
  connectPrinter,
  printReceipt,
  ping,
};
