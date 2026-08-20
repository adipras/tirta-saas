import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  BanknotesIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

interface PaymentConfirmationData {
  invoice: {
    id: string;
    invoice_number: string;
    amount: number;
    due_date: string;
    description: string;
    customer?: {
      name: string;
    };
  };
  payment?: {
    id: string;
    payment_date: string;
    amount: number;
    method: string;
    reference_number?: string;
    notes?: string;
    status: string;
    payment_proof_url?: string;
  };
}

export default function CustomerPaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const invoiceId = searchParams.get('invoice_id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<PaymentConfirmationData | null>(null);
  const [error, setError] = useState('');

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (!invoiceId) {
      setError('Invoice ID tidak ditemukan');
      setLoading(false);
      return;
    }
    fetchData();
  }, [invoiceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use existing services instead of direct api calls
      const { invoiceService } = await import('../../services/invoiceService');
      const invoiceData = await invoiceService.getCustomerInvoiceById(invoiceId!);
      setData({
        invoice: {
          id: invoiceData.id,
          invoice_number: invoiceData.invoiceNumber,
          amount: invoiceData.totalAmount,
          due_date: invoiceData.dueDate,
          description: '',
        },
        payment: undefined,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(extractApiErrorMessage(err, 'Gagal memuat data'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('Ukuran file maksimal 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showErrorToast('File harus berupa gambar');
        return;
      }
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setProofPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.invoice) return;

    if (!proofFile) {
      showErrorToast('Bukti pembayaran wajib diunggah');
      return;
    }

    try {
      setSubmitting(true);
      const paymentProofService = (await import('../../services/paymentProofService')).default;
      await paymentProofService.submitPaymentProof({
        invoice_id: data.invoice.id,
        amount: data.invoice.amount,
        payment_date: paymentDate,
        payment_method: 'bank_transfer',
        account_name: bankName,
        account_number: accountNumber || undefined,
        notes: notes || undefined,
        proof_image: proofFile,
      });

      showSuccessToast('Bukti pembayaran berhasil dikirim!');
      navigate('/customer/payments/history');
    } catch (err: unknown) {
      console.error('Error submitting payment:', err);
      showErrorToast(extractApiErrorMessage(err, 'Gagal mengirim bukti pembayaran'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="h-80 animate-pulse rounded-xl bg-surface-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-danger-500" />
        </div>
        <p className="mb-6 text-[15px] font-medium text-surface-800">{error || 'Data tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/customer/invoices')}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2 text-[13px] font-medium text-surface-600 transition-colors hover:bg-surface-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali ke Tagihan
        </button>
      </div>
    );
  }

  const invoice = data.invoice;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <button onClick={() => navigate('/customer/invoices')} className="hover:text-surface-600">
          Tagihan
        </button>
        <span>/</span>
        <span className="text-surface-700">Bayar</span>
      </nav>

      {/* Invoice Summary Card */}
      <div className="rounded-xl border border-surface-100 bg-surface-50 p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
            <DocumentTextIcon className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-surface-500">Tagihan</p>
            <p className="text-[15px] font-semibold text-surface-800">{invoice.invoice_number}</p>
          </div>
        </div>
        <div className="flex items-end justify-between border-t border-surface-100 pt-3">
          <div>
            <p className="text-[12px] text-surface-400">Jumlah yang harus dibayar</p>
            <p className="text-2xl font-bold text-surface-800">
              Rp {invoice.amount.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-surface-400">Jatuh Tempo</p>
            <p className="text-[14px] font-medium text-surface-700">
              {new Date(invoice.due_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="border-b border-surface-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <BanknotesIcon className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-surface-800">Formulir Konfirmasi Pembayaran</h2>
              <p className="text-[13px] text-surface-400">Isi data pembayaran dan unggah bukti transfer</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Payment Date */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-surface-700">
              Tanggal Pembayaran <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-[13px] text-surface-800 placeholder-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Bank Transfer Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-surface-700">
                Nama Bank <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: BCA, Mandiri, BRI"
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-[13px] text-surface-800 placeholder-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-surface-700">
                Nomor Rekening <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Nomor rekening pengirim"
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-[13px] text-surface-800 placeholder-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Upload Proof */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-surface-700">
              Bukti Pembayaran <span className="text-danger-500">*</span>
            </label>
            <p className="mb-3 text-[12px] text-surface-400">
              Unggah bukti transfer (screenshot/struk). Format: JPG, PNG. Maks 5MB.
            </p>

            {proofPreview ? (
              <div className="relative inline-block">
                <img
                  src={proofPreview}
                  alt="Bukti pembayaran"
                  className="h-48 rounded-xl border border-surface-200 object-contain"
                />
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
                <PhotoIcon className="mb-2 h-8 w-8 text-surface-300" />
                <span className="text-[13px] font-medium text-surface-500">Klik untuk unggah bukti</span>
                <span className="mt-1 text-[12px] text-surface-400">JPG, PNG (Maks 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-surface-700">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan untuk admin..."
              rows={3}
              className="w-full resize-none rounded-lg border border-surface-200 px-3 py-2 text-[13px] text-surface-800 placeholder-surface-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-surface-100 bg-surface-50/50 px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/customer/invoices')}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2 text-[13px] font-medium text-surface-600 transition-colors hover:bg-surface-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengirim...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4" />
                Kirim Bukti Pembayaran
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
