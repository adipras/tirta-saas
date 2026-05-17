import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import invoiceService from '../../services/invoiceService';
import paymentProofService from '../../services/paymentProofService';
import type { Invoice } from '../../types/invoice';

const PaymentProofSubmitForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoices, setTagihan] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const [formData, setFormData] = useState({
    invoice_id: '',
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUnpaidTagihan();
  }, []);

  const fetchUnpaidTagihan = async () => {
    try {
      const response = await invoiceService.getTagihan(1, 100, {
        status: 'unpaid',
      });
      setTagihan(response.data || []);
    } catch { /* ignore */ }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    setSelectedInvoice(invoice || null);
    setFormData({
      ...formData,
      invoice_id: invoiceId,
      amount: invoice ? (invoice.totalAmount - invoice.amountPaid).toString() : '',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setProofImage(file);
    setError('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proofImage) {
      setError('Payment proof image is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await paymentProofService.submitPaymentProof({
        invoice_id: formData.invoice_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        account_name: formData.account_name,
        account_number: formData.account_number || undefined,
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        proof_image: proofImage,
      });

      setSuccess('Payment proof submitted successfully! Waiting for admin verification.');
      
      // Reset form
      setTimeout(() => {
        navigate('/admin/payments');
      }, 2000);
    } catch  {
      setError(err.response?.data?.error || 'Failed to submit payment proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Submit Payment Proof</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Invoice <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.invoice_id}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Invoice --</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} - {invoice.customerName} - Rp {invoice.totalAmount.toLocaleString()} ({invoice.billingPeriod})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Details (if selected) */}
          {selectedInvoice && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Invoice Number:</div>
                <div className="font-medium">{selectedInvoice.invoiceNumber}</div>
                <div>Customer:</div>
                <div className="font-medium">{selectedInvoice.customerName}</div>
                <div>Total Amount:</div>
                <div className="font-medium">Rp {selectedInvoice.totalAmount.toLocaleString()}</div>
                <div>Already Paid:</div>
                <div className="font-medium">Rp {selectedInvoice.amountPaid.toLocaleString()}</div>
                <div>Remaining:</div>
                <div className="font-bold text-red-600">Rp {(selectedInvoice.totalAmount - selectedInvoice.amountPaid).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter payment amount"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="e_wallet">E-Wallet (GoPay, OVO, Dana)</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name / Payer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name on the account"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number (Optional)
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bank account or e-wallet number"
            />
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transaction reference number"
            />
          </div>

          {/* Payment Proof Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Proof Image <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileChange}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Allowed: JPG, PNG, PDF. Max size: 5MB
              </p>
            </div>
            
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-64 object-contain border rounded"
                />
              </div>
            )}
            
            {proofImage && !imagePreview && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  📄 {proofImage.name} ({(proofImage.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about the payment"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !proofImage}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentProofSubmitForm;
