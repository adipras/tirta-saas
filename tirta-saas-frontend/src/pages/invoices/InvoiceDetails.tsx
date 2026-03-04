import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import invoiceService from '../../services/invoiceService';
import type { InvoiceDetails as InvoiceDetailsType } from '../../types/invoice';
import { useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';

export default function InvoiceDetails() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<InvoiceDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch invoice details',
      }));
      navigate('/admin/invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { color: string }> = {
      paid: { color: 'bg-green-100 text-green-800' },
      unpaid: { color: 'bg-yellow-100 text-yellow-800' },
      partial: { color: 'bg-blue-100 text-blue-800' },
      overdue: { color: 'bg-red-100 text-red-800' },
    };
    const statusStr = status || 'unpaid';
    const config = statusConfig[statusStr] || statusConfig.unpaid;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
      </div>
    );
  }

  const isRegistration = !invoice.billingPeriod || invoice.billingPeriod === '';
  const invoiceType = isRegistration ? 'Registration Fee' : 'Monthly Water Bill';
  const typeColor = isRegistration ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Invoices
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <EnvelopeIcon className="mr-2 h-4 w-4" />
            Send
          </button>
        </div>
      </div>

      {/* Invoice Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {invoiceType}
              </h1>
              <p className="mt-2 text-blue-100">
                Invoice #{invoice.invoiceNumber || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${typeColor}`}>
                {isRegistration ? 'Registration' : 'Monthly'}
              </div>
              <div className="mt-3">
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Invoice Info */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Invoice Information</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-base font-medium text-gray-900">{invoice.customerName}</p>
                </div>
                {invoice.customer?.meterNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Meter Number</p>
                    <p className="text-base font-medium text-gray-900">{invoice.customer.meterNumber}</p>
                  </div>
                )}
                {invoice.customer?.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-base text-gray-900">{invoice.customer.email}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">Invoice Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {!isRegistration && invoice.billingPeriod && (
                  <div>
                    <p className="text-sm text-gray-500">Billing Period</p>
                    <p className="text-base font-medium text-gray-900">{invoice.billingPeriod}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charges Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {isRegistration ? 'Registration Fee' : 'Usage Details & Charges'}
          </h2>
        </div>
        <div className="px-6 py-5">
          {isRegistration ? (
            // Registration Invoice
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="text-base font-medium text-gray-900">New Customer Registration Fee</p>
                  <p className="text-sm text-gray-500 mt-1">One-time registration charge</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(invoice.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Monthly Invoice
            <div className="space-y-4">
              {invoice.usage > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Water Usage</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">{invoice.usage} m³</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Rate per m³</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(invoice.amount / invoice.usage || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="divide-y divide-gray-200">
                {invoice.usage > 0 && (
                  <div className="flex justify-between py-3">
                    <span className="text-gray-600">Water Charge ({invoice.usage} m³)</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(invoice.amount)}
                    </span>
                  </div>
                )}
                {invoice.totalAmount > invoice.amount && (
                  <div className="flex justify-between py-3">
                    <span className="text-gray-600">Monthly Subscription Fee</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(invoice.totalAmount - invoice.amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Payment Summary</h2>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-medium text-gray-900">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(invoice.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium text-green-600">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(invoice.amountPaid)}
              </span>
            </div>
            <div className="border-t-2 border-gray-300 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Amount Due</span>
                <span className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(invoice.amountDue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
