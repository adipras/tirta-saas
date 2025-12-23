import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BuildingLibraryIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowRightIcon,
  QrCodeIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { invoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/invoice';

export default function CustomerPaymentInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bank accounts dari tenant settings (would be fetched from API)
  const [bankAccounts] = useState([
    {
      id: '1',
      bankName: 'Bank BCA',
      accountNumber: '1234567890',
      accountName: 'RT 01 RW 05 Kelurahan Sejahtera',
    },
    {
      id: '2',
      bankName: 'Bank Mandiri',
      accountNumber: '9876543210',
      accountName: 'RT 01 RW 05 Kelurahan Sejahtera',
    },
  ]);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    } else {
      setLoading(false);
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(invoiceId!);
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirmPayment = () => {
    navigate(`/customer/payments/confirm?invoice=${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">Water Bill Payment</h1>
        <p className="text-gray-600">Transfer to one of the accounts below</p>
      </div>

      {/* Invoice Summary */}
      {invoice && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="text-base font-semibold text-gray-900">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="text-base font-semibold text-gray-900">
                {new Date(invoice.periodStartDate).toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(invoice.amountDue || invoice.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Payment Instructions</h3>
            <ol className="mt-2 text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Transfer the exact amount to one of the accounts below</li>
              <li>Save your transfer receipt</li>
              <li>Click "Confirm Payment" to upload your proof</li>
              <li>Payment verified within 1-2 business days</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <BuildingLibraryIcon className="h-6 w-6 mr-2 text-blue-600" />
          Bank Transfer
        </h2>

        {bankAccounts.map((bank) => (
          <div
            key={bank.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{bank.bankName}</h3>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <BuildingLibraryIcon className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Account Name</p>
                <p className="text-base font-semibold text-gray-900">{bank.accountName}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="text-2xl font-mono font-bold text-gray-900">
                    {bank.accountNumber}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(bank.accountNumber, bank.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  {copiedField === bank.id ? (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <QrCodeIcon className="h-6 w-6 mr-2 text-blue-600" />
          QRIS Payment
        </h2>
        <div className="flex flex-col items-center py-6">
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <QrCodeIcon className="h-20 w-20 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Scan with any e-wallet</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">GoPay, OVO, Dana, ShopeePay</p>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Already paid?</h3>
            <p className="text-sm text-gray-600 mt-1">Upload your payment proof</p>
          </div>
          <button
            onClick={handleConfirmPayment}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <span>Confirm Payment</span>
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
