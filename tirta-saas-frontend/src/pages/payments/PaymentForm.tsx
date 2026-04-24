import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { paymentService } from '../../services/paymentService';
import customerService from '../../services/customerService';
import CustomerSearchSelect from '../../components/CustomerSearchSelect';
import { CurrencyInput } from '../../components/CurrencyInput';
import type {
  PaymentFormData,
  OutstandingInvoice,
} from '../../types/payment';
import {
  PAYMENT_METHOD_LABELS,
} from '../../types/payment';
import type { Customer } from '../../types/customer';
import { PageHeader, useToast } from '../../components';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (typeof data === 'object' && data !== null) {
        if ('message' in data && typeof data.message === 'string') {
          return data.message;
        }
        if ('error' in data && typeof data.error === 'string') {
          return data.error;
        }
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [customers, setPelanggan] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [outstandingTagihan, setOutstandingTagihan] = useState<OutstandingInvoice[]>([]);
  const [selectedTagihan, setSelectedTagihan] = useState<Set<string>>(new Set());
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});
  
  const [formData, setFormData] = useState<PaymentFormData>({
    invoiceId: '',
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchPelanggan = useCallback(async () => {
    try {
      const response = await customerService.getPelanggan(1, 1000);
      // Allow payment for all customers (including inactive)
      // Because registration fee payment is required to activate customer
      setPelanggan(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  }, []);

  const fetchOutstandingTagihan = useCallback(async (customerId: string) => {
    try {
      setLoadingInvoices(true);
      const invoices = await paymentService.getOutstandingTagihan(customerId);
      setOutstandingTagihan(invoices);
      setSelectedTagihan(new Set());
      setPaymentAmounts({});
    } catch (error) {
      console.error('Failed to fetch outstanding invoices:', error);
      setOutstandingTagihan([]);
      setSelectedTagihan(new Set());
      setPaymentAmounts({});
      toast.error(getErrorMessage(error, 'Gagal memuat tagihan pelanggan'));
    } finally {
      setLoadingInvoices(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPelanggan();
  }, [fetchPelanggan]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchOutstandingTagihan(selectedCustomerId);
    } else {
      setOutstandingTagihan([]);
      setSelectedTagihan(new Set());
      setPaymentAmounts({});
    }
  }, [fetchOutstandingTagihan, selectedCustomerId]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedTagihan(new Set());
    setPaymentAmounts({});
    setErrors({});
  };

  const toggleInvoiceSelection = (invoice: OutstandingInvoice) => {
    const newSelected = new Set(selectedTagihan);
    const newPaymentAmounts = { ...paymentAmounts };

    if (newSelected.has(invoice.id)) {
      newSelected.delete(invoice.id);
      delete newPaymentAmounts[invoice.id];
    } else {
      newSelected.add(invoice.id);
      newPaymentAmounts[invoice.id] = invoice.remainingAmount;
    }

    setSelectedTagihan(newSelected);
    setPaymentAmounts(newPaymentAmounts);

    if (errors.invoices || errors.amounts) {
      setErrors((prev) => ({
        ...prev,
        invoices: '',
        amounts: '',
      }));
    }
  };

  const setInvoicePaymentAmount = (invoice: OutstandingInvoice, value: number) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [invoice.id]: Math.min(Math.max(value, 0), invoice.remainingAmount),
    }));

    if (errors.amounts) {
      setErrors((prev) => ({ ...prev, amounts: '' }));
    }
  };

  const handleSelectAllInvoices = () => {
    const nextSelected = new Set(outstandingTagihan.map((invoice) => invoice.id));
    const nextPaymentAmounts = outstandingTagihan.reduce<Record<string, number>>((acc, invoice) => {
      acc[invoice.id] = invoice.remainingAmount;
      return acc;
    }, {});

    setSelectedTagihan(nextSelected);
    setPaymentAmounts(nextPaymentAmounts);
    setErrors((prev) => ({
      ...prev,
      invoices: '',
      amounts: '',
    }));
  };

  const handleClearSelection = () => {
    setSelectedTagihan(new Set());
    setPaymentAmounts({});
    setErrors((prev) => ({
      ...prev,
      invoices: '',
      amounts: '',
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const selectedInvoices = useMemo(
    () => outstandingTagihan.filter((invoice) => selectedTagihan.has(invoice.id)),
    [outstandingTagihan, selectedTagihan]
  );

  const selectedInvoicesTotal = useMemo(
    () => selectedInvoices.reduce((sum, invoice) => sum + invoice.remainingAmount, 0),
    [selectedInvoices]
  );

  const totalPaymentAmount = useMemo(
    () =>
      selectedInvoices.reduce(
        (sum, invoice) => sum + Math.min(paymentAmounts[invoice.id] ?? 0, invoice.remainingAmount),
        0
      ),
    [paymentAmounts, selectedInvoices]
  );

  const totalRemainingAfterPayment = useMemo(
    () =>
      selectedInvoices.reduce(
        (sum, invoice) => sum + Math.max(invoice.remainingAmount - (paymentAmounts[invoice.id] ?? 0), 0),
        0
      ),
    [paymentAmounts, selectedInvoices]
  );

  const partialInvoiceCount = useMemo(
    () =>
      selectedInvoices.filter((invoice) => {
        const paymentAmount = paymentAmounts[invoice.id] ?? 0;
        return paymentAmount > 0 && paymentAmount < invoice.remainingAmount;
      }).length,
    [paymentAmounts, selectedInvoices]
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCustomerId) {
      newErrors.customerId = 'Pilih pelanggan terlebih dahulu';
    }

    if (selectedTagihan.size === 0) {
      newErrors.invoices = 'Pilih minimal satu tagihan';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Tanggal pembayaran wajib diisi';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Metode pembayaran wajib dipilih';
    }

    const invalidInvoices = selectedInvoices.filter((invoice) => {
      const paymentAmount = paymentAmounts[invoice.id] ?? 0;
      return paymentAmount <= 0 || paymentAmount > invoice.remainingAmount;
    });

    if (invalidInvoices.length > 0) {
      newErrors.amounts = 'Nominal setiap tagihan harus lebih dari 0 dan tidak melebihi sisa tagihan';
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
      setLoading(true);
      
      // Process each selected invoice
      for (const invoiceId of Array.from(selectedTagihan)) {
        const invoice = outstandingTagihan.find(inv => inv.id === invoiceId);
        if (invoice) {
          const paymentAmount = paymentAmounts[invoice.id] ?? 0;
          const paymentData: PaymentFormData = {
            invoiceId: invoice.id,
            amount: paymentAmount,
            paymentMethod: formData.paymentMethod,
            paymentDate: formData.paymentDate,
            referenceNumber: formData.referenceNumber,
            notes: formData.notes,
          };
          await paymentService.createPayment(paymentData);
        }
      }

      toast.success(
        partialInvoiceCount > 0
          ? `Pembayaran tersimpan. ${partialInvoiceCount} tagihan dibayar parsial.`
          : 'Pembayaran berhasil dicatat.'
      );
      navigate('/admin/payments');
    } catch (error: unknown) {
      console.error('Failed to save payment:', error);
      toast.error(getErrorMessage(error, 'Gagal menyimpan pembayaran'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button
        onClick={() => navigate('/admin/payments')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Kembali ke Pembayaran
      </button>
      <PageHeader
        title="Catat Pembayaran"
        subtitle="Admin bisa mencatat pembayaran penuh atau parsial untuk satu atau beberapa tagihan sekaligus."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <CustomerSearchSelect
            customers={customers}
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            disabled={loading}
          />
          {errors.customerId && (
            <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
          )}
        </div>

        {/* Outstanding Tagihan Cards */}
        {selectedCustomerId && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tagihan belum lunas</h2>
                <p className="text-sm text-gray-500">
                  Pilih tagihan, lalu sesuaikan nominal jika ingin mencatat pembayaran parsial.
                </p>
              </div>
              {outstandingTagihan.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllInvoices}
                    disabled={loading || loadingInvoices}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Pilih semua
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    disabled={loading || loadingInvoices || selectedTagihan.size === 0}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Kosongkan pilihan
                  </button>
                </div>
              )}
            </div>

            {loadingInvoices && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Memuat tagihan pelanggan...
              </div>
            )}

            {!loadingInvoices && outstandingTagihan.length > 0 && (
              <>
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Jumlah tagihan aktif</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{outstandingTagihan.length}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Total sisa tagihan</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-900">
                      {formatCurrency(
                        outstandingTagihan.reduce((sum, invoice) => sum + invoice.remainingAmount, 0)
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">Dipilih untuk dibayar</p>
                    <p className="mt-1 text-2xl font-semibold text-blue-900">{selectedTagihan.size}</p>
                  </div>
                </div>

                {(errors.invoices || errors.amounts) && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>{errors.invoices || errors.amounts}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {outstandingTagihan.map((invoice) => {
                    const isSelected = selectedTagihan.has(invoice.id);
                    const paymentAmount = paymentAmounts[invoice.id] ?? 0;
                    const remainingAfterPayment = Math.max(invoice.remainingAmount - paymentAmount, 0);
                    const isPartialPayment =
                      isSelected && paymentAmount > 0 && paymentAmount < invoice.remainingAmount;

                    return (
                      <div
                        key={invoice.id}
                        onClick={() => toggleInvoiceSelection(invoice)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleInvoiceSelection(invoice);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`relative rounded-2xl border p-5 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute right-4 top-4">
                            <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="pr-8">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {invoice.invoiceNumber || `INV-${invoice.id}`}
                              </p>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  invoice.status === 'overdue'
                                    ? 'bg-red-100 text-red-700'
                                    : invoice.status === 'partial'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {invoice.status === 'overdue'
                                  ? 'Terlambat'
                                  : invoice.status === 'partial'
                                    ? 'Parsial'
                                    : 'Belum lunas'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {invoice.usageMonth || 'Biaya registrasi'} • Jatuh tempo{' '}
                              {invoice.dueDate
                                ? new Date(invoice.dueDate).toLocaleDateString('id-ID')
                                : '-'}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 rounded-xl bg-white/80 p-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                              <p className="mt-1 font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Sudah dibayar</p>
                              <p className="mt-1 font-semibold text-emerald-600">{formatCurrency(invoice.paidAmount)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Sisa tagihan</p>
                              <p className="mt-1 font-semibold text-rose-600">{formatCurrency(invoice.remainingAmount)}</p>
                            </div>
                          </div>

                          {isSelected ? (
                            <div
                              className="space-y-3 rounded-xl border border-blue-200 bg-white p-4"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Nominal dibayarkan
                                  </label>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Isi kurang dari sisa tagihan untuk pembayaran parsial.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setInvoicePaymentAmount(invoice, invoice.remainingAmount)}
                                  className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                                >
                                  Bayar penuh
                                </button>
                              </div>

                              <CurrencyInput
                                value={paymentAmount}
                                onChange={(value) => setInvoicePaymentAmount(invoice, value)}
                                max={invoice.remainingAmount}
                                min={0}
                                disabled={loading}
                                placeholder="Masukkan nominal pembayaran"
                              />

                              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span className={isPartialPayment ? 'font-medium text-amber-700' : 'text-emerald-700'}>
                                  {isPartialPayment ? 'Pembayaran parsial' : 'Tagihan akan lunas'}
                                </span>
                                <span className="text-gray-600">
                                  Sisa setelah bayar: <strong>{formatCurrency(remainingAfterPayment)}</strong>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500">
                              Klik kartu ini untuk memilih tagihan. Nominal otomatis diisi penuh dan bisa diubah jadi parsial.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedTagihan.size > 0 && (
                  <div className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-gray-600">Tagihan dipilih</p>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedTagihan.size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total sisa tagihan terpilih</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(selectedInvoicesTotal)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total pembayaran dicatat</p>
                        <p className="mt-1 text-xl font-semibold text-blue-900">{formatCurrency(totalPaymentAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sisa setelah pembayaran</p>
                        <p className="mt-1 text-xl font-semibold text-amber-700">
                          {formatCurrency(totalRemainingAfterPayment)}
                        </p>
                      </div>
                    </div>
                    {partialInvoiceCount > 0 && (
                      <p className="mt-4 text-sm text-amber-700">
                        {partialInvoiceCount} tagihan akan tetap berstatus parsial setelah pembayaran ini.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedCustomerId && !loadingInvoices && outstandingTagihan.length === 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="py-8 text-center">
              <p className="text-gray-500">Tidak ada tagihan aktif untuk pelanggan ini.</p>
            </div>
          </div>
        )}

        {/* Payment Details */}
        {selectedTagihan.size > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-2 text-lg font-medium text-gray-900">
              Detail Pembayaran
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Informasi di bawah ini akan diterapkan ke semua tagihan yang sedang dipilih.
            </p>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.paymentDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.paymentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  placeholder="Contoh: nomor bukti transfer"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedTagihan.size > 0 && (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="w-full rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 sm:w-auto"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 sm:w-auto"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : `Catat Pembayaran ${formatCurrency(totalPaymentAmount)}`}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentForm;
