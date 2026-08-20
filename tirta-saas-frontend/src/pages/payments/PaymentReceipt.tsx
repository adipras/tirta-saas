import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { PageHeader, useToast } from '../../components';
import { paymentService } from '../../services/paymentService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import type { PaymentReceipt as PaymentReceiptType } from '../../types/payment';
import type { ThermalPrinterDevice, ThermalPrinterStatus } from '../../types/thermalPrinter';
import { buildPaymentReceiptViewModel } from '../../utils/paymentReceipt';
import { PRINTER_BRIDGE_BASE_URL } from '../../constants/api';
import {
  ArrowPathIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const PaymentReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [receipt, setReceipt] = useState<PaymentReceiptType | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printerBusy, setPrinterBusy] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<ThermalPrinterStatus>({
    connected: false,
    message: 'Belum terhubung',
  });
  const [availablePrinters, setAvailablePrinters] = useState<ThermalPrinterDevice[]>([]);
  const [, setPreferredPrinter] = useState<ThermalPrinterDevice | null>(null);
  const [bridgeChecked, setBridgeChecked] = useState(false);
  const [bridgeAvailable, setBridgeAvailable] = useState(false);
  const [bridgeWarnDismissed, setBridgeWarnDismissed] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchReceipt = useCallback(async (paymentId: string) => {
    try {
      setLoading(true);
      const data = await paymentService.getReceipt(paymentId);
      setReceipt(data);
    } catch {
      try {
        const generated = await paymentService.generateReceipt(paymentId);
        setReceipt(generated);
      } catch {
        toast.error('Gagal memuat struk pembayaran');
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receipt ? `Struk_${receipt.receiptNumber}` : 'Struk',
  });

  const refreshPrinterStatus = useCallback(async () => {
    try {
      setPrinterBusy(true);
      const status = await thermalPrinterService.getStatus();
      setPrinterStatus(status);
      setBridgeAvailable(status.bridgeAvailable !== false && status.bridgeRunning !== false);
      setBridgeChecked(true);
    } catch {
      setPrinterStatus({
        connected: false,
        bridgeAvailable: false,
        bridgeRunning: false,
        message: 'Gagal membaca status printer',
      });
      setBridgeAvailable(false);
      setBridgeChecked(true);
    } finally {
      setPrinterBusy(false);
    }
  }, []);

  const probeThermalBridge = useCallback(async () => {
    const available = await thermalPrinterService.isAvailable();
    setBridgeAvailable(available);
    setBridgeChecked(true);

    if (available) {
      await refreshPrinterStatus();
      return;
    }

    setPrinterStatus({
      connected: false,
      bridgeAvailable: false,
      bridgeRunning: false,
      message: 'Bridge printer thermal tidak aktif di perangkat ini',
    });
  }, [refreshPrinterStatus]);

  useEffect(() => {
    if (id) {
      void fetchReceipt(id);
    }
  }, [fetchReceipt, id]);

  useEffect(() => {
    setPreferredPrinter(thermalPrinterService.getPreferredPrinter());
    void probeThermalBridge();
  }, [probeThermalBridge]);

  const handleScanPrinters = async () => {
    const available = await thermalPrinterService.isAvailable();
    setBridgeAvailable(available);
    setBridgeChecked(true);

    if (!available) {
      toast.warning('Bridge printer thermal belum aktif. Buka aplikasi Bridge Printer Thermal lalu coba lagi.');
      return;
    }

    try {
      setPrinterBusy(true);
      const devices = await thermalPrinterService.scanPrinters();
      setAvailablePrinters(devices);
      if (devices.length === 0) {
        toast.error('Tidak ada printer thermal yang terdeteksi');
      } else {
        toast.success(`${devices.length} printer thermal ditemukan`);
      }
    } catch {
      toast.error('Gagal mencari printer thermal');
    } finally {
      setPrinterBusy(false);
    }
  };

  const handleConnectPrinter = async (device: ThermalPrinterDevice) => {
    const available = await thermalPrinterService.isAvailable();
    setBridgeAvailable(available);
    setBridgeChecked(true);

    if (!available) {
      toast.warning('Bridge printer thermal belum aktif. Koneksi printer tidak dapat dilakukan.');
      return;
    }

    try {
      setPrinterBusy(true);
      await thermalPrinterService.connectPrinter(device.id);
      thermalPrinterService.savePreferredPrinter(device);
      setPreferredPrinter(device);
      toast.success(`Printer ${device.name} berhasil dihubungkan`);
      await refreshPrinterStatus();
    } catch {
      toast.error(`Gagal menghubungkan printer ${device.name}`);
    } finally {
      setPrinterBusy(false);
    }
  };

  const handleReceiptPrint = async () => {
    if (!receipt) return;

    const thermalModeActive = await thermalPrinterService.isAvailable();
    setBridgeAvailable(thermalModeActive);
    setBridgeChecked(true);

    if (thermalModeActive) {
      try {
        setPrinting(true);
        await thermalPrinterService.printReceipt(receipt);
        toast.success('Perintah cetak ke printer thermal berhasil dikirim');
        await refreshPrinterStatus();
        return;
      } catch {
        toast.error('Gagal mencetak ke printer thermal, gunakan cetak browser sebagai fallback');
      } finally {
        setPrinting(false);
      }
    }

    toast.info('Bridge printer thermal tidak aktif. Menggunakan cetak browser sebagai fallback.');
    handlePrint();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-100" />
        <div className="card p-6 max-w-sm mx-auto space-y-4">
          <div className="h-16 w-32 animate-pulse rounded-xl bg-surface-100 mx-auto" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-surface-100" />
          <div className="h-4 w-3/4 animate-pulse rounded-lg bg-surface-100" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-surface-100" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-surface-100" />
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-surface-600">Struk pembayaran tidak ditemukan</p>
          <button
            onClick={() => navigate('/admin/payments')}
            className="mt-4 btn-primary"
          >
            Kembali ke Pembayaran
          </button>
        </div>
      </div>
    );
  }

  const receiptView = buildPaymentReceiptViewModel(receipt);
  const thermalBridgeDetected = bridgeAvailable;
  const thermalModeActive = bridgeAvailable;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Struk Pembayaran"
        subtitle={`No. Struk ${receipt.receiptNumber}`}
        actions={
          <div className="flex items-center gap-2">
            {thermalModeActive && (
              <button
                onClick={handlePrint}
                className="btn-secondary"
              >
                Cetak Browser
              </button>
            )}
            <button
              onClick={handleReceiptPrint}
              disabled={printing}
              className="btn-primary"
            >
              {printing ? (
                <span className="inline-flex items-center gap-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Mengirim...
                </span>
              ) : thermalModeActive ? (
                <span className="inline-flex items-center gap-1.5">
                  <PrinterIcon className="h-4 w-4" />
                  Cetak Thermal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <PrinterIcon className="h-4 w-4" />
                  Cetak Struk
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* Bridge Warning */}
      {bridgeChecked && !thermalBridgeDetected && !bridgeWarnDismissed && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mt-0.5 flex-shrink-0" />
          <p className="flex-1 text-[13px] leading-snug text-warning-900">
            <span className="font-semibold">Bridge printer thermal belum aktif.</span>{' '}
            Jalankan aplikasi Bridge di Android ({PRINTER_BRIDGE_BASE_URL}). Cetak browser tetap tersedia.
          </p>
          <button
            onClick={() => setBridgeWarnDismissed(true)}
            className="flex-shrink-0 text-warning-600 hover:text-warning-800 transition-colors"
            aria-label="Tutup"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Printer Status Card */}
      {thermalBridgeDetected && (
        <div className="card px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-surface-700">Printer Thermal:</span>
              <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${printerStatus.connected ? 'text-success-600' : 'text-warning-600'}`}>
                <span className={`w-2 h-2 rounded-full ${printerStatus.connected ? 'bg-success-500' : 'bg-warning-400'}`} />
                {printerStatus.connected
                  ? (printerStatus.printerName || 'Terhubung')
                  : 'Belum terhubung'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void refreshPrinterStatus()}
                disabled={printerBusy}
                className="btn-secondary text-[12px]"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 mr-1 ${printerBusy ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => void handleScanPrinters()}
                disabled={printerBusy}
                className="btn-primary text-[12px]"
              >
                Cari Printer
              </button>
            </div>

            {availablePrinters.length > 0 && (
              <div className="w-full border-t border-surface-100 pt-3 mt-1 space-y-2">
                <p className="text-[12px] font-medium text-surface-400 uppercase tracking-wide">Hasil Pencarian</p>
                {availablePrinters.map((device) => (
                  <div key={device.id} className="flex items-center justify-between rounded-xl border border-surface-100 bg-surface-50/50 px-3 py-2">
                    <div>
                      <p className="text-[13px] font-medium text-surface-900">{device.name}</p>
                      {device.address && <p className="text-[12px] text-surface-400">{device.address}</p>}
                    </div>
                    <button
                      onClick={() => void handleConnectPrinter(device)}
                      disabled={printerBusy}
                      className="btn-primary text-[12px]"
                    >
                      Hubungkan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Preview */}
      <div ref={receiptRef} className="bg-white rounded-xl shadow-card p-5 max-w-sm mx-auto font-mono text-xs">

        {/* Header — nama PDAM */}
        <div className="text-center pb-2 border-b border-dashed border-surface-300">
          {receiptView.tenantLogoUrl && (
            <img
              src={receiptView.tenantLogoUrl}
              alt={receiptView.tenantName}
              className="h-16 w-auto mx-auto mb-1 object-contain"
            />
          )}
          <p className="font-bold text-sm uppercase tracking-wide text-surface-900">{receiptView.tenantName}</p>
          {receiptView.tenantPhone && <p className="text-surface-500 mt-0.5">Telp: {receiptView.tenantPhone}</p>}
          <div className="mt-2 text-[11px] text-surface-500 space-y-0.5 text-left">
            <div className="flex gap-2">
              <span className="w-16 flex-shrink-0">No.</span>
              <span className="font-semibold text-surface-800">: {receipt.receiptNumber}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-16 flex-shrink-0">Tgl. Bayar</span>
              <span>: {receiptView.paymentDateLabel}</span>
            </div>
          </div>
        </div>

        {/* Informasi pelanggan */}
        <div className="py-3 border-b border-dashed border-surface-300 space-y-0.5">
          <div className="flex justify-between gap-2">
            <span className="text-surface-400">Pelanggan</span>
            <span className="text-right font-medium text-surface-900">{receipt.customerDetails.name}</span>
          </div>
          {receipt.customerDetails.meterNumber && (
            <div className="flex justify-between gap-2">
              <span className="text-surface-400">No. Meter</span>
              <span className="text-right text-surface-900">{receipt.customerDetails.meterNumber}</span>
            </div>
          )}
          {receiptView.compactAddress && (
            <p className="text-surface-500 mt-1">{receiptView.compactAddress}</p>
          )}
        </div>

        {/* Informasi tagihan */}
        <div className="py-3 border-b border-dashed border-surface-300 space-y-0.5">
          <div className="flex justify-between gap-2">
            <span className="text-surface-400">No. Tagihan</span>
            <span className="text-right text-surface-900">{receipt.invoiceDetails.invoiceNumber}</span>
          </div>
          {receiptView.invoiceTypeLabel && (
            <div className="flex justify-between gap-2">
              <span className="text-surface-400">Tipe</span>
              <span className="text-right text-surface-900">{receiptView.invoiceTypeLabel}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span className="text-surface-400">Metode</span>
            <span className="text-right text-surface-900">{receiptView.paymentMethodLabel}</span>
          </div>
          {receipt.payment.referenceNumber && (
            <div className="flex justify-between gap-2">
              <span className="text-surface-400">Ref.</span>
              <span className="text-right text-surface-900">{receipt.payment.referenceNumber}</span>
            </div>
          )}
          {receiptView.showUsageSection && (
            <div className="mt-1 pt-1 space-y-0.5">
              <p className="font-medium text-surface-900">
                Tagihan Air{receiptView.usageMonthLabel ? ` — ${receiptView.usageMonthLabel}` : ''}
              </p>
              <div className="flex justify-between">
                <span className="text-surface-500">{receiptView.usageM3} m³</span>
                <span className="font-medium text-surface-900">{receiptView.subTotalLabel}</span>
              </div>
            </div>
          )}
          {receipt.invoiceDetails.invoiceType === 'manual' && receipt.invoiceDetails.items && receipt.invoiceDetails.items.length > 0 && (
            <div className="mt-1 pt-1 space-y-1">
              <p className="font-medium text-surface-900">Rincian Tagihan Manual</p>
              {receipt.invoiceDetails.items.map((item, index) => (
                <div key={`${item.description}-${index}`} className="flex justify-between gap-2 text-[11px]">
                  <span className="text-surface-500">
                    {item.description} ({item.quantity} x {new Intl.NumberFormat('id-ID').format(item.unitPrice)})
                  </span>
                  <span className="font-medium text-surface-900">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.amount)}
                  </span>
                </div>
              ))}
              {receipt.invoiceDetails.notes && (
                <p className="pt-1 text-surface-500">{receipt.invoiceDetails.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Ringkasan biaya */}
        <div className="py-3 border-b border-dashed border-surface-300 space-y-0.5">
          {receiptView.showPenaltyAmount && (
            <div className="flex justify-between text-danger-600">
              <span>Denda</span>
              <span>{receiptView.penaltyAmountLabel}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1">
            <span>Total</span>
            <span>{receiptView.totalAmountLabel}</span>
          </div>
          {receiptView.showTotalPaidBefore && (
            <div className="flex justify-between text-surface-400">
              <span>Terbayar</span>
              <span>{receiptView.totalPaidBeforeLabel}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm">
            <span>Bayar ({receiptView.paymentMethodLabel})</span>
            <span className="text-success-600">{receiptView.paymentAmountLabel}</span>
          </div>
        </div>

        <div className="py-3 border-b border-dashed border-surface-300 space-y-1">
          <div className="flex justify-between items-start gap-2">
            <span className="font-semibold text-surface-600">Status Tagihan</span>
            <span className={`text-right font-bold ${receiptView.invoiceStatusColorClass}`}>
              {receiptView.invoiceStatusLabel}
            </span>
          </div>
          {receiptView.isPartialPayment && (
            <div className="flex justify-between items-start gap-2">
              <span className="font-medium text-surface-500">Sisa tagihan belum terbayar</span>
              <span className={`text-right font-bold ${receiptView.invoiceStatusTextColorClass}`}>
                {receiptView.remainingAmountLabel}
              </span>
            </div>
          )}
        </div>

        {/* Info rekening + QR QRIS */}
        {(receiptView.hasBankInfo || receiptView.qrisImageUrl) && (
          <div className="py-3 border-b border-dashed border-surface-300">
            {receiptView.hasBankInfo && (
              <div className="text-center mb-2 space-y-0.5">
                {receiptView.bankName && receiptView.bankAccountNo && (
                  <p className="font-semibold text-surface-900">
                    {receiptView.bankName} — {receiptView.bankAccountNo}
                  </p>
                )}
                {receiptView.bankName && !receiptView.bankAccountNo && (
                  <p className="font-semibold text-surface-900">{receiptView.bankName}</p>
                )}
                {!receiptView.bankName && receiptView.bankAccountNo && (
                  <p className="font-semibold text-surface-900">{receiptView.bankAccountNo}</p>
                )}
                {receiptView.bankAccountName && (
                  <p className="text-surface-500">a.n. {receiptView.bankAccountName}</p>
                )}
              </div>
            )}
            {receiptView.qrisImageUrl && (
              <div className="text-center">
                <img
                  src={receiptView.qrisImageUrl}
                  alt={receiptView.qrisLabel}
                  className="w-full max-w-[160px] mx-auto block"
                />
                <p className="text-surface-400 mt-1">{receiptView.qrisLabel}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 text-center text-surface-500 space-y-0.5">
          <p>{receiptView.footerText}</p>
          {receiptView.isPartialPayment && (
            <p className="text-warning-700">Masih ada sisa tagihan.</p>
          )}
          {receiptView.compactNotes && <p className="text-surface-400 italic">{receiptView.compactNotes}</p>}
          <p className="text-surface-300 mt-1">Dicetak: {receiptView.printedAtLabel}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
