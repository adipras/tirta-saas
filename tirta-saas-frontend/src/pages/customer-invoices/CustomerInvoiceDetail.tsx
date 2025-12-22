import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon,
  PrinterIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';

export default function CustomerInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(id!);
      setInvoice(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await invoiceService.downloadInvoicePDF(id!);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || badges.unpaid;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/customer/invoices')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Invoices
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Invoice not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/customer/invoices')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Invoices
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          {invoice.status !== 'paid' && (
            <Link
              to={`/customer/payments/new?invoice=${invoice.id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Pay Now
            </Link>
          )}
        </div>
      </div>

      {/* Invoice Detail Card */}
      <div className="bg-white rounded-lg shadow">
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-lg font-semibold text-blue-600 mt-2">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(invoice.status)}`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Company & Customer Info */}
        <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">FROM:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">Tirta Water Management</p>
              <p>Jl. Air Bersih No. 123</p>
              <p>Jakarta Pusat, 10110</p>
              <p>Phone: (021) 1234-5678</p>
              <p>Email: info@tirta.com</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">BILL TO:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{invoice.customer?.name || invoice.customerName}</p>
              <p>ID: {invoice.customer?.customerId || invoice.customerId}</p>
              <p>{invoice.customer?.address || 'N/A'}</p>
              <p>Phone: {invoice.customer?.phone || 'N/A'}</p>
              <p>Email: {invoice.customer?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="px-8 py-6 grid grid-cols-3 gap-6 border-b border-gray-200 bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-500">Issue Date</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Due Date</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{formatDate(invoice.dueDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Billing Period</p>
            <p className="text-base font-semibold text-gray-900 mt-1">{invoice.billingPeriod}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-8 py-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-semibold text-gray-900 pb-3">Description</th>
                <th className="text-right text-sm font-semibold text-gray-900 pb-3">Quantity</th>
                <th className="text-right text-sm font-semibold text-gray-900 pb-3">Rate</th>
                <th className="text-right text-sm font-semibold text-gray-900 pb-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.items || []).map((item, index) => (
                <tr key={index}>
                  <td className="py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="py-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="py-4 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">{formatCurrency(invoice.subtotal || invoice.totalAmount)}</span>
              </div>
              {(invoice.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoice.taxPercentage || 0}%)</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(invoice.taxAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-3">
                <span className="text-gray-900">Total Amount</span>
                <span className="text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="text-green-600 font-medium">-{formatCurrency(invoice.amountPaid)}</span>
                </div>
              )}
              {invoice.status !== 'paid' && invoice.amountDue > 0 && (
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                  <span className="text-red-600">Amount Due</span>
                  <span className="text-red-600">{formatCurrency(invoice.amountDue)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="px-8 py-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
            <div className="space-y-3">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(payment.paymentDate)}</p>
                    <p className="text-xs text-gray-600">Method: {payment.paymentMethod}</p>
                    {payment.referenceNumber && (
                      <p className="text-xs text-gray-600">Ref: {payment.referenceNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="px-8 py-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Thank you for your business! For any questions, please contact us at info@tirta.com or call (021) 1234-5678
          </p>
        </div>
      </div>
    </div>
  );
}
