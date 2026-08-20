import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { thermalPrinterService } from '../../services/thermalPrinterService';
import {
  DocumentTextIcon,
  HomeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state;

  useEffect(() => {
    if (!paymentData) {
      navigate('/customer/invoices');
    }
  }, [paymentData, navigate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tunai',
      bank_transfer: 'Transfer Bank',
      credit_card: 'Kartu Kredit',
      debit_card: 'Kartu Debit',
      e_wallet: 'Dompet Digital',
    };
    return labels[method] || method;
  };

  if (!paymentData) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success Hero */}
      <div className="overflow-hidden rounded-2xl border border-surface-100 shadow-card">
        <div className="bg-gradient-to-br from-success-500 to-success-600 px-8 py-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <CheckCircleSolid className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Pembayaran Berhasil Dikirim!</h1>
          <p className="text-[14px] text-success-100">Pembayaran Anda telah diterima dan sedang diproses.</p>
        </div>

        {/* Payment Details */}
        <div className="space-y-5 p-6">
          <div className="rounded-xl bg-surface-50 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                <DocumentTextIcon className="h-[18px] w-5 text-brand-500" />
              </div>
              <h2 className="text-[15px] font-semibold text-surface-800">Detail Pembayaran</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <span className="text-[13px] text-surface-400">Nomor Tagihan</span>
                <span className="font-mono text-[14px] font-medium text-surface-700">{paymentData.invoice?.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <span className="text-[13px] text-surface-400">Periode Tagihan</span>
                <span className="text-[14px] font-medium text-surface-700">{paymentData.invoice?.billingPeriod}</span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <span className="text-[13px] text-surface-400">Metode Pembayaran</span>
                <span className="text-[14px] font-medium text-surface-700">{getPaymentMethodLabel(paymentData.paymentMethod)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[14px] font-semibold text-surface-700">Nominal Dibayar</span>
                <span className="text-2xl font-bold text-success-600">{formatCurrency(paymentData.amount)}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="rounded-xl border border-info-200 bg-info-50 p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-100">
                <ClockIcon className="h-[18px] w-5 text-info-500" />
              </div>
              <h3 className="text-[14px] font-semibold text-info-700">Langkah Selanjutnya</h3>
            </div>
            <ul className="space-y-2 pl-12">
              <li className="flex items-start gap-2 text-[13px] text-info-600">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-info-400" />
                Pembayaran Anda akan diverifikasi dalam 1–2 hari kerja
              </li>
              <li className="flex items-start gap-2 text-[13px] text-info-600">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-info-400" />
                Anda akan menerima konfirmasi email setelah diverifikasi
              </li>
              <li className="flex items-start gap-2 text-[13px] text-info-600">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-info-400" />
                Status tagihan Anda akan diperbarui secara otomatis
              </li>
              <li className="flex items-start gap-2 text-[13px] text-info-600">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-info-400" />
                Anda dapat memeriksa riwayat pembayaran kapan saja
              </li>
            </ul>
          </div>

          {/* Important Note */}
          {paymentData.paymentMethod !== 'cash' && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-100">
                  <ExclamationTriangleIcon className="h-[18px] w-5 text-warning-500" />
                </div>
                <h3 className="text-[14px] font-semibold text-warning-700">Catatan Penting</h3>
              </div>
              <p className="pl-12 text-[13px] text-warning-600">
                Simpan nomor referensi pembayaran Anda untuk arsip. Jika ada pertanyaan, hubungi layanan
                pelanggan kami dengan menyertakan nomor referensi Anda.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/customer/invoices" className="btn-primary flex-1 justify-center">
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              Lihat Tagihan Saya
            </Link>
            <Link to="/customer/dashboard" className="btn-secondary flex-1 justify-center">
              <HomeIcon className="mr-2 h-4 w-4" />
              Ke Dashboard
            </Link>
          </div>

          {/* Print & Support */}
          <div className="border-t border-surface-100 pt-5 text-center">
            <button
              onClick={() => thermalPrinterService.printPage()}
              className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-surface-500 transition-colors hover:text-surface-700"
            >
              <PrinterIcon className="h-4 w-4" />
              Cetak Halaman Ini
            </button>
            <p className="text-[13px] text-surface-400">
              Butuh bantuan? Hubungi kami di{' '}
              <a href="mailto:support@tirta.com" className="font-medium text-brand-600 hover:underline">support@tirta.com</a>
              {' '}atau telepon{' '}
              <a href="tel:+622112345678" className="font-medium text-brand-600 hover:underline">(021) 1234-5678</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
