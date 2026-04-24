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
    } catch (error) {
      console.error('Failed to fetch receipt:', error);

      try {
        const generated = await paymentService.generateReceipt(paymentId);
        setReceipt(generated);
      } catch (genError) {
        console.error('Failed to generate receipt:', genError);
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
    } catch (error) {
      console.error('Failed to get thermal printer status:', error);
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
    } catch (error) {
      console.error('Failed to scan thermal printers:', error);
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
    } catch (error) {
      console.error('Failed to connect thermal printer:', error);
      toast.error(`Gagal menghubungkan printer ${device.name}`);
    } finally {
      setPrinterBusy(false);
    }
  };

  const handleReceiptPrint = async () => {
    if (!receipt) {
      return;
    }

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
      } catch (error) {
        console.error('Failed to print using thermal bridge:', error);
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
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat struk pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Struk pembayaran tidak ditemukan</p>
          <button
            onClick={() => navigate('/admin/payments')}
            className="mt-4 text-blue-600 hover:text-blue-800"
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
    <div className="p-6">
      <PageHeader
        title="Struk Pembayaran"
        subtitle={`No. Struk ${receipt.receiptNumber}`}
        actions={
          <div className="flex items-center gap-2">
            {thermalModeActive && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cetak Browser
              </button>
            )}
            <button
              onClick={handleReceiptPrint}
              disabled={printing}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {printing
                ? 'Mengirim...'
                : thermalModeActive
                  ? 'Cetak Thermal'
                  : 'Cetak Struk'}
            </button>
          </div>
        }
      />

      {bridgeChecked && !thermalBridgeDetected && !bridgeWarnDismissed && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-3 py-2.5 max-w-4xl mx-auto mb-4">
          <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
          <p className="flex-1 text-xs leading-snug">
            <span className="font-semibold">Bridge printer thermal belum aktif.</span>{' '}
            Jalankan aplikasi Bridge di Android ({PRINTER_BRIDGE_BASE_URL}). Cetak browser tetap tersedia.
          </p>
          <button
            onClick={() => setBridgeWarnDismissed(true)}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
            aria-label="Tutup"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {thermalBridgeDetected && (
        <div className="bg-white rounded-lg shadow px-4 py-3 max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Printer Thermal:</span>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${printerStatus.connected ? 'text-green-600' : 'text-amber-600'}`}>
              <span className={`w-2 h-2 rounded-full ${printerStatus.connected ? 'bg-green-500' : 'bg-amber-400'}`} />
              {printerStatus.connected
                ? (printerStatus.printerName || 'Terhubung')
                : 'Belum terhubung'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void refreshPrinterStatus()}
              disabled={printerBusy}
              className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => void handleScanPrinters()}
              disabled={printerBusy}
              className="px-3 py-1.5 text-xs border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50"
            >
              Cari Printer
            </button>
          </div>

          {availablePrinters.length > 0 && (
            <div className="w-full border-t pt-3 mt-1 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hasil Pencarian</p>
              {availablePrinters.map((device) => (
                <div key={device.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{device.name}</p>
                    {device.address && <p className="text-xs text-gray-500">{device.address}</p>}
                  </div>
                  <button
                    onClick={() => void handleConnectPrinter(device)}
                    disabled={printerBusy}
                    className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-black disabled:opacity-50"
                  >
                    Hubungkan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div ref={receiptRef} className="bg-white rounded-lg shadow p-5 max-w-sm mx-auto font-mono text-xs">

        {/* Header — nama PDAM */}
        <div className="text-center pb-3 border-b border-dashed border-gray-400">
          {receiptView.tenantLogoUrl && (
            <img
              src={receiptView.tenantLogoUrl}
              alt={receiptView.tenantName}
              className="h-12 w-auto mx-auto mb-2 object-contain"
            />
          )}
          <p className="font-bold text-sm uppercase tracking-wide text-gray-900">{receiptView.tenantName}</p>
          {receiptView.tenantPhone && <p className="text-gray-600 mt-0.5">Telp: {receiptView.tenantPhone}</p>}
        </div>

        {/* Info struk + pelanggan */}
        <div className="py-3 border-b border-dashed border-gray-400 space-y-0.5">
          <div className="flex justify-between">
            <span>No. {receipt.receiptNumber}</span>
            <span className={`font-semibold ${receiptView.invoiceStatusColorClass}`}>
              {receiptView.invoiceStatusLabel}
            </span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{receiptView.paymentDateLabel}</span>
          </div>
          <div className="flex justify-between gap-2 mt-1">
            <span className="text-gray-500">Pelanggan</span>
            <span className="text-right font-medium text-gray-900">{receipt.customerDetails.name}</span>
          </div>
          {receipt.customerDetails.meterNumber && (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">No. Meter</span>
              <span className="text-right text-gray-900">{receipt.customerDetails.meterNumber}</span>
            </div>
          )}
          {receiptView.compactAddress && (
            <p className="text-gray-600 mt-1">{receiptView.compactAddress}</p>
          )}
          <div className="flex justify-between gap-2 mt-1">
            <span className="text-gray-500">No. Tagihan</span>
            <span className="text-right text-gray-900">{receipt.invoiceDetails.invoiceNumber}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Metode</span>
            <span className="text-right text-gray-900">{receiptView.paymentMethodLabel}</span>
          </div>
          {receipt.payment.referenceNumber && (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Ref.</span>
              <span className="text-right text-gray-900">{receipt.payment.referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Item tagihan */}
        {receiptView.showUsageSection && (
          <div className="py-3 border-b border-dashed border-gray-400">
            <p className="font-semibold text-gray-900">
              Tagihan Air{receiptView.usageMonthLabel ? ` — ${receiptView.usageMonthLabel}` : ''}
            </p>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">{receiptView.usageM3} m³</span>
              <span className="font-medium text-gray-900">{receiptView.subTotalLabel}</span>
            </div>
          </div>
        )}

        {/* Ringkasan biaya */}
        <div className="py-3 border-b border-dashed border-gray-400 space-y-0.5">
          {receiptView.showSubTotal && (
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{receiptView.subTotalLabel}</span>
            </div>
          )}
          {receiptView.showPenaltyAmount && (
            <div className="flex justify-between text-red-600">
              <span>Denda</span>
              <span>{receiptView.penaltyAmountLabel}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1">
            <span>Total</span>
            <span>{receiptView.totalAmountLabel}</span>
          </div>
          {receiptView.showTotalPaidBefore && (
            <div className="flex justify-between text-gray-500">
              <span>Terbayar</span>
              <span>{receiptView.totalPaidBeforeLabel}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm">
            <span>Bayar ({receiptView.paymentMethodLabel})</span>
            <span className="text-green-600">{receiptView.paymentAmountLabel}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Sisa</span>
            <span className={receiptView.remainingAmountColorClass}>{receiptView.remainingAmountLabel}</span>
          </div>
        </div>

        {/* Info rekening + QR QRIS */}
        {(receiptView.hasBankInfo || receiptView.qrisImageUrl) && (
          <div className="py-3 border-b border-dashed border-gray-400">
            {receiptView.hasBankInfo && (
              <div className="text-center mb-2 space-y-0.5">
                {receiptView.bankName && receiptView.bankAccountNo && (
                  <p className="font-semibold text-gray-900">
                    {receiptView.bankName} — {receiptView.bankAccountNo}
                  </p>
                )}
                {receiptView.bankAccountName && (
                  <p className="text-gray-600">a.n. {receiptView.bankAccountName}</p>
                )}
              </div>
            )}
            {receiptView.qrisImageUrl && (
              <img
                src={receiptView.qrisImageUrl}
                alt="QRIS Pembayaran"
                className="w-full max-w-[160px] mx-auto block"
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 text-center text-gray-600 space-y-0.5">
          <p>{receiptView.footerText}</p>
          {receiptView.isPartialPayment && (
            <p className="text-amber-700">Masih ada sisa tagihan.</p>
          )}
          {receiptView.compactNotes && <p className="text-gray-500 italic">{receiptView.compactNotes}</p>}
          <p className="text-gray-400 mt-1">Dicetak: {receiptView.printedAtLabel}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
