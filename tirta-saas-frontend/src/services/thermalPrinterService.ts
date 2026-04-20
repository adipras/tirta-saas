import type { PaymentReceipt } from '../types/payment';
import type {
  ThermalPrinterDevice,
  ThermalPrinterStatus,
} from '../types/thermalPrinter';
import { buildThermalReceiptPayload } from '../types/thermalPrinter';

const PREFERRED_PRINTER_KEY = 'thermal_printer_preferred_device';

const getAndroidBridge = () => window.AndroidPrinterBridge;

const parseBridgePayload = <T>(payload: unknown, fallback: T): T => {
  if (payload == null) {
    return fallback;
  }

  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as T;
    } catch {
      return fallback;
    }
  }

  return payload as T;
};

const canUseNativeThermalPrinter = (): boolean => {
  const bridge = getAndroidBridge();
  if (!bridge?.printReceipt) {
    return false;
  }

  if (typeof bridge.isAvailable === 'function') {
    try {
      return bridge.isAvailable() === true;
    } catch {
      return true;
    }
  }

  return true;
};

const hasNativeBridge = (): boolean => {
  const bridge = getAndroidBridge();
  return Boolean(bridge?.printReceipt || bridge?.scanPrinters || bridge?.connectPrinter || bridge?.getStatus);
};

const printReceipt = async (receipt: PaymentReceipt): Promise<void> => {
  const bridge = getAndroidBridge();
  if (!bridge?.printReceipt) {
    throw new Error('Printer thermal native bridge tidak tersedia');
  }

  const payload = JSON.stringify(buildThermalReceiptPayload(receipt));
  await bridge.printReceipt(payload);
};

const scanPrinters = async (): Promise<ThermalPrinterDevice[]> => {
  const bridge = getAndroidBridge();
  if (!bridge?.scanPrinters) {
    return [];
  }

  const result = await bridge.scanPrinters();
  return parseBridgePayload<ThermalPrinterDevice[]>(result, []);
};

const connectPrinter = async (deviceId: string): Promise<void> => {
  const bridge = getAndroidBridge();
  if (!bridge?.connectPrinter) {
    throw new Error('Bridge koneksi printer tidak tersedia');
  }

  await bridge.connectPrinter(deviceId);
};

const getStatus = async (): Promise<ThermalPrinterStatus> => {
  const bridge = getAndroidBridge();
  if (!bridge?.getStatus) {
    return {
      connected: false,
      message: 'Status printer belum tersedia',
    };
  }

  const result = await bridge.getStatus();
  return parseBridgePayload<ThermalPrinterStatus>(result, {
    connected: false,
  });
};

const savePreferredPrinter = (device: ThermalPrinterDevice) => {
  localStorage.setItem(PREFERRED_PRINTER_KEY, JSON.stringify(device));
};

const getPreferredPrinter = (): ThermalPrinterDevice | null => {
  const raw = localStorage.getItem(PREFERRED_PRINTER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ThermalPrinterDevice;
  } catch {
    return null;
  }
};

export const thermalPrinterService = {
  hasBridge: hasNativeBridge,
  isAvailable: canUseNativeThermalPrinter,
  printReceipt,
  scanPrinters,
  connectPrinter,
  getStatus,
  savePreferredPrinter,
  getPreferredPrinter,
};
