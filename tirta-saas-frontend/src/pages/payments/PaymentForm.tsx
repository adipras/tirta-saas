import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  DocumentTextIcon,
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

const getInvoiceTypeLabel = (invoice: OutstandingInvoice) => {
  if (invoice.type === 'manual') return 'Tagihan manual';
  if (invoice.type === 'registration') return 'Biaya registrasi';
  return invoice.usageMonth || 'Tagihan air bulanan';
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
      setPelanggan(response.data);
    } catch { /* ignore */ }
  }, []);

  const fetchOutstandingTagihan = useCallback(async (customerId: string) => {
    try {
      setLoadingInvoices(true);
      const invoices = await paymentService.getOutstandingTagihan(customerId);
      setOutstandingTagihan(invoices);
      setSelectedTagihan(new Set());
      setPaymentAmounts({});
    } catch (error: unknown) {
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
      setErrors((prev) => ({ ...prev, invoices: '', amounts: '' }));
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
    setErrors((prev) => ({ ...prev, invoices: '', amounts: '' }));
  };

  const handleClearSelection = () => {
    setSelectedTagihan(new Set());
    setPaymentAmounts({});
    setErrors((prev) => ({ ...prev, invoices: '', amounts: '' }));
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
    if (!validateForm()) return;

    try {
      setLoading(true);
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
      toast.error(getErrorMessage(error, 'Gagal menyimpan pembayaran'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/admin/payments')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-brand-600"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Kembali ke Pembayaran
      </button>

      <PageHeader
        title="Catat Pembayaran"
        subtitle="Admin bisa mencatat pembayaran penuh atau parsial untuk satu atau beberapa tagihan sekaligus."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Pilih Pelanggan
          </h2>
          <div className="mt-3">
            <CustomerSearchSelect
              customers={customers}
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              disabled={loading}
            />
            {errors.customerId && (
              <p className="mt-1.5 text-sm text-danger-600">{errors.customerId}</p>
            )}
          </div>
        </div>

        {/* Outstanding Invoices */}
        {selectedCustomerId && (
          <div className="card">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
                  <DocumentTextIcon className="h-4 w-4 text-warning-500" />
                  Tagihan Belum Lunas
                </h2>
                <p className="mt-0.5 text-xs text-surface-400">
                  Pilih tagihan, lalu sesuaikan nominal untuk pembayaran parsial.
                </p>
              </div>
              {outstandingTagihan.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllInvoices}
                    disabled={loading || loadingInvoices}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
                  >
                    Pilih semua
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    disabled={loading || loadingInvoices || selectedTagihan.size === 0}
                    className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition hover:bg-surface-50 disabled:opacity-50"
                  >
                    Kosongkan
                  </button>
                </div>
              )}
            </div>

            {loadingInvoices && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-200 bg-surface-50 py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                <p className="mt-2 text-sm text-surface-400">Memuat tagihan pelanggan...</p>
              </div>
            )}

            {!loadingInvoices && outstandingTagihan.length > 0 && (
              <>
                {/* Summary Stats */}
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-surface-50 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-surface-400">
                      <DocumentTextIcon className="h-3.5 w-3.5" />
                      Tagihan Aktif
                    </div>
                    <p className="mt-1 text-xl font-bold text-surface-900">{outstandingTagihan.length}</p>
                  </div>
                  <div className="rounded-xl bg-warning-50 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-warning-600">
                      <CurrencyDollarIcon className="h-3.5 w-3.5" />
                      Total Sisa
                    </div>
                    <p className="mt-1 text-xl font-bold text-warning-700">
                      {formatCurrency(outstandingTagihan.reduce((sum, inv) => sum + inv.remainingAmount, 0))}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-50 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-brand-600">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Dipilih
                    </div>
                    <p className="mt-1 text-xl font-bold text-brand-700">{selectedTagihan.size}</p>
                  </div>
                </div>

                {/* Validation Errors */}
                {(errors.invoices || errors.amounts) && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                    <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div>{errors.invoices || errors.amounts}</div>
                  </div>
                )}

                {/* Invoice Cards */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
                        className={`relative rounded-xl border p-4 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-brand-300 bg-brand-50/50 ring-2 ring-brand-100'
                            : 'border-surface-100 bg-white hover:border-surface-200 hover:shadow-sm'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute right-3 top-3">
                            <CheckCircleIcon className="h-5 w-5 text-brand-600" />
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="pr-7">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-surface-900">
                                {invoice.invoiceNumber || `INV-${invoice.id}`}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                invoice.status === 'overdue'
                                  ? 'bg-danger-50 text-danger-700 ring-danger-200'
                                  : invoice.status === 'partial'
                                    ? 'bg-info-50 text-info-700 ring-info-200'
                                    : 'bg-warning-50 text-warning-700 ring-warning-200'
                              }`}>
                                {invoice.status === 'overdue'
                                  ? 'Terlambat'
                                  : invoice.status === 'partial'
                                    ? 'Parsial'
                                    : 'Belum lunas'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-surface-400">
                              {getInvoiceTypeLabel(invoice)} • Jatuh tempo{' '}
                              {invoice.dueDate
                                ? new Date(invoice.dueDate).toLocaleDateString('id-ID')
                                : '-'}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-50/80 p-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-surface-400">Total</p>
                              <p className="mt-0.5 text-sm font-semibold text-surface-900">{formatCurrency(invoice.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-surface-400">Dibayar</p>
                              <p className="mt-0.5 text-sm font-semibold text-success-600">{formatCurrency(invoice.paidAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-surface-400">Sisa</p>
                              <p className="mt-0.5 text-sm font-semibold text-danger-600">{formatCurrency(invoice.remainingAmount)}</p>
                            </div>
                          </div>

                          {isSelected ? (
                            <div
                              className="space-y-3 rounded-lg border border-brand-200 bg-white p-3"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <label className="text-xs font-medium text-surface-700">
                                    Nominal dibayarkan
                                  </label>
                                  <p className="mt-0.5 text-[11px] text-surface-400">
                                    Isi kurang dari sisa untuk pembayaran parsial.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setInvoicePaymentAmount(invoice, invoice.remainingAmount)}
                                  className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
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
                                placeholder="Masukkan nominal"
                              />

                              <div className="flex items-center justify-between text-xs">
                                <span className={isPartialPayment ? 'font-medium text-warning-700' : 'text-success-700'}>
                                  {isPartialPayment ? '⚠ Parsial' : '✓ Akan lunas'}
                                </span>
                                <span className="text-surface-400">
                                  Sisa: <strong className="text-surface-600">{formatCurrency(remainingAfterPayment)}</strong>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-surface-200 px-3 py-2.5 text-center text-xs text-surface-400">
                              Klik untuk memilih tagihan ini
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selection Summary */}
                {selectedTagihan.size > 0 && (
                  <div className="mt-4 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50/80 to-info-50/50 p-4">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-surface-500">Tagihan dipilih</p>
                        <p className="mt-0.5 text-xl font-bold text-surface-900">{selectedTagihan.size}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Total sisa terpilih</p>
                        <p className="mt-0.5 text-lg font-semibold text-surface-900">{formatCurrency(selectedInvoicesTotal)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Dicatat dibayar</p>
                        <p className="mt-0.5 text-lg font-semibold text-brand-700">{formatCurrency(totalPaymentAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Sisa setelah bayar</p>
                        <p className="mt-0.5 text-lg font-semibold text-warning-700">
                          {formatCurrency(totalRemainingAfterPayment)}
                        </p>
                      </div>
                    </div>
                    {partialInvoiceCount > 0 && (
                      <p className="mt-3 text-xs text-warning-700">
                        {partialInvoiceCount} tagihan akan tetap berstatus parsial setelah pembayaran ini.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {selectedCustomerId && !loadingInvoices && outstandingTagihan.length === 0 && (
          <div className="card">
            <div className="flex flex-col items-center justify-center py-10">
              <DocumentTextIcon className="h-10 w-10 text-surface-200" />
              <p className="mt-3 text-sm font-medium text-surface-500">Tidak ada tagihan aktif</p>
              <p className="mt-1 text-xs text-surface-400">Pelanggan ini tidak memiliki tagihan yang belum lunas.</p>
            </div>
          </div>
        )}

        {/* Payment Details */}
        {selectedTagihan.size > 0 && (
          <div className="card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
              <CreditCardIcon className="h-4 w-4 text-brand-500" />
              Detail Pembayaran
            </h2>
            <p className="mt-0.5 text-xs text-surface-400">
              Informasi ini akan diterapkan ke semua tagihan yang dipilih.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-surface-700">
                  <CalendarDaysIcon className="h-3.5 w-3.5 text-surface-400" />
                  Tanggal Pembayaran <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`input-base ${errors.paymentDate ? '!border-danger-300 !ring-danger-100' : ''}`}
                />
                {errors.paymentDate && (
                  <p className="mt-1 text-xs text-danger-600">{errors.paymentDate}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-surface-700">
                  <CreditCardIcon className="h-3.5 w-3.5 text-surface-400" />
                  Metode Pembayaran <span className="text-danger-500">*</span>
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className={`input-base ${errors.paymentMethod ? '!border-danger-300 !ring-danger-100' : ''}`}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="mt-1 text-xs text-danger-600">{errors.paymentMethod}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-surface-700">
                  <DocumentTextIcon className="h-3.5 w-3.5 text-surface-400" />
                  Nomor Referensi
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleInputChange}
                  placeholder="Contoh: nomor bukti transfer"
                  className="input-base"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-surface-700">
                  <svg className="h-3.5 w-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  Catatan
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Catatan jika diperlukan..."
                  className="input-base resize-none"
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
              className="btn-secondary"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CurrencyDollarIcon className="h-4 w-4" />
                  Catat Pembayaran {formatCurrency(totalPaymentAmount)}
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentForm;
