import React, { useState } from 'react';
import paymentProofService from '../../services/paymentProofService';
import type { PaymentProof } from '../../services/paymentProofService';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

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
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memverifikasi pembayaran'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Menunggu';
      case 'VERIFIED': return 'Terverifikasi';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Transfer bank';
      case 'e_wallet': return 'E-wallet';
      case 'cash': return 'Tunai';
      default: return method.replace('_', ' ');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Alasan penolakan wajib diisi');
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
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal menolak pembayaran'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'ring-warning-200/60 bg-warning-50 text-warning-700';
      case 'VERIFIED': return 'ring-success-200/60 bg-success-50 text-success-700';
      case 'REJECTED': return 'ring-danger-200/60 bg-danger-50 text-danger-700';
      default: return 'ring-surface-200/60 bg-surface-50 text-surface-600';
    }
  };

  const isPending = proof.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-surface-100 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-surface-900">Detail Bukti Pembayaran</h2>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-600 text-2xl leading-none"
            aria-label="Tutup detail bukti pembayaran"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 p-5">
          {error && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-700">
              {error}
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-surface-500">Status:</span>
            <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-medium ring-1 ring-inset ${getStatusColor(proof.status)}`}>
              {getStatusLabel(proof.status)}
            </span>
          </div>

          {/* Invoice Info */}
          <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
            <h3 className="text-[14px] font-semibold text-surface-800 mb-3">Informasi Tagihan</h3>
            <div className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
              <div className="text-surface-400">Nomor Tagihan:</div>
              <div className="font-medium text-surface-700">{proof.invoice_number}</div>
              <div className="text-surface-400">Pelanggan:</div>
              <div className="font-medium text-surface-700">{proof.customer_name}</div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-xl border border-surface-100 bg-surface-50/50 p-4">
            <h3 className="text-[14px] font-semibold text-surface-800 mb-3">Detail Pembayaran</h3>
            <div className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
              <div className="text-surface-400">Nominal:</div>
              <div className="font-bold text-success-600">Rp {proof.amount.toLocaleString()}</div>
              <div className="text-surface-400">Tanggal Pembayaran:</div>
              <div className="font-medium text-surface-700">{new Date(proof.payment_date).toLocaleDateString('id-ID')}</div>
              <div className="text-surface-400">Metode Pembayaran:</div>
              <div className="font-medium text-surface-700">{getPaymentMethodLabel(proof.payment_method)}</div>
              <div className="text-surface-400">Nama Pemilik Rekening:</div>
              <div className="font-medium text-surface-700">{proof.account_name}</div>
              {proof.account_number && (
                <>
                  <div className="text-surface-400">Nomor Rekening:</div>
                  <div className="font-medium text-surface-700">{proof.account_number}</div>
                </>
              )}
              {proof.reference_number && (
                <>
                  <div className="text-surface-400">Nomor Referensi:</div>
                  <div className="font-medium text-surface-700">{proof.reference_number}</div>
                </>
              )}
            </div>
          </div>

          {/* Payment Proof Image */}
          <div>
            <h3 className="text-[14px] font-semibold text-surface-800 mb-3">Bukti Pembayaran</h3>
            <div className="rounded-xl border border-surface-200 overflow-hidden">
              {proof.proof_image_url.endsWith('.pdf') ? (
                <div className="p-6 text-center">
                  <p className="text-[13px] text-surface-500 mb-3">File bukti pembayaran berupa PDF.</p>
                  <a
                    href={proof.proof_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 text-[13px] font-medium"
                  >
                    Buka PDF
                  </a>
                </div>
              ) : (
                <img
                  src={proof.proof_image_url}
                  alt="Bukti pembayaran"
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
              className="text-brand-600 hover:text-brand-700 text-[13px] mt-2 inline-block"
            >
              Buka di tab baru →
            </a>
          </div>

          {/* Notes */}
          {proof.notes && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <h3 className="text-[13px] font-semibold text-brand-700 mb-1">Catatan Pelanggan</h3>
              <p className="text-[13px] text-brand-600">{proof.notes}</p>
            </div>
          )}

          {/* Submission Info */}
          <div className="text-[12px] text-surface-400">
            <div>Dikirim: {new Date(proof.submitted_at).toLocaleString('id-ID')}</div>
            {proof.verified_at && (
              <div>Diproses: {new Date(proof.verified_at).toLocaleString('id-ID')}</div>
            )}
          </div>

          {/* Rejection Reason */}
          {proof.status === 'REJECTED' && proof.rejection_reason && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
              <h3 className="text-[13px] font-semibold text-danger-700 mb-1">Alasan Penolakan</h3>
              <p className="text-[13px] text-danger-600">{proof.rejection_reason}</p>
            </div>
          )}

          {/* Verify/Reject Actions */}
          {isPending && !action && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setAction('verify')}
                className="flex-1 rounded-xl bg-success-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-success-700"
              >
                ✓ Verifikasi Pembayaran
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 rounded-xl bg-danger-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-danger-700"
              >
                ✗ Tolak Pembayaran
              </button>
            </div>
          )}

          {/* Verify Form */}
          {action === 'verify' && (
            <div className="rounded-xl border border-success-200 bg-success-50 p-4 space-y-4">
              <h3 className="text-[14px] font-semibold text-success-700">Verifikasi Pembayaran</h3>
              <div>
                <label className="label-base">Catatan Verifikasi (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input-base mt-1.5"
                  placeholder="Tambahkan catatan verifikasi jika perlu..."
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setAction(null)}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-success-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-success-700 disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Konfirmasi Verifikasi'}
                </button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {action === 'reject' && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 space-y-4">
              <h3 className="text-[14px] font-semibold text-danger-700">Tolak Pembayaran</h3>
              <div>
                <label className="label-base">
                  Alasan Penolakan <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="input-base mt-1.5"
                  placeholder="Jelaskan alasan pembayaran ini ditolak..."
                  required
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setAction(null)}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 rounded-xl bg-danger-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-danger-700 disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Konfirmasi Penolakan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-100 bg-surface-50/50 px-5 py-4">
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofDetailModal;
