import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';

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

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(invoiceId!);
      setInvoice(data);
      setFormData((prev) => ({
        ...prev,
        amount: data.amountDue || data.totalAmount,
      }));
    } catch (err: any) {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

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
        setErrors({ ...errors, proofFile: 'File must be JPG, PNG, or PDF' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, proofFile: 'File size must not exceed 5MB' });
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
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';
    if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (!formData.accountName) newErrors.accountName = 'Account name is required';
    if (!formData.proofFile) newErrors.proofFile = 'Payment proof is required';
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
    } catch (err: any) {
      setError('Failed to submit payment confirmation');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmation Submitted!</h2>
          <p className="text-gray-600">We will verify within 1-2 business days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">Confirm Payment</h1>
        <p className="text-gray-600 mt-1">Upload proof and fill details</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 text-red-400 mt-0.5" />
          <p className="ml-3 text-sm text-red-800">{error}</p>
        </div>
      )}

      {invoice && (
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
          <h2 className="font-semibold text-gray-900 mb-3">Invoice {invoice.invoiceNumber}</h2>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(formData.amount)}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Proof <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!formData.proofFile ? (
              <div>
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <label htmlFor="file-upload" className="mt-4 inline-block cursor-pointer">
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center">
                    <CameraIcon className="h-5 w-5 mr-2" />
                    Choose File
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">PNG, JPG, or PDF up to 5MB</p>
              </div>
            ) : (
              <div className="relative">
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                )}
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          {errors.proofFile && <p className="mt-1 text-sm text-red-600">{errors.proofFile}</p>}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="e_wallet">E-Wallet (QRIS)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="e.g., 1234567890"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference Number (Optional)
          </label>
          <input
            type="text"
            name="referenceNumber"
            value={formData.referenceNumber}
            onChange={handleChange}
            placeholder="Transaction ref from bank"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-between pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {submitting ? 'Submitting...' : 'Submit Confirmation'}
          </button>
        </div>
      </form>
    </div>
  );
}
