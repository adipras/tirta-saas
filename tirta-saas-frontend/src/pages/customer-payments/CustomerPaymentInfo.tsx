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
import { useToast, CardSkeleton } from '../../components';
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
      setBankAccounts([]);
      setQRCodes([]);
    } catch { /* ignore */ }
  }, []);

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setInvoiceError(null);
      const data = await invoiceService.getCustomerInvoiceById(invoiceId!);
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const handleConfirmPayment = () => {
    navigate(`/customer/payments/confirm?invoice=${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" aria-busy="true">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
          <p className="text-danger-700">{invoiceError}</p>
          <button
            onClick={() => { void loadInvoice(); }}
            className="btn-primary mt-4"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Pembayaran Tagihan Air</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Transfer ke salah satu rekening di bawah ini, lalu konfirmasi pembayaran Anda.
        </p>
      </div>

      {/* Invoice Summary */}
      {invoice && (
        <div className="rounded-xl bg-gradient-to-r from-brand-50 to-brand-100 p-6 border-l-4 border-brand-500">
          <h2 className="text-[15px] font-semibold text-surface-800 mb-4">Detail Tagihan</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[13px] text-surface-500">Nomor Tagihan</p>
              <p className="text-[15px] font-semibold text-surface-800">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[13px] text-surface-500">Periode</p>
              <p className="text-[15px] font-semibold text-surface-800">
                {new Date(invoice.periodStartDate).toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[13px] text-surface-500">Total Tagihan</p>
              <p className="text-[28px] font-bold text-brand-600">
                {formatCurrency(invoice.amountDue || invoice.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
        <div className="flex gap-3">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-warning-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-[13px] font-medium text-warning-700">Petunjuk Pembayaran</h3>
            <ol className="mt-2 text-[13px] text-warning-600 list-decimal list-inside space-y-1">
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
        <h2 className="text-[15px] font-semibold text-surface-800 flex items-center gap-2">
          <BuildingLibraryIcon className="h-5 w-5 text-brand-500" />
          Transfer Bank
        </h2>

        {bankAccounts.map((bank) => (
          <div
            key={bank.id}
            className="card p-5 hover:border-brand-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-surface-800">{bank.bankName}</h3>
              <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
                <BuildingLibraryIcon className="h-5 w-5 text-surface-400" />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[13px] text-surface-400">Nama Rekening</p>
                <p className="text-[15px] font-semibold text-surface-800">{bank.accountName}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                <div>
                  <p className="text-[13px] text-surface-400">Nomor Rekening</p>
                  <p className="text-[20px] font-mono font-bold text-surface-800">
                    {bank.accountNumber}
                  </p>
                </div>
                <button
                  onClick={() => void copyToClipboard(bank.accountNumber, bank.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-colors text-[13px] font-medium"
                >
                  {copiedField === bank.id ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code */}
      <div className="card p-5">
        <h2 className="text-[15px] font-semibold text-surface-800 flex items-center gap-2 mb-4">
          <QrCodeIcon className="h-5 w-5 text-brand-500" />
          Pembayaran QRIS
        </h2>
        {qrCodes.length > 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-64 h-64 bg-surface-100 rounded-xl flex items-center justify-center border-2 border-surface-200 overflow-hidden">
              <img
                src={qrCodes[0].imageUrl}
                alt="Kode QR untuk pembayaran QRIS"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <p className="mt-3 text-[13px] text-surface-400">GoPay, OVO, Dana, ShopeePay</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <QrCodeIcon className="h-16 w-16 text-surface-300 mb-2" />
            <p className="text-[13px] text-surface-400">Kode QR tidak tersedia</p>
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-surface-800">Sudah bayar?</h3>
            <p className="text-[13px] text-surface-400 mt-0.5">Unggah bukti pembayaran Anda</p>
          </div>
          <button
            onClick={handleConfirmPayment}
            className="flex items-center space-x-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium text-[13px] transition-colors"
          >
            <span>Konfirmasi Pembayaran</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
