import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import type { InvoiceDetails } from '../../types/invoice';
import paymentProofService, { type PaymentProof } from '../../services/paymentProofService';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  UserIcon,
  HashtagIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

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
    if (!invoiceId) return;
    try {
      setLoading(true);
      setError('');
      const data = await invoiceService.getCustomerInvoiceById(invoiceId);
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
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setImagePreview('');
      }
      setError('');
    }
  };

  const removeProof = () => {
    setProofImage(null);
    setImagePreview('');
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
      setTimeout(() => navigate('/customer/invoices'), 2000);
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal mengirim bukti pembayaran');
      setError(message);
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-96 animate-pulse rounded-xl bg-surface-100" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-danger-500" />
        </div>
        <p className="mb-6 text-[15px] font-medium text-surface-800">{error || 'Tagihan tidak ditemukan'}</p>
        <Link to="/customer/invoices" className="btn-secondary">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Kembali ke Daftar Tagihan
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
          <CheckCircleIcon className="h-10 w-10 text-success-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-surface-800">Berhasil!</h2>
        <p className="mb-6 text-center text-[14px] text-surface-500">
          Bukti pembayaran Anda telah dikirim dan sedang menunggu verifikasi admin.
        </p>
        {submittedProof && (
          <div className="mb-6 w-full max-w-md rounded-xl border border-info-200 bg-info-50 p-5">
            <p className="mb-3 text-[13px] font-semibold text-info-700">Snapshot nominal yang dikirim</p>
            <div className="space-y-2 text-[13px] text-info-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(submittedProof.snapshot_sub_total)}</span></div>
              <div className="flex justify-between"><span>Denda</span><span>{formatCurrency(submittedProof.snapshot_penalty_amount)}</span></div>
              <div className="flex justify-between border-t border-info-200 pt-2"><span>Total tagihan</span><span className="font-semibold">{formatCurrency(submittedProof.snapshot_total_amount)}</span></div>
              <div className="flex justify-between"><span>Nominal dikonfirmasi</span><span className="font-semibold text-info-700">{formatCurrency(submittedProof.amount)}</span></div>
            </div>
          </div>
        )}
        <p className="text-[13px] text-surface-400">Mengalihkan ke halaman tagihan...</p>
      </div>
    );
  }

  const amountDue = invoice.amountDue ?? invoice.totalAmount ?? 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <Link to="/customer/invoices" className="hover:text-surface-600">Tagihan</Link>
        <span>/</span>
        <span className="text-surface-700">Bayar</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-800">Bayar Tagihan</h1>
          <p className="mt-1 text-[13px] text-surface-400">Kirim konfirmasi pembayaran. Admin akan memverifikasi sesuai nominal snapshot saat Anda submit.</p>
        </div>
        <Link to="/customer/invoices" className="btn-secondary">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </div>

      {/* Invoice Details Card */}
      <div className="rounded-xl border border-surface-100 bg-surface-50 p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
            <DocumentTextIcon className="h-[18px] w-5 text-brand-500" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-surface-500">Detail Tagihan</p>
            <p className="text-[15px] font-semibold text-surface-800">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="space-y-3 border-t border-surface-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-surface-400">Periode</span>
            <span className="text-[14px] font-medium text-surface-700">{invoice.billingPeriod}</span>
          </div>
          <div className="flex items-center justify-between border-t border-surface-100 pt-3">
            <span className="text-[14px] font-medium text-surface-700">Sisa Tagihan Saat Ini</span>
            <span className="text-2xl font-bold text-brand-600">{formatCurrency(amountDue)}</span>
          </div>
          {(invoice.penaltyAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-[13px] text-danger-600">
              <span>Denda aktif saat ini</span>
              <span className="font-medium">{formatCurrency(invoice.penaltyAmount ?? 0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-500" />
          <p className="text-[13px] text-warning-700">
            Nominal final akan dibekukan saat Anda mengirim konfirmasi ini, berdasarkan{' '}
            <span className="font-semibold">tanggal pembayaran</span> yang Anda isi. Admin memverifikasi
            bukti bayar terhadap snapshot tersebut dan tidak menghitung ulang denda dari waktu approval.
          </p>
        </div>
      </div>

      {/* Payment Form */}
      <div className="card">
        <div className="border-b border-surface-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <BanknotesIcon className="h-[18px] w-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-surface-800">Form Konfirmasi Pembayaran</h2>
              <p className="text-[13px] text-surface-400">Isi data pembayaran dan unggah bukti transfer</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-danger-200 bg-danger-50 p-3 text-[13px] text-danger-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-100">
                <BanknotesIcon className="h-3.5 w-3.5 text-surface-500" />
              </span>
              Nominal yang Dikonfirmasi <span className="text-danger-500">*</span>
            </label>
            <input
              id="amount"
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-base"
              placeholder="Masukkan nominal yang dibayar"
            />
            <p className="mt-1.5 text-[12px] text-surface-400">
              Anda boleh kirim pembayaran penuh atau partial, maksimal {formatCurrency(amountDue)}.
            </p>
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="payment_date" className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-100">
                  <CalendarDaysIcon className="h-3.5 w-3.5 text-surface-500" />
                </span>
                Tanggal Pembayaran <span className="text-danger-500">*</span>
              </label>
              <input
                id="payment_date"
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="input-base"
              />
            </div>
            <div>
              <label htmlFor="payment_method" className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-100">
                  <BanknotesIcon className="h-3.5 w-3.5 text-surface-500" />
                </span>
                Metode Pembayaran
              </label>
              <select
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="input-base"
              >
                <option value="bank_transfer">Transfer Bank</option>
                <option value="e_wallet">E-Wallet</option>
                <option value="cash">Tunai</option>
              </select>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="account_name" className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-100">
                  <UserIcon className="h-3.5 w-3.5 text-surface-500" />
                </span>
                Nama Pengirim <span className="text-danger-500">*</span>
              </label>
              <input
                id="account_name"
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="input-base"
                placeholder="Nama sesuai rekening/e-wallet"
              />
            </div>
            <div>
              <label htmlFor="account_number" className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-100">
                  <HashtagIcon className="h-3.5 w-3.5 text-surface-500" />
                </span>
                No. Rekening/E-Wallet <span className="text-[12px] font-normal text-surface-400">(Opsional)</span>
              </label>
              <input
                id="account_number"
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="input-base"
              />
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="reference_number" className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-100">
                  <HashtagIcon className="h-3.5 w-3.5 text-surface-500" />
                </span>
                No. Referensi <span className="text-[12px] font-normal text-surface-400">(Opsional)</span>
              </label>
              <input
                id="reference_number"
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="input-base"
                placeholder="No. transaksi/referensi"
              />
            </div>
            <div>
              <label htmlFor="notes" className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-100">
                  <DocumentTextIcon className="h-3.5 w-3.5 text-surface-500" />
                </span>
                Catatan <span className="text-[12px] font-normal text-surface-400">(Opsional)</span>
              </label>
              <textarea
                id="notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-base resize-none"
              />
            </div>
          </div>

          {/* Upload Proof */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-[13px] font-medium text-surface-700">
              Bukti Pembayaran <span className="text-danger-500">*</span>
            </label>
            <p className="mb-3 text-[12px] text-surface-400">Format: JPG, PNG, atau PDF. Maks 5MB.</p>

            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Pratinjau bukti" className="h-48 rounded-xl border border-surface-200 object-contain" />
                <button
                  type="button"
                  onClick={removeProof}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger-500 text-white shadow-sm hover:bg-danger-600"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-surface-200 bg-surface-50 px-6 py-8 transition-colors hover:border-brand-300 hover:bg-brand-50/30">
                <CloudArrowUpIcon className="mb-2 h-8 w-8 text-surface-300" />
                <span className="text-[13px] font-medium text-surface-500">Klik untuk upload atau drag & drop</span>
                <span className="mt-1 text-[12px] text-surface-400">JPG, PNG, atau PDF (Maks 5MB)</span>
                <input type="file" accept="image/jpeg,image/jpg,image/png,application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
            )}
            {proofImage && !imagePreview && (
              <p className="mt-2 text-[13px] text-surface-600">Berkas: {proofImage.name}</p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-surface-100 bg-surface-50/50 px-6 py-4">
          <Link to="/customer/invoices" className="btn-secondary">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Kembali
          </Link>
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengirim...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="mr-2 h-4 w-4" />
                Kirim Bukti Pembayaran
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerPayInvoice;
