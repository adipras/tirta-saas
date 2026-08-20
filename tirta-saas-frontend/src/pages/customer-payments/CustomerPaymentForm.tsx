import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useToast, CardSkeleton, FormSkeleton } from '../../components';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import type { Invoice } from '../../types/invoice';
import { extractApiErrorMessage } from '../../utils/apiError';

type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'e_wallet';

interface PaymentFormData {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export default function CustomerPaymentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedInvoiceId = searchParams.get('invoice');
  const { error: showErrorToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setTagihan] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState<PaymentFormData>({
    invoiceId: '',
    amount: 0,
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadUnpaidTagihan = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getCustomerTagihan();
      const unpaid = data.filter((inv) => inv.status !== 'paid');
      setTagihan(unpaid);
      setError(null);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat tagihan'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInvoiceSelect = useCallback(
    (invoiceId: string) => {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
        setFormData((prev) => ({
          ...prev,
          invoiceId,
          amount: invoice.amountDue,
        }));
      }
    },
    [invoices]
  );

  useEffect(() => {
    void loadUnpaidTagihan();
  }, [loadUnpaidTagihan]);

  useEffect(() => {
    if (preSelectedInvoiceId && invoices.length > 0) {
      handleInvoiceSelect(preSelectedInvoiceId);
    }
  }, [handleInvoiceSelect, preSelectedInvoiceId, invoices]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'invoiceId') {
      handleInvoiceSelect(value);
    } else if (name === 'amount') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceId) {
      newErrors.invoiceId = 'Pilih tagihan terlebih dahulu';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Nominal harus lebih dari 0';
    } else if (selectedInvoice && formData.amount > selectedInvoice.amountDue) {
      newErrors.amount = 'Nominal tidak boleh melebihi sisa tagihan';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Pilih metode pembayaran';
    }

    if (formData.paymentMethod !== 'cash' && !formData.referenceNumber) {
      newErrors.referenceNumber = 'Nomor referensi wajib diisi untuk pembayaran non-tunai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await paymentService.createCustomerPayment({
        invoiceId: formData.invoiceId,
        amount: formData.amount,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      });

      navigate('/customer/payments/success', {
        state: {
          invoice: selectedInvoice,
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
        },
      });
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memproses pembayaran');
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

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <BanknotesIcon className="h-5 w-5" />;
      case 'bank_transfer':
        return <BuildingLibraryIcon className="h-5 w-5" />;
      case 'credit_card':
      case 'debit_card':
        return <CreditCardIcon className="h-5 w-5" />;
      case 'e_wallet':
        return <DevicePhoneMobileIcon className="h-5 w-5" />;
      default:
        return <CreditCardIcon className="h-5 w-5" />;
    }
  };

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Transfer Bank', description: 'Transfer via ATM atau Internet Banking' },
    { value: 'credit_card', label: 'Kartu Kredit', description: 'Bayar dengan kartu kredit' },
    { value: 'debit_card', label: 'Kartu Debit', description: 'Bayar dengan kartu debit' },
    { value: 'e_wallet', label: 'Dompet Digital', description: 'GoPay, OVO, Dana, LinkAja' },
    { value: 'cash', label: 'Tunai', description: 'Bayar langsung di kantor' },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" aria-busy="true">
        <CardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-1">
            <div className="card p-6">
              <FormSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-success-200 bg-success-50 p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-success-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-success-800 mb-2">Semua Tagihan Lunas!</h2>
          <p className="text-[13px] text-success-600 mb-6">Tidak ada tagihan yang belum dibayar saat ini.</p>
          <button
            onClick={() => navigate('/customer/invoices')}
            className="btn-primary"
          >
            Lihat Semua Tagihan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Lakukan Pembayaran</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Pilih tagihan dan metode pembayaran Anda.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-danger-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Selection */}
            <div className="card p-5">
              <h2 className="text-[15px] font-semibold text-surface-800 mb-4">Pilih Tagihan</h2>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <label
                    key={invoice.id}
                    className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      formData.invoiceId === invoice.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-surface-200 hover:border-brand-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="invoiceId"
                      value={invoice.id}
                      checked={formData.invoiceId === invoice.id}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-brand-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-surface-800">{invoice.invoiceNumber}</p>
                          <p className="text-[13px] text-surface-400">Periode: {invoice.billingPeriod}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] text-surface-400">Sisa Tagihan</p>
                          <p className="text-[16px] font-bold text-danger-600">{formatCurrency(invoice.amountDue)}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.invoiceId && <p className="mt-2 text-[13px] text-danger-600">{errors.invoiceId}</p>}
            </div>

            {/* Payment Method */}
            <div className="card p-5">
              <h2 className="text-[15px] font-semibold text-surface-800 mb-4">Metode Pembayaran</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      formData.paymentMethod === method.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-surface-200 hover:border-brand-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-brand-600"
                    />
                    <div className="ml-3 flex items-center flex-1">
                      <div className={`${formData.paymentMethod === method.value ? 'text-brand-600' : 'text-surface-300'}`}>
                        {getPaymentMethodIcon(method.value as PaymentMethod)}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-surface-800 text-[14px]">{method.label}</p>
                        <p className="text-[13px] text-surface-400">{method.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.paymentMethod && <p className="mt-2 text-[13px] text-danger-600">{errors.paymentMethod}</p>}
            </div>

            {/* Payment Details */}
            <div className="card p-5">
              <h2 className="text-[15px] font-semibold text-surface-800 mb-4">Detail Pembayaran</h2>
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="label-base">
                    Nominal Pembayaran <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 text-[13px]">Rp</span>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      className={`input-base pl-12 pr-4 ${
                        errors.amount ? 'border-danger-300 focus:ring-danger-500/20' : ''
                      }`}
                    />
                  </div>
                  {errors.amount && <p className="mt-1.5 text-[12px] text-danger-600">{errors.amount}</p>}
                  {selectedInvoice && (
                    <p className="mt-1.5 text-[12px] text-surface-400">
                      Maksimum: {formatCurrency(selectedInvoice.amountDue)}
                    </p>
                  )}
                </div>

                {/* Reference Number */}
                {formData.paymentMethod !== 'cash' && (
                  <div>
                    <label htmlFor="referenceNumber" className="label-base">
                      Nomor Referensi <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="referenceNumber"
                      name="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={handleChange}
                      placeholder="Masukkan nomor referensi transaksi"
                      className={`input-base mt-1.5 ${
                        errors.referenceNumber ? 'border-danger-300 focus:ring-danger-500/20' : ''
                      }`}
                    />
                    {errors.referenceNumber && <p className="mt-1.5 text-[12px] text-danger-600">{errors.referenceNumber}</p>}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="label-base">Catatan (Opsional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tambahkan catatan jika perlu..."
                    className="input-base mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-6">
              <h2 className="text-[15px] font-semibold text-surface-800 mb-4">Ringkasan Pembayaran</h2>
              <div className="space-y-3">
                {selectedInvoice ? (
                  <>
                    <div className="pb-3 border-b border-surface-100">
                      <p className="text-[13px] text-surface-400">Nomor Tagihan</p>
                      <p className="font-mono text-surface-800 text-[14px]">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div className="pb-3 border-b border-surface-100">
                      <p className="text-[13px] text-surface-400">Periode Tagihan</p>
                      <p className="text-surface-800 text-[14px]">{selectedInvoice.billingPeriod}</p>
                    </div>
                    <div className="pb-3 border-b border-surface-100">
                      <p className="text-[13px] text-surface-400">Total Tagihan</p>
                      <p className="text-surface-800 text-[14px]">{formatCurrency(selectedInvoice.totalAmount)}</p>
                    </div>
                    {selectedInvoice.amountPaid > 0 && (
                      <div className="pb-3 border-b border-surface-100">
                        <p className="text-[13px] text-surface-400">Sudah Dibayar</p>
                        <p className="text-success-600 text-[14px]">-{formatCurrency(selectedInvoice.amountPaid)}</p>
                      </div>
                    )}
                    <div className="pb-3 border-b border-surface-100">
                      <p className="text-[13px] font-medium text-surface-700">Sisa Tagihan</p>
                      <p className="text-[18px] font-bold text-danger-600">{formatCurrency(selectedInvoice.amountDue)}</p>
                    </div>
                    <div className="pt-3">
                      <p className="text-[13px] font-medium text-surface-700">Nominal yang Dibayar</p>
                      <p className="text-[24px] font-bold text-brand-600">{formatCurrency(formData.amount)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-surface-400 text-center py-4">Pilih tagihan untuk melihat ringkasan</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedInvoice}
                className="btn-primary w-full mt-6"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Memproses...
                  </span>
                ) : (
                  'Kirim Pembayaran'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/customer/invoices')}
                disabled={submitting}
                className="btn-secondary w-full mt-3"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
