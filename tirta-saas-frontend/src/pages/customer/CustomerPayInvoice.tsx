import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import customerAuthService from '../../services/customerAuthService';
import customerPortalService, { type CustomerInvoice } from '../../services/customerPortalService';
import paymentProofService, { type PaymentProof } from '../../services/paymentProofService';

const CustomerPayInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<CustomerInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedProof, setSubmittedProof] = useState<PaymentProof | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    account_name: '',
    account_number: '',
    reference_number: '',
    notes: '',
  });

  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) {
      navigate('/customer/login');
      return;
    }
    loadInvoice();
  }, [navigate, invoiceId]);

  const loadInvoice = async () => {
    try {
      const invoices = await customerPortalService.getTagihan();
      const found = invoices.find((inv) => inv.id === invoiceId);
      if (found) {
        setInvoice(found);
        setFormData((prev) => ({
          ...prev,
          amount: found.remaining_amount.toString(),
        }));
      } else {
        setError('Invoice tidak ditemukan');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format file harus JPG, PNG, atau PDF');
        return;
      }

      setProofImage(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview('');
      }
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!proofImage) {
      setError('Silakan upload bukti pembayaran');
      return;
    }

    if (!invoice) return;

    const parsedAmount = Number(formData.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Masukkan nominal pembayaran yang valid');
      return;
    }

    if (parsedAmount > invoice.remaining_amount) {
      setError('Nominal pembayaran tidak boleh melebihi sisa tagihan saat ini');
      return;
    }

    setSubmitting(true);

    try {
      const proof = await paymentProofService.submitPaymentProof({
        invoice_id: invoice.id,
        amount: parsedAmount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        account_name: formData.account_name,
        account_number: formData.account_number || undefined,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        proof_image: proofImage,
      });

      setSubmittedProof(proof);
      setSuccess(true);
      setTimeout(() => {
        navigate('/customer/invoices');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Gagal mengirim bukti pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Memuat...</div>;
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <p className="text-red-600 mb-4">{error || 'Invoice tidak ditemukan'}</p>
          <Link to="/customer/invoices" className="text-indigo-600 hover:text-indigo-700">
            Kembali ke Tagihan
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudArrowUpIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Berhasil!</h2>
          <p className="text-gray-600 mb-4">
            Bukti pembayaran Anda telah dikirim dan sedang menunggu verifikasi admin.
          </p>
          {submittedProof && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left text-sm text-blue-900">
              <p className="font-semibold">Snapshot nominal yang dikirim</p>
              <div className="mt-2 space-y-1">
                <p>Subtotal: {formatCurrency(submittedProof.snapshot_sub_total)}</p>
                <p>Denda: {formatCurrency(submittedProof.snapshot_penalty_amount)}</p>
                <p>Total tagihan: {formatCurrency(submittedProof.snapshot_total_amount)}</p>
                <p>Nominal yang Anda konfirmasi: {formatCurrency(submittedProof.amount)}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">Mengalihkan ke halaman tagihan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/customer/invoices" className="text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bayar Tagihan</h1>
              <p className="text-sm text-gray-600">Kirim konfirmasi pembayaran. Admin akan memverifikasi sesuai nominal snapshot saat Anda submit.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Invoice Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Tagihan</h3>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">No. Invoice</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">Periode</span>
              <span className="font-medium">
                {invoice.usage_month} {invoice.usage_year}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 border-t pt-2 text-lg font-bold">
              <span>Sisa Tagihan Saat Ini</span>
              <span className="text-indigo-600">
                {formatCurrency(invoice.remaining_amount)}
              </span>
            </div>
            {invoice.penalty_amount > 0 && (
              <div className="flex items-start justify-between gap-3 text-sm text-red-600">
                <span>Denda aktif saat ini</span>
                <span>{formatCurrency(invoice.penalty_amount)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Nominal final akan dibekukan saat Anda mengirim konfirmasi ini, berdasarkan
          <span className="font-semibold"> tanggal pembayaran</span> yang Anda isi. Admin memverifikasi
          bukti bayar terhadap snapshot tersebut dan tidak menghitung ulang denda dari waktu approval.
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Konfirmasi Pembayaran</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal yang Dikonfirmasi
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Masukkan nominal yang dibayar"
              />
              <p className="mt-1 text-xs text-gray-500">
                Anda boleh kirim pembayaran penuh atau partial, maksimal {formatCurrency(invoice.remaining_amount)}.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bank_transfer">Transfer Bank</option>
                <option value="e_wallet">E-Wallet</option>
                <option value="cash">Tunai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pengirim
              </label>
              <input
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Nama sesuai rekening/e-wallet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Rekening/E-Wallet (Opsional)
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. Referensi (Opsional)
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="No. transaksi/referensi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bukti Pembayaran *
              </label>
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="flex cursor-pointer flex-col items-center"
                >
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Klik untuk upload atau drag & drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPG, PNG, atau PDF (Maks. 5MB)
                  </span>
                </label>
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-48 rounded-lg"
                    />
                  </div>
                )}
                {proofImage && !imagePreview && (
                  <div className="mt-4 text-sm text-gray-700">
                    File: {proofImage.name}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 font-medium"
            >
              {submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerPayInvoice;
