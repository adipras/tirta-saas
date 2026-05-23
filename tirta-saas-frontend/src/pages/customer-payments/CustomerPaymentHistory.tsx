import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCardIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { PageHeader, TableSkeleton, useToast } from '../../components';
import { paymentService } from '../../services/paymentService';
import type { Payment } from '../../types/payment';
import { extractApiErrorMessage } from '../../utils/apiError';
import { formatIDR } from '../../utils/exportUtils';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Verifikasi',
  completed: 'Selesai',
  failed: 'Gagal',
  voided: 'Dibatalkan',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  voided: 'bg-gray-100 text-gray-600',
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tunai',
  bank_transfer: 'Transfer Bank',
  card: 'Kartu',
  e_wallet: 'E-Wallet',
  qris: 'QRIS',
  other: 'Lainnya',
};

export default function CustomerPaymentHistory() {
  const { error: showError } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getCustomerPembayaran();
      setPayments(data);
    } catch (err: unknown) {
      showError(extractApiErrorMessage(err, 'Gagal memuat riwayat pembayaran.'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Pembayaran"
        subtitle="Semua pembayaran yang pernah Anda lakukan"
      />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCardIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Belum ada riwayat pembayaran</p>
            <p className="text-xs text-gray-400 mt-1">Pembayaran yang Anda lakukan akan muncul di sini</p>
            <Link
              to="/customer/invoices"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Lihat Tagihan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">No. Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Metode</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Jumlah</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">No. Referensi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(p.paymentDate || p.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {p.invoiceNumber ? (
                        <Link
                          to={`/customer/invoices/${p.invoiceId}`}
                          className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {p.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="font-mono text-gray-500">{p.invoiceId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatIDR(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
              {payments.length} pembayaran ditemukan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
