import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PageHeader, useToast, CardSkeleton, FormSkeleton } from '../../components';
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
      const unpaid = data.filter(inv => inv.status !== 'paid');
      setTagihan(unpaid);
      setError(null);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat tagihan'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInvoiceSelect = useCallback((invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData(prev => ({
        ...prev,
        invoiceId,
        amount: invoice.amountDue,
      }));
    }
  }, [invoices]);

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
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
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

      // Navigate to success page
      navigate('/customer/payments/success', { 
        state: { 
          invoice: selectedInvoice,
          amount: formData.amount,
          paymentMethod: formData.paymentMethod
        } 
      });
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memproses pembayaran');
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

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <BanknotesIcon className="h-6 w-6" />;
      case 'bank_transfer':
        return <BuildingLibraryIcon className="h-6 w-6" />;
      case 'credit_card':
      case 'debit_card':
        return <CreditCardIcon className="h-6 w-6" />;
      case 'e_wallet':
        return <DevicePhoneMobileIcon className="h-6 w-6" />;
      default:
        return <CreditCardIcon className="h-6 w-6" />;
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
      <div className="max-w-4xl mx-auto space-y-6" aria-busy="true" aria-label="Memuat tagihan">
        <CardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-900 mb-2">Semua Tagihan Lunas!</h2>
          <p className="text-green-700 mb-6">Tidak ada tagihan yang belum dibayar saat ini.</p>
          <button
            onClick={() => navigate('/customer/invoices')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Lihat Semua Tagihan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Lakukan Pembayaran"
        subtitle="Pilih tagihan dan metode pembayaran Anda."
      />

      {/* Error Alert */}
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5" aria-hidden="true" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Tagihan</h2>
              <div className="space-y-3">
                {invoices.map(invoice => (
                  <label
                    key={invoice.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.invoiceId === invoice.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="invoiceId"
                      value={invoice.id}
                      checked={formData.invoiceId === invoice.id}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-indigo-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">Periode: {invoice.billingPeriod}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Sisa Tagihan</p>
                          <p className="text-lg font-bold text-red-600">{formatCurrency(invoice.amountDue)}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.invoiceId && <p className="mt-2 text-sm text-red-600">{errors.invoiceId}</p>}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <label
                    key={method.value}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.paymentMethod === method.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 text-indigo-600"
                    />
                    <div className="ml-3 flex items-center flex-1">
                      <div className={`${formData.paymentMethod === method.value ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {getPaymentMethodIcon(method.value as PaymentMethod)}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{method.label}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.paymentMethod && <p className="mt-2 text-sm text-red-600">{errors.paymentMethod}</p>}
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Pembayaran</h2>
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                  {selectedInvoice && (
                    <p className="mt-1 text-sm text-gray-600">
                      Maksimum: {formatCurrency(selectedInvoice.amountDue)}
                    </p>
                  )}
                </div>

                {/* Reference Number */}
                {formData.paymentMethod !== 'cash' && (
                  <div>
                    <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Referensi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="referenceNumber"
                      name="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={handleChange}
                      placeholder="Masukkan nomor referensi transaksi"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.referenceNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.referenceNumber && <p className="mt-1 text-sm text-red-600">{errors.referenceNumber}</p>}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tambahkan catatan jika perlu..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pembayaran</h2>
              <div className="space-y-3">
                {selectedInvoice ? (
                  <>
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-sm text-gray-600">Nomor Tagihan</p>
                      <p className="font-mono text-gray-900">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-sm text-gray-600">Periode Tagihan</p>
                      <p className="text-gray-900">{selectedInvoice.billingPeriod}</p>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-sm text-gray-600">Total Tagihan</p>
                      <p className="text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
                    </div>
                    {selectedInvoice.amountPaid > 0 && (
                      <div className="pb-3 border-b border-gray-200">
                        <p className="text-sm text-gray-600">Sudah Dibayar</p>
                        <p className="text-green-600">-{formatCurrency(selectedInvoice.amountPaid)}</p>
                      </div>
                    )}
                    <div className="pb-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Sisa Tagihan</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(selectedInvoice.amountDue)}</p>
                    </div>
                    <div className="pt-3">
                      <p className="text-sm font-medium text-gray-900">Nominal yang Dibayar</p>
                      <p className="text-2xl font-bold text-indigo-600">{formatCurrency(formData.amount)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Pilih tagihan untuk melihat ringkasan</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedInvoice}
                className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
                className="w-full mt-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
