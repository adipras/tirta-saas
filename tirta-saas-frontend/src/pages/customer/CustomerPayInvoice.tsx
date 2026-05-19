import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import type { InvoiceDetails } from '../../types/invoice';
import paymentProofService, { type PaymentProof } from '../../services/paymentProofService';
import { PageHeader, useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

const CustomerPayInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const {
    error: showErrorToast,
    warning: showWarningToast,
    success: showSuccessToast,
  } = useToast();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
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

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await invoiceService.getInvoiceById(invoiceId);
      setInvoice(data);
      setFormData((prev) => ({
        ...prev,
        amount: String(data.amountDue ?? data.totalAmount ?? ''),
      }));
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memuat data tagihan');
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [invoiceId, showErrorToast]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        const message = 'Ukuran file maksimal 5MB';
        setError(message);
        showWarningToast(message);
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        const message = 'Format file harus JPG, PNG, atau PDF';
        setError(message);
        showWarningToast(message);
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
      const message = 'Silakan upload bukti pembayaran';
      setError(message);
      showWarningToast(message);
      return;
    }

    if (!invoice) return;

    const parsedAmount = Number(formData.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      const message = 'Masukkan nominal pembayaran yang valid';
      setError(message);
      showWarningToast(message);
      return;
    }

    const maxAmount = invoice.amountDue ?? invoice.totalAmount ?? 0;
    if (parsedAmount > maxAmount) {
      const message = 'Nominal pembayaran tidak boleh melebihi sisa tagihan saat ini';
      setError(message);
      showWarningToast(message);
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
      showSuccessToast('Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi admin.');
      setTimeout(() => {
        navigate('/customer/invoices');
      }, 2000);
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal mengirim bukti pembayaran');
      setError(message);
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Memuat data tagihan...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-md">
        <p className="mb-4 text-red-600">{error || 'Tagihan tidak ditemukan'}</p>
        <Link to="/customer/invoices" className="text-indigo-600 hover:text-indigo-700">
          Kembali ke Daftar Tagihan
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CloudArrowUpIcon className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Berhasil!</h2>
        <p className="mb-4 text-gray-600">
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
    );
  }

  const amountDue = invoice.amountDue ?? invoice.totalAmount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bayar Tagihan"
        subtitle="Kirim konfirmasi pembayaran. Admin akan memverifikasi sesuai nominal snapshot saat Anda submit."
        actions={
          <Link
            to="/customer/invoices"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Tagihan
          </Link>
        }
      />

      {/* Invoice Details */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Detail Tagihan</h3>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <span className="text-gray-600">No. Invoice</span>
            <span className="font-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-gray-600">Periode</span>
            <span className="font-medium">{invoice.billingPeriod}</span>
          </div>
          <div className="flex items-start justify-between gap-3 border-t pt-2 text-lg font-bold">
            <span>Sisa Tagihan Saat Ini</span>
            <span className="text-indigo-600">{formatCurrency(amountDue)}</span>
          </div>
          {(invoice.penaltyAmount ?? 0) > 0 && (
            <div className="flex items-start justify-between gap-3 text-sm text-red-600">
              <span>Denda aktif saat ini</span>
              <span>{formatCurrency(invoice.penaltyAmount ?? 0)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Nominal final akan dibekukan saat Anda mengirim konfirmasi ini, berdasarkan{' '}
        <span className="font-semibold">tanggal pembayaran</span> yang Anda isi. Admin memverifikasi
        bukti bayar terhadap snapshot tersebut dan tidak menghitung ulang denda dari waktu approval.
      </div>

      {/* Payment Form */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Form Konfirmasi Pembayaran</h3>

        {error && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-gray-700">
              Nominal yang Dikonfirmasi
            </label>
            <input
              id="amount"
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan nominal yang dibayar"
            />
            <p className="mt-1 text-xs text-gray-500">
              Anda boleh kirim pembayaran penuh atau partial, maksimal {formatCurrency(amountDue)}.
            </p>
          </div>

          <div>
            <label
              htmlFor="payment_date"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Tanggal Pembayaran
            </label>
            <input
              id="payment_date"
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="payment_method"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Metode Pembayaran
            </label>
            <select
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="bank_transfer">Transfer Bank</option>
              <option value="e_wallet">E-Wallet</option>
              <option value="cash">Tunai</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="account_name"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Nama Pengirim
            </label>
            <input
              id="account_name"
              type="text"
              required
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nama sesuai rekening/e-wallet"
            />
          </div>

          <div>
            <label
              htmlFor="account_number"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              No. Rekening/E-Wallet{' '}
              <span className="font-normal text-gray-400">(Opsional)</span>
            </label>
            <input
              id="account_number"
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="reference_number"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              No. Referensi{' '}
              <span className="font-normal text-gray-400">(Opsional)</span>
            </label>
            <input
              id="reference_number"
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="No. transaksi/referensi"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Catatan{' '}
              <span className="font-normal text-gray-400">(Opsional)</span>
            </label>
            <textarea
              id="notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Bukti Pembayaran <span className="text-red-500">*</span>
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
                <CloudArrowUpIcon className="mb-2 h-12 w-12 text-gray-400" />
                <span className="text-sm text-gray-600">Klik untuk upload atau drag & drop</span>
                <span className="mt-1 text-xs text-gray-500">JPG, PNG, atau PDF (Maks. 5MB)</span>
              </label>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Pratinjau bukti pembayaran"
                    className="mx-auto max-h-48 rounded-lg"
                  />
                </div>
              )}
              {proofImage && !imagePreview && (
                <div className="mt-4 text-sm text-gray-700">Berkas: {proofImage.name}</div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerPayInvoice;
