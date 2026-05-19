import React, { useState } from 'react';
import paymentProofService from '../../services/paymentProofService';
import type { PaymentProof } from '../../services/paymentProofService';
import { useToast } from '../../components';

interface PaymentProofDetailModalProps {
  proof: PaymentProof | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentProofDetailModal: React.FC<PaymentProofDetailModalProps> = ({
  proof,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'verify' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  if (!proof) return null;

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await paymentProofService.verifyPaymentProof(proof.id, {
        notes: notes || undefined,
      });
      toast.success('Pembayaran berhasil diverifikasi!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await paymentProofService.rejectPaymentProof(proof.id, {
        rejection_reason: rejectionReason,
      });
      toast.success('Pembayaran berhasil ditolak');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'VERIFIED': return 'text-green-600 bg-green-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isPending = proof.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-4 sm:px-6">
          <h2 className="text-lg font-bold sm:text-xl">Payment Proof Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-4 sm:p-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(proof.status)}`}>
              {proof.status}
            </span>
          </div>

          {/* Invoice Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Invoice Information</h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="text-gray-600">Invoice Number:</div>
              <div className="font-medium">{proof.invoice_number}</div>
              <div className="text-gray-600">Customer:</div>
              <div className="font-medium">{proof.customer_name}</div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Payment Details</h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="text-gray-600">Amount:</div>
              <div className="font-bold text-green-600">Rp {proof.amount.toLocaleString()}</div>
              <div className="text-gray-600">Payment Date:</div>
              <div className="font-medium">{new Date(proof.payment_date).toLocaleDateString('id-ID')}</div>
              <div className="text-gray-600">Payment Method:</div>
              <div className="font-medium capitalize">{proof.payment_method.replace('_', ' ')}</div>
              <div className="text-gray-600">Account Name:</div>
              <div className="font-medium">{proof.account_name}</div>
              {proof.account_number && (
                <>
                  <div className="text-gray-600">Account Number:</div>
                  <div className="font-medium">{proof.account_number}</div>
                </>
              )}
              {proof.reference_number && (
                <>
                  <div className="text-gray-600">Reference Number:</div>
                  <div className="font-medium">{proof.reference_number}</div>
                </>
              )}
            </div>
          </div>

          {/* Payment Proof Image */}
          <div>
            <h3 className="font-semibold mb-3">Payment Proof Image</h3>
            <div className="border rounded-lg overflow-hidden">
              {proof.proof_image_url.endsWith('.pdf') ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-600 mb-3">File bukti pembayaran berupa PDF.</p>
                  <a
                    href={proof.proof_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Buka PDF
                  </a>
                </div>
              ) : (
                <img
                  src={proof.proof_image_url}
                  alt="Payment Proof"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                  }}
                />
              )}
            </div>
            <a
              href={proof.proof_image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            >
              Open in new tab →
            </a>
          </div>

          {/* Notes */}
          {proof.notes && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-900">Customer Notes</h3>
              <p className="text-sm text-blue-800">{proof.notes}</p>
            </div>
          )}

          {/* Submission Info */}
          <div className="text-sm text-gray-600">
            <div>Submitted: {new Date(proof.submitted_at).toLocaleString('id-ID')}</div>
            {proof.verified_at && (
              <div>Processed: {new Date(proof.verified_at).toLocaleString('id-ID')}</div>
            )}
          </div>

          {/* Rejection Reason (if rejected) */}
          {proof.status === 'REJECTED' && proof.rejection_reason && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold mb-2 text-red-900">Rejection Reason</h3>
              <p className="text-sm text-red-800">{proof.rejection_reason}</p>
            </div>
          )}

          {/* Verify/Reject Actions (only for PENDING) */}
          {isPending && !action && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setAction('verify')}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                ✓ Verify Payment
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                ✗ Reject Payment
              </button>
            </div>
          )}

          {/* Verify Form */}
          {action === 'verify' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
              <h3 className="font-semibold text-green-900">Verify Payment</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Add any notes about this verification..."
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setAction(null)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Confirm Verification'}
                </button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {action === 'reject' && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-4">
              <h3 className="font-semibold text-red-900">Reject Payment</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Explain why this payment is being rejected..."
                  required
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setAction(null)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-4 sm:px-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofDetailModal;
