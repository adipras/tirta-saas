import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService';

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
    navigate('/subscription/upgrade');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setError('');
    setProofFile(file);

    // Create preview for images
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
      setError('Please upload proof of payment');
      return;
    }

    if (!isConfirmed) {
      setError('Please confirm that you have completed the payment');
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

      // Success - navigate to status page
      alert(`Payment submitted successfully! Confirmation ID: ${response.confirmationId}`);
      navigate('/subscription/status');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit payment. Please try again.');
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
    <div className="max-w-4xl mx-auto py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Plan Selection
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Payment Info */}
        <div>
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium text-gray-900">{paymentState.planName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Billing Period:</span>
                <span className="font-medium text-gray-900">
                  {paymentState.billingPeriod} {paymentState.billingPeriod === 1 ? 'Month' : 'Months'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(paymentState.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Payment Instructions</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">Bank Transfer:</h4>
                <div className="bg-white rounded p-3 text-sm space-y-1">
                  <p><span className="font-medium">Bank:</span> BCA</p>
                  <p><span className="font-medium">Account:</span> 1234567890</p>
                  <p><span className="font-medium">Name:</span> PT Tirta SaaS Indonesia</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">E-Wallet (QRIS):</h4>
                <div className="bg-white rounded p-3">
                  <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">QR Code</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Confirmation</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="e-wallet">E-Wallet (QRIS)</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.paymentMethod === 'bank_transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Your bank account number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                placeholder="Name of account holder"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                placeholder="Transaction reference number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proof of Payment <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">JPG, PNG, PDF up to 5MB</p>
                </div>
              </div>
              {proofFile && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Selected: {proofFile.name}</p>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mt-2 max-h-40 rounded border border-gray-300"
                    />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label className="ml-2 text-sm text-gray-700">
                I confirm that I have completed the payment
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentSubmissionPage;
