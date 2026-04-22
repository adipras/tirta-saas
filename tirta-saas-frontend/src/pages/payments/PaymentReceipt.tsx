import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { PageHeader, useToast } from '../../components';
import { paymentService } from '../../services/paymentService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import type { PaymentReceipt as PaymentReceiptType } from '../../types/payment';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../types/payment';
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
  const [preferredPrinter, setPreferredPrinter] = useState<ThermalPrinterDevice | null>(null);
  const [bridgeChecked, setBridgeChecked] = useState(false);
  const [bridgeAvailable, setBridgeAvailable] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatTanggal = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID');
  };

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
  const paymentStatusLabel = isPartialPayment ? 'Pembayaran Parsial' : 'Pelunasan Tagihan';
  const paymentStatusColor = isPartialPayment ? 'text-amber-600' : 'text-green-600';
  const thermalBridgeDetected = bridgeAvailable;
  const thermalModeActive = bridgeAvailable;
  const compactAddress = truncateText(receipt.customerDetails.address, 90);
  const compactNotes = truncateText(receipt.payment.notes, 120);
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[receipt.payment.paymentMethod] || receipt.payment.paymentMethod;
  const paymentStateLabel = PAYMENT_STATUS_LABELS[receipt.payment.status] || receipt.payment.status;
  const invoiceStatusLabel = receipt.invoiceDetails.invoicePaymentStatus === 'paid'
    ? 'Lunas'
    : receipt.invoiceDetails.invoicePaymentStatus === 'partial'
      ? 'Parsial'
      : 'Belum Lunas';

  return (
    <div className="p-6">
      <PageHeader
        title="Struk Pembayaran"
        subtitle={`No. Struk ${receipt.receiptNumber}`}
        actions={
          <>
            <button
              onClick={() => navigate('/admin/payments')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Kembali ke Pembayaran
            </button>
            <button
              onClick={handleReceiptPrint}
              disabled={printing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {printing
                ? 'Mengirim ke Printer...'
                : thermalModeActive
                  ? 'Cetak ke Printer Thermal'
                  : 'Cetak Struk'}
            </button>
            {thermalModeActive && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Fallback Cetak Browser
              </button>
            )}
          </>
        }
      />

      {bridgeChecked && !thermalBridgeDetected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 max-w-4xl mx-auto mb-6">
          <p className="font-semibold">Bridge printer thermal belum aktif</p>
          <p className="mt-1 text-sm">
            Jalankan aplikasi <span className="font-medium">Bridge Printer Thermal</span> di Android agar frontend dapat
            mengakses <span className="font-medium">{PRINTER_BRIDGE_BASE_URL}</span>. Sementara itu, cetak browser tetap tersedia.
          </p>
        </div>
      )}

      {thermalBridgeDetected && (
        <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Printer Thermal Kasir Keliling</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-700">Status:</span>{' '}
                  <span className={printerStatus.connected ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                    {printerStatus.connected ? 'Terhubung' : 'Belum terhubung'}
                  </span>
                </p>
                {printerStatus.printerName && (
                  <p><span className="font-medium text-gray-700">Printer aktif:</span> {printerStatus.printerName}</p>
                )}
                {preferredPrinter && (
                  <p><span className="font-medium text-gray-700">Printer favorit:</span> {preferredPrinter.name}</p>
                )}
                {printerStatus.serverUrl && (
                  <p><span className="font-medium text-gray-700">Bridge:</span> {printerStatus.serverUrl}</p>
                )}
                {printerStatus.message && (
                  <p><span className="font-medium text-gray-700">Info:</span> {printerStatus.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void refreshPrinterStatus()}
                disabled={printerBusy}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Refresh Status
              </button>
              <button
                onClick={() => void handleScanPrinters()}
                disabled={printerBusy}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50"
              >
                Cari Printer
              </button>
              {preferredPrinter && !printerStatus.connected && (
                <button
                  onClick={() => void handleConnectPrinter(preferredPrinter)}
                  disabled={printerBusy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Hubungkan Printer Favorit
                </button>
              )}
            </div>
          </div>

          {availablePrinters.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-900 mb-3">Hasil pencarian printer</p>
              <div className="space-y-2">
                {availablePrinters.map((device) => (
                  <div key={device.id} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                    <div>
                      <p className="font-medium text-gray-900">{device.name}</p>
                      {device.address && <p className="text-sm text-gray-500">{device.address}</p>}
                    </div>
                    <button
                      onClick={() => void handleConnectPrinter(device)}
                      disabled={printerBusy}
                      className="px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-black disabled:opacity-50"
                    >
                      Hubungkan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={receiptRef} className="bg-white rounded-lg shadow p-6 md:p-8 max-w-2xl mx-auto">
        <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">TIRTA SAAS</h2>
            <p className="text-sm text-gray-600 mt-1">Struk Pembayaran Air</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">No. Struk</p>
              <p className="font-semibold text-gray-900">{receipt.receiptNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Dicetak</p>
              <p className="font-semibold text-gray-900">{formatTanggalWaktu(receipt.generatedAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">No. Tagihan</p>
              <p className="font-semibold text-gray-900">{receipt.invoiceDetails.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Jenis</p>
              <p className={`font-semibold ${paymentStatusColor}`}>{paymentStatusLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <section className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Pelanggan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Nama</span>
                <span className="text-right font-medium text-gray-900">{receipt.customerDetails.name}</span>
              </div>
              {receipt.customerDetails.meterNumber && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">No. Meter</span>
                  <span className="text-right text-gray-900">{receipt.customerDetails.meterNumber}</span>
                </div>
              )}
              {compactAddress && (
                <div className="space-y-1">
                  <p className="text-gray-500">Alamat</p>
                  <p className="text-gray-900">{compactAddress}</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Pembayaran</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Tanggal</span>
                <span className="text-right font-medium text-gray-900">{formatTanggal(receipt.payment.paymentDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Metode</span>
                <span className="text-right text-gray-900">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Status</span>
                <span className="text-right font-medium text-green-600">{paymentStateLabel}</span>
              </div>
              {receipt.payment.referenceNumber && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Ref.</span>
                  <span className="text-right text-gray-900">{receipt.payment.referenceNumber}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-gray-200 p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">Tagihan</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Tgl Tagihan</span>
              <span className="text-right text-gray-900">{formatTanggal(receipt.invoiceDetails.invoiceDate)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Jatuh Tempo</span>
              <span className="text-right text-gray-900">{formatTanggal(receipt.invoiceDetails.dueDate)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Status Tagihan</span>
              <span className={`text-right font-medium ${isPartialPayment ? 'text-amber-600' : 'text-green-600'}`}>
                {invoiceStatusLabel}
              </span>
            </div>
          </div>
        </section>

        <div className="border-t border-dashed border-gray-300 pt-4">
          <div className="flex justify-end">
            <div className="w-full sm:w-72">
              {(receipt.invoiceDetails.subTotal || 0) > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(receipt.invoiceDetails.subTotal)}</span>
                </div>
              )}
              {(receipt.invoiceDetails.penaltyAmount || 0) > 0 && (
                <div className="flex justify-between py-1 text-sm text-red-600">
                  <span>Denda</span>
                  <span className="font-medium">{formatCurrency(receipt.invoiceDetails.penaltyAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">Tagihan</span>
                <span className="font-medium text-gray-900">{formatCurrency(receipt.invoiceDetails.totalAmount)}</span>
              </div>
              {(receipt.invoiceDetails.totalPaidBefore || 0) > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-gray-500">Terbayar</span>
                  <span className="font-medium text-gray-900">{formatCurrency(receipt.invoiceDetails.totalPaidBefore)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Bayar</span>
                <span className="text-green-600">{formatCurrency(receipt.payment.amount)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">Total Bayar</span>
                <span className="font-medium text-gray-900">{formatCurrency(receipt.invoiceDetails.totalPaidAfter)}</span>
              </div>
              <div className="flex justify-between py-2 mt-2 border-t border-gray-200 text-base font-bold">
                <span>Sisa</span>
                <span className={isPartialPayment ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(receipt.invoiceDetails.remainingAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {compactNotes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Catatan</h4>
            <p className="text-sm text-gray-600">{compactNotes}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-center text-sm text-gray-600">
          <p>Terima kasih.</p>
          {isPartialPayment && (
            <p className="mt-1 text-amber-700">
              Pembayaran parsial, masih ada sisa tagihan.
            </p>
          )}
          <p className="mt-1">Cetak: {formatTanggalWaktu(receipt.generatedAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
