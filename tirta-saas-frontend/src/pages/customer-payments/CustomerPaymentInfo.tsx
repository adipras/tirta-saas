import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BuildingLibraryIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowRightIcon,
  QrCodeIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, useToast, CardSkeleton } from '../../components';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { extractApiErrorMessage } from '../../utils/apiError';

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface PaymentQrCode {
  id: string;
  imageUrl: string;
}

export default function CustomerPaymentInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  const { error: showErrorToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [qrCodes, setQRCodes] = useState<PaymentQrCode[]>([]);

  const loadPaymentSettings = useCallback(async () => {
    try {
      // TODO: Implement API call when endpoint is ready
      // const settings = await settingsService.getTenantPaymentSettings();
      // setBankAccounts(settings.bankAccounts.filter(b => b.isActive));
      // setQRCodes(settings.qrCodes.filter(q => q.isActive));
      setBankAccounts([]);
      setQRCodes([]);
    } catch { /* ignore: payment settings are non-critical */ }
  }, []);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setInvoiceError(null);
      const data = await invoiceService.getInvoiceById(invoiceId!);
      setInvoice(data);
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memuat tagihan. Silakan coba lagi.');
      setInvoiceError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [invoiceId, showErrorToast]);

  useEffect(() => {
    if (invoiceId) {
      void loadInvoice();
    } else {
      setLoading(false);
    }
    void loadPaymentSettings();
  }, [invoiceId, loadInvoice, loadPaymentSettings]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* ignore */ }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirmPayment = () => {
    navigate(`/customer/payments/confirm?invoice=${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" aria-busy="true" aria-label="Memuat informasi pembayaran">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
        >
          <p className="text-red-700">{invoiceError}</p>
          <button
            onClick={() => { void loadInvoice(); }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Pembayaran Tagihan Air"
        subtitle="Transfer ke salah satu rekening di bawah ini, lalu konfirmasi pembayaran Anda."
      />

      {/* Invoice Summary */}
      {invoice && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg shadow-md p-6 border-l-4 border-indigo-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Tagihan</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nomor Tagihan</p>
              <p className="text-base font-semibold text-gray-900">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Periode</p>
              <p className="text-base font-semibold text-gray-900">
                {new Date(invoice.periodStartDate).toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Total Tagihan</p>
              <p className="text-3xl font-bold text-indigo-600">
                {formatCurrency(invoice.amountDue || invoice.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Petunjuk Pembayaran</h3>
            <ol className="mt-2 text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Transfer sesuai nominal tagihan ke salah satu rekening di bawah</li>
              <li>Simpan bukti transfer Anda</li>
              <li>Klik "Konfirmasi Pembayaran" untuk mengunggah bukti pembayaran</li>
              <li>Pembayaran akan diverifikasi dalam 1-2 hari kerja</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <BuildingLibraryIcon className="h-6 w-6 mr-2 text-indigo-600" />
          Transfer Bank
        </h2>

        {bankAccounts.map((bank) => (
          <div
            key={bank.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-indigo-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{bank.bankName}</h3>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <BuildingLibraryIcon className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Nama Rekening</p>
                <p className="text-base font-semibold text-gray-900">{bank.accountName}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-sm text-gray-600">Nomor Rekening</p>
                  <p className="text-2xl font-mono font-bold text-gray-900">
                    {bank.accountNumber}
                  </p>
                </div>
                <button
                  onClick={() => void copyToClipboard(bank.accountNumber, bank.id)}
                  aria-label={`Salin nomor rekening ${bank.bankName}: ${bank.accountNumber}`}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                >
                  {copiedField === bank.id ? (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <QrCodeIcon className="h-6 w-6 mr-2 text-indigo-600" />
          Pembayaran QRIS
        </h2>
        {qrCodes.length > 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200 overflow-hidden">
              <img
                src={qrCodes[0].imageUrl}
                alt="Kode QR untuk pembayaran QRIS"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="text-center">
                      <svg class="h-20 w-20 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p class="text-sm text-gray-500 mt-2">Kode QR</p>
                    </div>
                  `;
                }}
              />
            </div>
            <p className="mt-3 text-sm text-gray-600">GoPay, OVO, Dana, ShopeePay</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <QrCodeIcon className="h-20 w-20 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Kode QR tidak tersedia</p>
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sudah bayar?</h3>
            <p className="text-sm text-gray-600 mt-1">Unggah bukti pembayaran Anda</p>
          </div>
          <button
            onClick={handleConfirmPayment}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <span>Konfirmasi Pembayaran</span>
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
