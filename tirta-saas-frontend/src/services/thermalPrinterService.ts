import type { PaymentReceipt } from '../types/payment';
import type {
  ThermalPrinterDevice,
  ThermalPrinterStatus,
} from '../types/thermalPrinter';
import { buildThermalReceiptPayload } from '../types/thermalPrinter';
import { printerBridgeHttpService } from './printerBridgeHttpService';

const PREFERRED_PRINTER_KEY = 'thermal_printer_preferred_device';
let cachedBridgeAvailability = false;

const printReceipt = async (receipt: PaymentReceipt): Promise<void> => {
  await printerBridgeHttpService.printReceipt(buildThermalReceiptPayload(receipt));
  cachedBridgeAvailability = true;
};

const scanPrinters = async (): Promise<ThermalPrinterDevice[]> => {
  const printers = await printerBridgeHttpService.scanPrinters();
  cachedBridgeAvailability = true;
  return printers;
};

const connectPrinter = async (deviceId: string): Promise<void> => {
  await printerBridgeHttpService.connectPrinter(deviceId);
  cachedBridgeAvailability = true;
};

const getStatus = async (): Promise<ThermalPrinterStatus> => {
  try {
    const status = await printerBridgeHttpService.getStatus();
    cachedBridgeAvailability = true;
    return status;
  } catch (error) {
    cachedBridgeAvailability = false;
    return {
      connected: false,
      bridgeAvailable: false,
      bridgeRunning: false,
      message: error instanceof Error ? error.message : 'Bridge printer thermal tidak tersedia',
    };
  }
};

const isAvailable = async (): Promise<boolean> => {
  const available = await printerBridgeHttpService.ping();
  cachedBridgeAvailability = available;
  return available;
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
  hasBridge: () => cachedBridgeAvailability,
  isAvailable,
  printReceipt,
  scanPrinters,
  connectPrinter,
  getStatus,
  savePreferredPrinter,
  getPreferredPrinter,
};
