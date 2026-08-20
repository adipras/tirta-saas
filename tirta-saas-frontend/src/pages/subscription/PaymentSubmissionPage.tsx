import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

interface PaymentState {
  plan: string;
  planName: string;
  basePrice: number;
  billingPeriod: number;
  totalAmount: number;
}

const PaymentSubmissionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentState = location.state as PaymentState;
  const toast = useToast();

  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    accountNumber: '',
    accountName: '',
    referenceNumber: '',
    notes: '',
  });

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!paymentState) {
    navigate('/admin/subscription/upgrade');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Hanya file JPG, PNG, dan PDF yang diizinkan');
      return;
    }

    setError('');
    setProofFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proofFile) {
      setError('Unggah bukti pembayaran terlebih dahulu');
      return;
    }

    if (!isConfirmed) {
      setError('Konfirmasi bahwa pembayaran sudah dilakukan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await subscriptionPaymentService.submitPayment(
        {
          subscriptionPlan: paymentState.plan,
          billingPeriod: paymentState.billingPeriod,
          amount: paymentState.totalAmount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          referenceNumber: formData.referenceNumber,
          notes: formData.notes,
        },
        proofFile
      );

      toast.success(`Pembayaran berhasil dikirim. ID konfirmasi: ${response.confirmationId}`);
      navigate('/subscription/status');
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal mengirim pembayaran. Silakan coba lagi.'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <button onClick={() => navigate(-1)} className="hover:text-surface-600 transition-colors">
          Langganan
        </button>
        <span>/</span>
        <span className="text-surface-700 font-medium">Selesaikan Pembayaran</span>
      </nav>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-[13px] text-surface-400 hover:text-surface-600 transition-colors"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Kembali ke Pilihan Paket
      </button>

      <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Selesaikan Pembayaran Anda</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Payment Info */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="h-5 w-5 text-surface-400" />
              <h2 className="text-base font-semibold text-surface-900">Ringkasan Pesanan</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-surface-500">Paket:</span>
                <span className="font-medium text-surface-900">{paymentState.planName}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-surface-500">Periode Tagihan:</span>
                <span className="font-medium text-surface-900">
                  {paymentState.billingPeriod} {paymentState.billingPeriod === 1 ? 'Bulan' : 'Bulan'}
                </span>
              </div>
              <div className="border-t border-surface-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-surface-900">Total Pembayaran:</span>
                  <span className="text-xl font-bold text-brand-600">
                    {formatCurrency(paymentState.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="rounded-xl border border-info-200 bg-info-50 p-6">
            <h3 className="font-semibold text-info-900 mb-3">Petunjuk Pembayaran</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-[13px] font-medium text-info-900 mb-2">Transfer Bank:</h4>
                <div className="rounded-xl bg-white p-3 text-[13px] space-y-1">
                  <p><span className="font-medium text-surface-700">Bank:</span> BCA</p>
                  <p><span className="font-medium text-surface-700">Rekening:</span> 1234567890</p>
                  <p><span className="font-medium text-surface-700">Nama:</span> PT Tirta SaaS Indonesia</p>
                </div>
              </div>
              <div>
                <h4 className="text-[13px] font-medium text-info-900 mb-2">E-Wallet (QRIS):</h4>
                <div className="rounded-xl bg-white p-3">
                  <div className="w-32 h-32 bg-surface-100 rounded-xl flex items-center justify-center">
                    <span className="text-[12px] text-surface-400">Kode QR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Form */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCardIcon className="h-5 w-5 text-surface-400" />
            <h2 className="text-base font-semibold text-surface-900">Konfirmasi Pembayaran</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-danger-200 bg-danger-50 text-danger-700 px-4 py-3 text-[13px]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Tanggal Pembayaran <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Metode Pembayaran <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BanknotesIcon className="h-4 w-4 text-surface-400" />
                </div>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className="input-base pl-10"
                >
                  <option value="bank_transfer">Transfer Bank</option>
                  <option value="e-wallet">E-Wallet (QRIS)</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>

            {formData.paymentMethod === 'bank_transfer' && (
              <div>
                <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Nomor rekening Anda"
                  className="input-base"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Nama Pemilik Rekening <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                placeholder="Nama pemilik rekening"
                required
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Nomor Referensi
              </label>
              <input
                type="text"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                placeholder="Nomor referensi transaksi"
                className="input-base"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Bukti Pembayaran <span className="text-danger-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-surface-200 rounded-xl hover:border-brand-400 transition-colors">
                <div className="space-y-1 text-center">
                  <DocumentArrowUpIcon className="mx-auto h-10 w-10 text-surface-300" />
                  <div className="flex text-[13px] text-surface-600">
                    <label className="relative cursor-pointer rounded-xl font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none">
                      <span>Unggah file</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">atau tarik dan lepas</p>
                  </div>
                  <p className="text-[12px] text-surface-400">JPG, PNG, PDF hingga 5MB</p>
                </div>
              </div>
              {proofFile && (
                <div className="mt-2">
                  <p className="text-[13px] text-surface-600">File terpilih: {proofFile.name}</p>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mt-2 max-h-40 rounded-xl border border-surface-200"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Catatan <span className="text-surface-400">(Opsional)</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Informasi tambahan..."
                className="input-base"
              />
            </div>

            {/* Confirmation */}
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-surface-300 rounded mt-1"
              />
              <label className="ml-2 text-[13px] text-surface-700">
                Saya mengonfirmasi bahwa pembayaran sudah dilakukan
              </label>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Mengirim...
                  </span>
                ) : (
                  'Kirim Pembayaran'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentSubmissionPage;
