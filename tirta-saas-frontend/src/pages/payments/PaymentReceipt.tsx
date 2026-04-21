import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { PageHeader, useToast } from '../../components';
import { paymentService } from '../../services/paymentService';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import type { PaymentReceipt as PaymentReceiptType } from '../../types/payment';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../types/payment';
import type { ThermalPrinterDevice, ThermalPrinterStatus } from '../../types/thermalPrinter';

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

  const formatCurrency = (value?: number) => `Rp ${(value || 0).toLocaleString('id-ID')}`;

  useEffect(() => {
    if (id) {
      void fetchReceipt(id);
    }
  }, [id]);

  useEffect(() => {
    setPreferredPrinter(thermalPrinterService.getPreferredPrinter());
    void probeThermalBridge();
  }, []);

  const fetchReceipt = async (paymentId: string) => {
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
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receipt ? `Struk_${receipt.receiptNumber}` : 'Struk',
  });

  const probeThermalBridge = async () => {
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
  };

  const refreshPrinterStatus = async () => {
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
  };

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
            mengakses <span className="font-medium">127.0.0.1:3000</span>. Sementara itu, cetak browser tetap tersedia.
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

      <div ref={receiptRef} className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">TIRTA SAAS</h2>
            <p className="text-gray-600 mt-1">Sistem Manajemen Tagihan Air</p>
            <p className="text-sm text-gray-500 mt-2">
              Jl. Contoh No. 123, Kota ABC 12345<br />
              Telepon: (021) 1234-5678 | Email: info@tirtasaas.com
            </p>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold text-gray-900">STRUK PEMBAYARAN</h3>
            <p className="text-sm text-gray-600 mt-1">No. Struk: {receipt.receiptNumber}</p>
            <p className={`text-sm font-semibold mt-2 ${paymentStatusColor}`}>{paymentStatusLabel}</p>
            {thermalBridgeDetected && (
              <p className="text-xs text-blue-600 mt-2">Mode kasir keliling: bridge printer thermal aktif</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Informasi Pelanggan</h4>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600">Nama:</span> <span className="font-medium">{receipt.customerDetails.name}</span></p>
              {receipt.customerDetails.address && (
                <p><span className="text-gray-600">Alamat:</span> {receipt.customerDetails.address}</p>
              )}
              {receipt.customerDetails.phone && (
                <p><span className="text-gray-600">Telepon:</span> {receipt.customerDetails.phone}</p>
              )}
              {receipt.customerDetails.meterNumber && (
                <p><span className="text-gray-600">No. Meter:</span> {receipt.customerDetails.meterNumber}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Informasi Pembayaran</h4>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600">Tanggal Bayar:</span> <span className="font-medium">{formatTanggal(receipt.payment.paymentDate)}</span></p>
              <p><span className="text-gray-600">Metode Pembayaran:</span> {PAYMENT_METHOD_LABELS[receipt.payment.paymentMethod] || receipt.payment.paymentMethod}</p>
              {receipt.payment.referenceNumber && (
                <p><span className="text-gray-600">Referensi:</span> {receipt.payment.referenceNumber}</p>
              )}
              <p><span className="text-gray-600">Status:</span> <span className="font-medium text-green-600">{PAYMENT_STATUS_LABELS[receipt.payment.status]}</span></p>
              <p>
                <span className="text-gray-600">Jenis Pembayaran:</span>{' '}
                <span className={`font-medium ${paymentStatusColor}`}>{paymentStatusLabel}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Detail Tagihan</h4>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">No. Tagihan</th>
                  <th className="px-4 py-2 text-left">Tanggal Tagihan</th>
                  <th className="px-4 py-2 text-left">Jatuh Tempo</th>
                  <th className="px-4 py-2 text-right">Tagihan Saat Dibayar</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-t">{receipt.invoiceDetails.invoiceNumber}</td>
                  <td className="px-4 py-2 border-t">{formatTanggal(receipt.invoiceDetails.invoiceDate)}</td>
                  <td className="px-4 py-2 border-t">{formatTanggal(receipt.invoiceDetails.dueDate)}</td>
                  <td className="px-4 py-2 border-t text-right">{formatCurrency(receipt.invoiceDetails.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t-2 border-gray-300 pt-4">
          <div className="flex justify-end">
            <div className="w-64">
              {(receipt.invoiceDetails.subTotal || 0) > 0 && (
                <div className="flex justify-between py-1 text-sm">
                  <span>Subtotal Tagihan:</span>
                  <span>{formatCurrency(receipt.invoiceDetails.subTotal)}</span>
                </div>
              )}
              {(receipt.invoiceDetails.penaltyAmount || 0) > 0 && (
                <div className="flex justify-between py-1 text-sm text-red-600">
                  <span>Denda Saat Dibayar:</span>
                  <span>{formatCurrency(receipt.invoiceDetails.penaltyAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-sm">
                <span>Sudah Dibayar Sebelumnya:</span>
                <span>{formatCurrency(receipt.invoiceDetails.totalPaidBefore)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Nominal Dibayar:</span>
                <span className="text-green-600">{formatCurrency(receipt.payment.amount)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span>Total Dibayar Setelah Transaksi:</span>
                <span>{formatCurrency(receipt.invoiceDetails.totalPaidAfter)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-semibold">
                <span>Status Tagihan:</span>
                <span className={isPartialPayment ? 'text-amber-600' : 'text-green-600'}>
                  {receipt.invoiceDetails.invoicePaymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                </span>
              </div>
              <div className="flex justify-between py-2 mt-2 border-t text-base font-bold">
                <span>Sisa Tagihan:</span>
                <span className={isPartialPayment ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(receipt.invoiceDetails.remainingAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {receipt.payment.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Catatan</h4>
            <p className="text-sm text-gray-600">{receipt.payment.notes}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>Terima kasih atas pembayaran Anda.</p>
          {isPartialPayment && (
            <p className="mt-2 text-amber-700">
              Pembayaran ini bersifat parsial. Sisa tagihan masih harus dilunasi sesuai nominal yang tercantum.
            </p>
          )}
          <p className="mt-2">Struk ini dibuat secara otomatis dan tidak memerlukan tanda tangan.</p>
          <p className="mt-1">Dibuat pada: {new Date(receipt.generatedAt).toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
