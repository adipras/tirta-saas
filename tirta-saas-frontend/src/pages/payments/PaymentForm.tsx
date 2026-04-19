import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { paymentService } from '../../services/paymentService';
import customerService from '../../services/customerService';
import CustomerSearchSelect from '../../components/CustomerSearchSelect';
import type {
  PaymentFormData,
  OutstandingInvoice,
} from '../../types/payment';
import {
  PAYMENT_METHOD_LABELS,
} from '../../types/payment';
import type { Customer } from '../../types/customer';
import { PageHeader, useToast } from '../../components';

const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [customers, setPelanggan] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [outstandingTagihan, setOutstandingTagihan] = useState<OutstandingInvoice[]>([]);
  const [selectedTagihan, setSelectedTagihan] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<PaymentFormData>({
    invoiceId: '',
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPelanggan();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchOutstandingTagihan(selectedCustomerId);
    } else {
      setOutstandingTagihan([]);
      setSelectedTagihan(new Set());
    }
  }, [selectedCustomerId]);

  const fetchPelanggan = async () => {
    try {
      const response = await customerService.getPelanggan(1, 1000);
      // Allow payment for all customers (including inactive)
      // Because registration fee payment is required to activate customer
      setPelanggan(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchOutstandingTagihan = async (customerId: string) => {
    try {
      const invoices = await paymentService.getOutstandingTagihan(customerId);
      setOutstandingTagihan(invoices);
    } catch (error) {
      console.error('Failed to fetch outstanding invoices:', error);
      setOutstandingTagihan([]);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedTagihan(new Set());
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    const newSelected = new Set(selectedTagihan);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedTagihan(newSelected);
  };

  const calculateTotalAmount = () => {
    return outstandingTagihan
      .filter(inv => selectedTagihan.has(inv.id))
      .reduce((sum, inv) => sum + inv.remainingAmount, 0);
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
          const paymentData: PaymentFormData = {
            invoiceId: invoice.id,
            amount: invoice.remainingAmount,
            paymentMethod: formData.paymentMethod,
            paymentDate: formData.paymentDate,
            referenceNumber: formData.referenceNumber,
            notes: formData.notes,
          };
          await paymentService.createPayment(paymentData);
        }
      }

      navigate('/admin/payments');
    } catch (error: any) {
      console.error('Failed to save payment:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
          onClick={() => navigate('/admin/payments')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Kembali ke Pembayaran
        </button>
      <PageHeader title="Catat Pembayaran" subtitle="Pilih pelanggan dan tagihan yang akan dibayar" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pelanggan <span className="text-red-500">*</span>
          </label>
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
        {selectedCustomerId && outstandingTagihan.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Tagihan Belum Lunas
                </h2>
                <span className="text-sm text-gray-500">
                  Pilih tagihan yang ingin dibayar
                </span>
            </div>
            
            {errors.invoices && (
              <p className="text-red-500 text-sm mb-4">{errors.invoices}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outstandingTagihan.map((invoice) => {
                const isSelected = selectedTagihan.has(invoice.id);
                return (
                  <div
                    key={invoice.id}
                    onClick={() => toggleInvoiceSelection(invoice.id)}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between pr-8">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber || `INV-${invoice.id}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invoice.usageMonth || 'Biaya Registrasi'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Tagihan:</span>
                          <span className="font-medium text-gray-900">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(invoice.totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sudah Dibayar:</span>
                          <span className="font-medium text-green-600">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(invoice.paidAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-1">
                          <span className="font-medium text-gray-700">Sisa:</span>
                          <span className="font-bold text-red-600">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(invoice.remainingAmount)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                         <span>Jatuh Tempo: {new Date(invoice.dueDate).toLocaleDateString('id-ID')}</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          invoice.status === 'overdue' 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {invoice.status === 'overdue' ? 'Terlambat' : 'Menunggu'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Summary */}
            {selectedTagihan.size > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                     <p className="text-sm text-gray-600">Total pembayaran untuk {selectedTagihan.size} tagihan</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(calculateTotalAmount())}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedCustomerId && outstandingTagihan.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">
                Tidak ada tagihan aktif untuk pelanggan ini.
              </p>
            </div>
          </div>
        )}

        {/* Payment Details */}
        {selectedTagihan.size > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Detail Pembayaran
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
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
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : `Catat Pembayaran (${selectedTagihan.size} tagihan)`}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentForm;
