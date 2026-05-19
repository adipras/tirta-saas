import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { DocumentTextIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { thermalPrinterService } from '../../services/thermalPrinterService';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state;

  useEffect(() => {
    // If no payment data, redirect to invoices
    if (!paymentData) {
      navigate('/customer/invoices');
    }
  }, [paymentData, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  if (!paymentData) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-12 text-center">
          <CheckCircleIcon className="h-20 w-20 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Pembayaran Berhasil Dikirim!</h1>
          <p className="text-green-100">Pembayaran Anda telah diterima dan sedang diproses.</p>
        </div>

        {/* Payment Details */}
        <div className="px-8 py-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pembayaran</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nomor Tagihan:</span>
                <span className="font-mono font-medium text-gray-900">
                  {paymentData.invoice?.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Periode Tagihan:</span>
                <span className="font-medium text-gray-900">
                  {paymentData.invoice?.billingPeriod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Metode Pembayaran:</span>
                <span className="font-medium text-gray-900">
                  {getPaymentMethodLabel(paymentData.paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-300">
                <span className="text-gray-900 font-semibold">Nominal Dibayar:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(paymentData.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2">Langkah Selanjutnya</h3>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>• Pembayaran Anda akan diverifikasi dalam 1-2 hari kerja</li>
              <li>• Anda akan menerima konfirmasi email setelah diverifikasi</li>
              <li>• Status tagihan Anda akan diperbarui secara otomatis</li>
              <li>• Anda dapat memeriksa riwayat pembayaran kapan saja</li>
            </ul>
          </div>

          {/* Important Note */}
          {paymentData.paymentMethod !== 'cash' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">Catatan Penting</h3>
              <p className="text-sm text-yellow-800">
                Simpan nomor referensi pembayaran Anda untuk arsip. 
                Jika ada pertanyaan, hubungi layanan pelanggan kami dengan menyertakan nomor referensi Anda.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              to="/customer/invoices"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Lihat Tagihan Saya
            </Link>
            <Link
              to="/customer/dashboard"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Ke Dashboard
            </Link>
          </div>

          {/* Support */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Butuh bantuan? Hubungi kami di{' '}
              <a href="mailto:support@tirta.com" className="text-indigo-600 hover:underline">
                support@tirta.com
              </a>
              {' '}atau telepon{' '}
              <a href="tel:+622112345678" className="text-indigo-600 hover:underline">
                (021) 1234-5678
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Print Receipt Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => thermalPrinterService.printPage()}
          className="inline-flex items-center px-6 py-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak Halaman Ini
        </button>
      </div>
    </div>
  );
}
