import type { PaymentReceipt } from '../types/payment';
import type {
  ThermalPrinterDevice,
  ThermalPrinterStatus,
} from '../types/thermalPrinter';
import { buildThermalReceiptPayload } from '../types/thermalPrinter';
import { printerBridgeHttpService } from './printerBridgeHttpService';

const PREFERRED_PRINTER_KEY = 'thermal_printer_preferred_device';
const normalizeBridgeMode = (value?: string): 'auto' | 'mobile' | 'always' | 'off' => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'mobile' || normalized === 'always' || normalized === 'off') {
    return normalized;
  }

  return 'auto';
};

const PRINTER_BRIDGE_MODE = normalizeBridgeMode(import.meta.env.VITE_PRINTER_BRIDGE_MODE);
let cachedBridgeAvailability = false;
let cachedBridgeStatus: ThermalPrinterStatus = {
  connected: false,
  bridgeAvailable: false,
  bridgeRunning: false,
  message: 'Bridge printer thermal belum diperiksa',
};

const shouldUseBridge = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent || '';
  const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent);
  const hasWebViewBridge = typeof (window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView !== 'undefined';

  if (PRINTER_BRIDGE_MODE === 'off') {
    return false;
  }

  if (PRINTER_BRIDGE_MODE === 'always') {
    return true;
  }

  if (PRINTER_BRIDGE_MODE === 'mobile') {
    return isMobileDevice || hasWebViewBridge;
  }

  return isMobileDevice || hasWebViewBridge;
};

const printPage = (): void => {
  window.print();
};

const printReceipt = async (receipt: PaymentReceipt): Promise<void> => {
  await printerBridgeHttpService.printReceipt(buildThermalReceiptPayload(receipt));
  cachedBridgeAvailability = true;
  cachedBridgeStatus = {
    ...cachedBridgeStatus,
    bridgeAvailable: true,
    bridgeRunning: true,
    message: 'Perintah cetak berhasil dikirim',
  };
};

const scanPrinters = async (): Promise<ThermalPrinterDevice[]> => {
  if (!shouldUseBridge()) {
    return [];
  }

  const printers = await printerBridgeHttpService.scanPrinters();
  cachedBridgeAvailability = true;
  return printers;
};

const connectPrinter = async (deviceId: string): Promise<void> => {
  if (!shouldUseBridge()) {
    return;
  }

  await printerBridgeHttpService.connectPrinter(deviceId);
  cachedBridgeAvailability = true;
};

const getStatus = async (): Promise<ThermalPrinterStatus> => {
  if (!shouldUseBridge()) {
    cachedBridgeAvailability = false;
    cachedBridgeStatus = {
      connected: false,
      bridgeAvailable: false,
      bridgeRunning: false,
      message: PRINTER_BRIDGE_MODE === 'off'
        ? 'Bridge printer dimatikan: gunakan cetak browser'
        : 'Mode desktop: gunakan cetak browser',
    };
    return cachedBridgeStatus;
  }

  try {
    const status = await printerBridgeHttpService.getStatus();
    cachedBridgeAvailability = true;
    cachedBridgeStatus = status;
    return status;
  } catch (error) {
    cachedBridgeAvailability = false;
    cachedBridgeStatus = {
      connected: false,
      bridgeAvailable: false,
      bridgeRunning: false,
      message: error instanceof Error ? error.message : 'Bridge printer thermal tidak tersedia',
    };
    return cachedBridgeStatus;
  }
};

const isAvailable = async (): Promise<boolean> => {
  if (!shouldUseBridge()) {
    cachedBridgeAvailability = false;
    return false;
  }

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
  shouldUseBridge,
  getCachedStatus: () => cachedBridgeStatus,
  isAvailable,
  printReceipt,
  printPage,
  scanPrinters,
  connectPrinter,
  getStatus,
  savePreferredPrinter,
  getPreferredPrinter,
};
