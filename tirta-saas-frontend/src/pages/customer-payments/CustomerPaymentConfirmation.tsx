import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, useToast } from '../../components';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';
import { extractApiErrorMessage } from '../../utils/apiError';

interface PaymentConfirmationData {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  accountNumber: string;
  accountName: string;
  referenceNumber: string;
  notes: string;
  proofFile: File | null;
}

export default function CustomerPaymentConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  const { error: showErrorToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<PaymentConfirmationData>({
    invoiceId: invoiceId || '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    accountNumber: '',
    accountName: '',
    referenceNumber: '',
    notes: '',
    proofFile: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getCustomerInvoiceById(invoiceId!);
      setInvoice(data);
      setFormData((prev) => ({
        ...prev,
        amount: data.amountDue || data.totalAmount,
      }));
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memuat tagihan');
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  }, [invoiceId, showErrorToast]);

  useEffect(() => {
    if (invoiceId) {
      void loadInvoice();
    }
  }, [invoiceId, loadInvoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, proofFile: 'File harus berformat JPG, PNG, atau PDF' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, proofFile: 'Ukuran file maksimal 5MB' });
        return;
      }

      setFormData((prev) => ({ ...prev, proofFile: file }));

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }

      const newErrors = { ...errors };
      delete newErrors.proofFile;
      setErrors(newErrors);
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, proofFile: null }));
    setPreviewUrl(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.paymentDate) newErrors.paymentDate = 'Tanggal pembayaran wajib diisi';
    if (!formData.accountNumber) newErrors.accountNumber = 'Nomor rekening wajib diisi';
    if (!formData.accountName) newErrors.accountName = 'Nama rekening wajib diisi';
    if (!formData.proofFile) newErrors.proofFile = 'Bukti pembayaran wajib diunggah';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('invoice_id', formData.invoiceId);
      submitData.append('amount', formData.amount.toString());
      submitData.append('payment_date', formData.paymentDate);
      submitData.append('payment_method', formData.paymentMethod);
      submitData.append('account_number', formData.accountNumber);
      submitData.append('account_name', formData.accountName);
      submitData.append('reference_number', formData.referenceNumber);
      submitData.append('notes', formData.notes);
      if (formData.proofFile) {
        submitData.append('payment_proof', formData.proofFile);
      }

      // TODO: API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess(true);
      setTimeout(() => {
        navigate('/customer/payments/success?confirmed=true');
      }, 2000);
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal mengirim konfirmasi pembayaran');
      setError(message);
      showErrorToast(message);
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Memuat data tagihan...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi Pembayaran Terkirim!</h2>
          <p className="text-gray-600">Kami akan memverifikasi dalam 1-2 hari kerja</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Konfirmasi Pembayaran"
        subtitle="Unggah bukti transfer dan isi detail pembayaran untuk dikonfirmasi."
      />

      {error && (
        <div role="alert" className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400 mt-0.5" aria-hidden="true" />
          <p className="ml-3 text-sm text-red-800">{error}</p>
        </div>
      )}

      {invoice && (
        <div className="bg-indigo-50 rounded-lg p-6 border-l-4 border-indigo-600">
          <h2 className="font-semibold text-gray-900 mb-3">Tagihan {invoice.invoiceNumber}</h2>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(formData.amount)}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bukti Pembayaran <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!formData.proofFile ? (
              <div>
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                <label htmlFor="file-upload" className="mt-4 inline-block cursor-pointer">
                  <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center">
                    <CameraIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Pilih File
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">PNG, JPG, atau PDF maksimal 5MB</p>
              </div>
            ) : (
              <div className="relative">
                {previewUrl && (
                  <img src={previewUrl} alt="Pratinjau bukti pembayaran" className="max-h-64 mx-auto rounded-lg" />
                )}
                <button
                  type="button"
                  onClick={removeFile}
                  aria-label="Hapus file"
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          {errors.proofFile && <p className="mt-1 text-sm text-red-600">{errors.proofFile}</p>}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pembayaran <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>}
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Metode Pembayaran <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="bank_transfer">Transfer Bank</option>
              <option value="e_wallet">Dompet Digital (QRIS)</option>
            </select>
          </div>

          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Rekening Pengirim <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="mis. 1234567890"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>}
          </div>

          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Rekening Pengirim <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountName"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              placeholder="mis. Budi Santoso"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Nomor Referensi (Opsional)
          </label>
          <input
            type="text"
            id="referenceNumber"
            name="referenceNumber"
            value={formData.referenceNumber}
            onChange={handleChange}
            placeholder="Nomor referensi dari bank"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-between pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {submitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
          </button>
        </div>
      </form>
    </div>
  );
}
