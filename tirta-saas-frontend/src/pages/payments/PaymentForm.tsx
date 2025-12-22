import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import customerService from '../../services/customerService';
import type {
  PaymentFormData,
  OutstandingInvoice,
} from '../../types/payment';
import {
  PAYMENT_METHOD_LABELS,
} from '../../types/payment';
import type { Customer } from '../../types/customer';

const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<OutstandingInvoice | null>(null);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    invoiceId: 0,
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchOutstandingInvoices(selectedCustomerId);
    } else {
      setOutstandingInvoices([]);
      setSelectedInvoice(null);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedInvoice) {
      setFormData((prev) => ({
        ...prev,
        invoiceId: selectedInvoice.id,
        amount: selectedInvoice.remainingAmount,
      }));
    }
  }, [selectedInvoice]);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers(1, 1000);
      setCustomers(response.data.filter((c) => c.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchOutstandingInvoices = async (customerId: number) => {
    try {
      const invoices = await paymentService.getOutstandingInvoices(customerId);
      setOutstandingInvoices(invoices);
    } catch (error) {
      console.error('Failed to fetch outstanding invoices:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const id = customerId ? Number(customerId) : null;
    setSelectedCustomerId(id);
    setSelectedInvoice(null);
    setFormData((prev) => ({ ...prev, invoiceId: 0, amount: 0 }));
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = outstandingInvoices.find((inv) => inv.id === Number(invoiceId));
    setSelectedInvoice(invoice || null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' || name === 'invoiceId' ? Number(value) : value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceId) {
      newErrors.invoiceId = 'Please select an invoice';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (selectedInvoice && formData.amount > selectedInvoice.remainingAmount) {
      newErrors.amount = `Amount cannot exceed remaining balance (Rp ${selectedInvoice.remainingAmount.toLocaleString('id-ID')})`;
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
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
      
      if (isEditMode && id) {
        await paymentService.updatePayment(Number(id), formData);
      } else {
        await paymentService.createPayment(formData);
      }

      navigate('/admin/payments');
    } catch (error: any) {
      console.error('Failed to save payment:', error);
      alert(error.response?.data?.message || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Payment' : 'Record Payment'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode ? 'Update payment information' : 'Record a new payment for an invoice'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full border rounded-md px-3 py-2 ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
              value={selectedCustomerId || ''}
              onChange={(e) => handleCustomerChange(e.target.value)}
              disabled={isEditMode}
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.meterNumber}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
            )}
          </div>

          {/* Outstanding Invoices */}
          {selectedCustomerId && outstandingInvoices.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice <span className="text-red-500">*</span>
              </label>
              <select
                name="invoiceId"
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.invoiceId ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.invoiceId || ''}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                disabled={isEditMode}
              >
                <option value="">Select an invoice</option>
                {outstandingInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - Due: {new Date(invoice.dueDate).toLocaleDateString()} - 
                    Remaining: Rp {invoice.remainingAmount.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
              {errors.invoiceId && (
                <p className="text-red-500 text-sm mt-1">{errors.invoiceId}</p>
              )}
            </div>
          )}

          {selectedCustomerId && outstandingInvoices.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                No outstanding invoices found for this customer.
              </p>
            </div>
          )}

          {/* Invoice Details */}
          {selectedInvoice && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700">Invoice Number:</span>
                  <span className="ml-2 font-medium">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-blue-700">Invoice Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Due Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Total Amount:</span>
                  <span className="ml-2 font-medium">
                    Rp {selectedInvoice.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Paid Amount:</span>
                  <span className="ml-2 font-medium">
                    Rp {selectedInvoice.paidAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Remaining:</span>
                  <span className="ml-2 font-medium text-red-600">
                    Rp {selectedInvoice.remainingAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount (IDR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.amount || ''}
                onChange={handleInputChange}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.paymentMethod}
                onChange={handleInputChange}
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

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="paymentDate"
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.paymentDate ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.paymentDate}
                onChange={handleInputChange}
              />
              {errors.paymentDate && (
                <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
              )}
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                name="referenceNumber"
                placeholder="e.g., TRX123456, Check #123"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.referenceNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Additional notes or comments"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/payments')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading || !selectedInvoice}
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Payment' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
