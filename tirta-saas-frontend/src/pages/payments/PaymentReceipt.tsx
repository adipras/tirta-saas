import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import type { PaymentReceipt as PaymentReceiptType } from '../../types/payment';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../types/payment';
import { useReactToPrint } from 'react-to-print';
import { PageHeader, useToast } from '../../components';

const PaymentReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [receipt, setReceipt] = useState<PaymentReceiptType | null>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatTanggal = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID');
  };

  useEffect(() => {
    if (id) {
      fetchReceipt(id);
    }
  }, [id]);

  const fetchReceipt = async (paymentId: string) => {
    try {
      setLoading(true);
      const data = await paymentService.getReceipt(paymentId);
      setReceipt(data);
    } catch (error) {
      console.error('Failed to fetch receipt:', error);
      // Try to generate receipt if not found
      try {
        const generated = await paymentService.generateReceipt(paymentId);
        setReceipt(generated);
      } catch (genError) {
        console.error('Failed to generate receipt:', genError);
        toast.error('Gagal memuat struk pembayaran');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receipt ? `Struk_${receipt.receiptNumber}` : 'Struk',
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat struk pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Struk pembayaran tidak ditemukan</p>
          <button
            onClick={() => navigate('/admin/payments')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Kembali ke Pembayaran
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Struk Pembayaran"
        subtitle={`No. Struk ${receipt.receiptNumber}`}
        actions={
          <>
            <button
              onClick={() => navigate('/admin/payments')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Kembali ke Pembayaran
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Cetak Struk
            </button>
          </>
        }
      />

      {/* Receipt Content */}
      <div ref={receiptRef} className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">TIRTA SAAS</h2>
            <p className="text-gray-600 mt-1">Sistem Manajemen Tagihan Air</p>
            <p className="text-sm text-gray-500 mt-2">
              Jl. Contoh No. 123, Kota ABC 12345<br />
              Telepon: (021) 1234-5678 | Email: info@tirtasaas.com
            </p>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold text-gray-900">STRUK PEMBAYARAN</h3>
            <p className="text-sm text-gray-600 mt-1">No. Struk: {receipt.receiptNumber}</p>
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Informasi Pelanggan</h4>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600">Nama:</span> <span className="font-medium">{receipt.customerDetails.name}</span></p>
              {receipt.customerDetails.address && (
                <p><span className="text-gray-600">Alamat:</span> {receipt.customerDetails.address}</p>
              )}
              {receipt.customerDetails.phone && (
                <p><span className="text-gray-600">Telepon:</span> {receipt.customerDetails.phone}</p>
              )}
              {receipt.customerDetails.meterNumber && (
                <p><span className="text-gray-600">No. Meter:</span> {receipt.customerDetails.meterNumber}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Informasi Pembayaran</h4>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600">Tanggal Bayar:</span> <span className="font-medium">{formatTanggal(receipt.payment.paymentDate)}</span></p>
              <p><span className="text-gray-600">Metode Pembayaran:</span> {PAYMENT_METHOD_LABELS[receipt.payment.paymentMethod] || receipt.payment.paymentMethod}</p>
              {receipt.payment.referenceNumber && (
                <p><span className="text-gray-600">Referensi:</span> {receipt.payment.referenceNumber}</p>
              )}
              <p><span className="text-gray-600">Status:</span> <span className="font-medium text-green-600">{PAYMENT_STATUS_LABELS[receipt.payment.status]}</span></p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Detail Tagihan</h4>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">No. Tagihan</th>
                  <th className="px-4 py-2 text-left">Tanggal Tagihan</th>
                  <th className="px-4 py-2 text-left">Jatuh Tempo</th>
                  <th className="px-4 py-2 text-right">Total Tagihan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-t">{receipt.invoiceDetails.invoiceNumber}</td>
                  <td className="px-4 py-2 border-t">{formatTanggal(receipt.invoiceDetails.invoiceDate)}</td>
                  <td className="px-4 py-2 border-t">{formatTanggal(receipt.invoiceDetails.dueDate)}</td>
                  <td className="px-4 py-2 border-t text-right">Rp {receipt.invoiceDetails.totalAmount.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="border-t-2 border-gray-300 pt-4">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 text-lg font-bold">
                 <span>Nominal Dibayar:</span>
                 <span className="text-green-600">Rp {receipt.payment.amount.toLocaleString('id-ID')}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {receipt.payment.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Catatan</h4>
            <p className="text-sm text-gray-600">{receipt.payment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>Terima kasih atas pembayaran Anda.</p>
          <p className="mt-2">Struk ini dibuat secara otomatis dan tidak memerlukan tanda tangan.</p>
          <p className="mt-1">Dibuat pada: {new Date(receipt.generatedAt).toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
