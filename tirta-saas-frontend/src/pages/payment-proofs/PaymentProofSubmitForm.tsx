import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import invoiceService from '../../services/invoiceService';
import paymentProofService from '../../services/paymentProofService';
import type { Invoice } from '../../types/invoice';
import { extractApiErrorMessage } from '../../utils/apiError';

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
    } catch {
      /* ignore */
    }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
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

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setProofImage(file);
    setError('');

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
      setError('File bukti pembayaran wajib diunggah');
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

      setSuccess('Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.');

      setTimeout(() => {
        navigate('/admin/payments');
      }, 2000);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal mengirim bukti pembayaran'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[13px] text-surface-400">
        <button onClick={() => navigate('/admin/payments')} className="transition-colors hover:text-surface-600">
          Pembayaran
        </button>
        <span>/</span>
        <span className="font-medium text-surface-700">Kirim Bukti</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-surface-900">Kirim Bukti Pembayaran</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Unggah bukti pembayaran untuk tagihan yang belum dibayar.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-danger-200 bg-danger-50 p-4 text-[13px] text-danger-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-success-200 bg-success-50 p-4 text-[13px] text-success-700 flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Invoice Selection */}
            <div>
              <label className="label-base">
                Pilih Tagihan <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={formData.invoice_id}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="input-base mt-1.5"
              >
                <option value="">-- Pilih Tagihan --</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.customerName} - Rp {invoice.totalAmount.toLocaleString()} ({invoice.billingPeriod})
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Details */}
            {selectedInvoice && (
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                <h3 className="text-[14px] font-semibold text-brand-700 mb-2">Detail Tagihan</h3>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div className="text-brand-600">Nomor Tagihan:</div>
                  <div className="font-medium text-brand-800">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-brand-600">Pelanggan:</div>
                  <div className="font-medium text-brand-800">{selectedInvoice.customerName}</div>
                  <div className="text-brand-600">Total Tagihan:</div>
                  <div className="font-medium text-brand-800">Rp {selectedInvoice.totalAmount.toLocaleString()}</div>
                  <div className="text-brand-600">Sudah Dibayar:</div>
                  <div className="font-medium text-brand-800">Rp {selectedInvoice.amountPaid.toLocaleString()}</div>
                  <div className="text-brand-600">Sisa Tagihan:</div>
                  <div className="font-bold text-danger-600">Rp {(selectedInvoice.totalAmount - selectedInvoice.amountPaid).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="label-base">
                Nominal Pembayaran <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-base mt-1.5"
                placeholder="Masukkan nominal pembayaran"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="label-base">
                Tanggal Pembayaran <span className="text-danger-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="input-base mt-1.5"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="label-base">
                Metode Pembayaran <span className="text-danger-500">*</span>
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="input-base mt-1.5"
              >
                <option value="bank_transfer">Transfer Bank</option>
                <option value="e_wallet">E-Wallet (GoPay, OVO, Dana)</option>
                <option value="cash">Tunai</option>
              </select>
            </div>

            {/* Account Name */}
            <div>
              <label className="label-base">
                Nama Pemilik Rekening / Pembayar <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="input-base mt-1.5"
                placeholder="Nama pada rekening"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="label-base">Nomor Rekening (Opsional)</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="input-base mt-1.5"
                placeholder="Nomor rekening bank atau e-wallet"
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="label-base">Nomor Referensi (Opsional)</label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="input-base mt-1.5"
                placeholder="Nomor referensi transaksi"
              />
            </div>

            {/* Payment Proof Image */}
            <div>
              <label className="label-base">
                File Bukti Pembayaran <span className="text-danger-500">*</span>
              </label>
              <div className="mt-1.5 rounded-xl border-2 border-dashed border-surface-200 p-4 text-center">
                <CloudArrowUpIcon className="mx-auto h-10 w-10 text-surface-300" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="w-full mt-2"
                />
                <p className="text-[12px] text-surface-400 mt-2">
                  Format: JPG, PNG, PDF. Maksimal: 5MB
                </p>
              </div>

              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-64 object-contain rounded-xl border border-surface-200"
                  />
                </div>
              )}

              {proofImage && !imagePreview && (
                <div className="mt-3 rounded-xl border border-surface-100 bg-surface-50 p-3 text-[13px]">
                  📄 {proofImage.name} ({(proofImage.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="label-base">Catatan (Opsional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="input-base mt-1.5"
                placeholder="Catatan tambahan tentang pembayaran"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-surface-100 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/payments')}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !proofImage}
                className="btn-primary flex-1"
              >
                {loading ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofSubmitForm;
