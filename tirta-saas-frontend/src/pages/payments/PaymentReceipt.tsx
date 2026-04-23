import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { PageHeader, useToast } from '../../components';
import { paymentService } from '../../services/paymentService';
import { resolveTenantAssetUrl } from '../../services/tenantSettingsService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import type { PaymentReceipt as PaymentReceiptType } from '../../types/payment';
import { PAYMENT_METHOD_LABELS } from '../../types/payment';
import type { ThermalPrinterDevice, ThermalPrinterStatus } from '../../types/thermalPrinter';
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

  const formatTanggalWaktu = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID');
  };

  const formatCurrency = (value?: number) => `Rp ${(value || 0).toLocaleString('id-ID')}`;

  const truncateText = (value?: string, maxLength: number = 120) => {
    if (!value) {
      return undefined;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return undefined;
    }

    return normalized.length > maxLength
      ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
      : normalized;
  };

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

  const isPartialPayment = receipt.invoiceDetails.paymentCoverageType === 'partial';
  const thermalBridgeDetected = bridgeAvailable;
  const thermalModeActive = bridgeAvailable;
  const compactAddress = truncateText(receipt.customerDetails.address, 90);
  const compactNotes = truncateText(receipt.payment.notes, 120);
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[receipt.payment.paymentMethod] || receipt.payment.paymentMethod;
  const invoiceStatusLabel = receipt.invoiceDetails.invoicePaymentStatus === 'paid'
    ? 'Lunas'
    : receipt.invoiceDetails.invoicePaymentStatus === 'partial'
      ? 'Parsial'
      : 'Belum Lunas';
  const invoiceStatusColor = receipt.invoiceDetails.invoicePaymentStatus === 'paid'
    ? 'text-green-600'
    : receipt.invoiceDetails.invoicePaymentStatus === 'partial'
      ? 'text-amber-600'
      : 'text-red-600';

  const tenantName = receipt.tenantInfo?.companyName || 'TIRTA SAAS';
  const tenantPhone = receipt.tenantInfo?.phone;
  const tenantLogo = resolveTenantAssetUrl(receipt.tenantInfo?.logoUrl);
  const footerText = receipt.tenantInfo?.footerText || 'Terima kasih telah membayar tagihan air Anda.';
  const bankName = receipt.tenantInfo?.bankName;
  const bankAccountName = receipt.tenantInfo?.bankAccountName;
  const bankAccountNo = receipt.tenantInfo?.bankAccountNo;
  const qrisImageUrl = resolveTenantAssetUrl(receipt.tenantInfo?.qrisImageUrl);
  const hasBankInfo = bankName || bankAccountNo;

  const usageMonth = receipt.usageDetails?.usageMonth;
  const usageM3 = receipt.usageDetails?.usageM3;
  const usageMonthLabel = usageMonth
    ? new Date(`${usageMonth}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : null;

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
          {tenantLogo && (
            <img src={tenantLogo} alt={tenantName} className="h-12 w-auto mx-auto mb-2 object-contain" />
          )}
          <p className="font-bold text-sm uppercase tracking-wide text-gray-900">{tenantName}</p>
          {tenantPhone && <p className="text-gray-600 mt-0.5">Telp: {tenantPhone}</p>}
        </div>

        {/* Info struk + pelanggan */}
        <div className="py-3 border-b border-dashed border-gray-400 space-y-0.5">
          <div className="flex justify-between">
            <span>No. {receipt.receiptNumber}</span>
            <span className={`font-semibold ${invoiceStatusColor}`}>{invoiceStatusLabel}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{formatTanggalWaktu(receipt.payment.paymentDate)}</span>
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
          {compactAddress && (
            <p className="text-gray-600 mt-1">{compactAddress}</p>
          )}
          <div className="flex justify-between gap-2 mt-1">
            <span className="text-gray-500">No. Tagihan</span>
            <span className="text-right text-gray-900">{receipt.invoiceDetails.invoiceNumber}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Metode</span>
            <span className="text-right text-gray-900">{paymentMethodLabel}</span>
          </div>
          {receipt.payment.referenceNumber && (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Ref.</span>
              <span className="text-right text-gray-900">{receipt.payment.referenceNumber}</span>
            </div>
          )}
        </div>

        {/* Item tagihan */}
        <div className="py-3 border-b border-dashed border-gray-400">
          <p className="font-semibold text-gray-900">
            Tagihan Air{usageMonthLabel ? ` — ${usageMonthLabel}` : ''}
          </p>
          {usageM3 != null && usageM3 > 0 && (
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">{usageM3} m³</span>
              <span className="font-medium text-gray-900">{formatCurrency(receipt.invoiceDetails.subTotal)}</span>
            </div>
          )}
        </div>

        {/* Ringkasan biaya */}
        <div className="py-3 border-b border-dashed border-gray-400 space-y-0.5">
          {(receipt.invoiceDetails.subTotal || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(receipt.invoiceDetails.subTotal)}</span>
            </div>
          )}
          {(receipt.invoiceDetails.penaltyAmount || 0) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Denda</span>
              <span>{formatCurrency(receipt.invoiceDetails.penaltyAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1">
            <span>Total</span>
            <span>{formatCurrency(receipt.invoiceDetails.totalAmount)}</span>
          </div>
          {(receipt.invoiceDetails.totalPaidBefore || 0) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Terbayar</span>
              <span>{formatCurrency(receipt.invoiceDetails.totalPaidBefore)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm">
            <span>Bayar ({paymentMethodLabel})</span>
            <span className="text-green-600">{formatCurrency(receipt.payment.amount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Sisa</span>
            <span className={isPartialPayment ? 'text-red-600' : 'text-green-600'}>
              {formatCurrency(receipt.invoiceDetails.remainingAmount)}
            </span>
          </div>
        </div>

        {/* Info rekening + QR QRIS */}
        {(hasBankInfo || qrisImageUrl) && (
          <div className="py-3 border-b border-dashed border-gray-400">
            {hasBankInfo && (
              <div className="text-center mb-2 space-y-0.5">
                {bankName && bankAccountNo && (
                  <p className="font-semibold text-gray-900">{bankName} — {bankAccountNo}</p>
                )}
                {bankAccountName && (
                  <p className="text-gray-600">a.n. {bankAccountName}</p>
                )}
              </div>
            )}
            {qrisImageUrl && (
              <img
                src={qrisImageUrl}
                alt="QRIS Pembayaran"
                className="w-full max-w-[160px] mx-auto block"
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 text-center text-gray-600 space-y-0.5">
          <p>{footerText}</p>
          {isPartialPayment && (
            <p className="text-amber-700">Masih ada sisa tagihan.</p>
          )}
          {compactNotes && <p className="text-gray-500 italic">{compactNotes}</p>}
          <p className="text-gray-400 mt-1">Dicetak: {formatTanggalWaktu(receipt.generatedAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
