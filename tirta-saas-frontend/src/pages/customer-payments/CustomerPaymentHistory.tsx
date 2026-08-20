import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, DashboardStatCard, useToast } from '../../components';
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

const STATUS_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  pending: { bg: 'bg-warning-50', text: 'text-warning-700', ring: 'ring-warning-200' },
  completed: { bg: 'bg-success-50', text: 'text-success-700', ring: 'ring-success-200' },
  failed: { bg: 'bg-danger-50', text: 'text-danger-700', ring: 'ring-danger-200' },
  voided: { bg: 'bg-surface-50', text: 'text-surface-500', ring: 'ring-surface-200' },
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

  const completedCount = payments.filter((p) => p.status === 'completed').length;
  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadge = (status: string) => {
    const s = STATUS_CLASSES[status] || STATUS_CLASSES.pending;
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Pembayaran"
        subtitle="Semua pembayaran yang pernah Anda lakukan beserta status dan detailnya."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard
          title="Total Pembayaran"
          value={payments.length.toLocaleString('id-ID')}
          subtitle="Jumlah seluruh transaksi pembayaran."
          icon={CreditCardIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pembayaran Selesai"
          value={completedCount.toLocaleString('id-ID')}
          subtitle="Transaksi yang sudah terverifikasi."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total Dibayarkan"
          value={formatIDR(totalPaid)}
          subtitle="Akumulasi nominal yang sudah Anda bayar."
          icon={BanknotesIcon}
          tone="purple"
        />
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="rounded-xl bg-surface-50 p-8 text-center">
          <CreditCardIcon className="mx-auto h-10 w-10 text-surface-300" />
          <p className="mt-3 text-sm font-medium text-surface-600">Belum ada riwayat pembayaran</p>
          <p className="mt-1 text-[13px] text-surface-400">Pembayaran yang Anda lakukan akan muncul di sini.</p>
          <Link
            to="/customer/invoices"
            className="btn-primary mt-4 inline-flex"
          >
            <DocumentTextIcon className="h-4 w-4" />
            Lihat Tagihan
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="group flex flex-col gap-4 rounded-xl border border-surface-100 bg-surface-50/50 p-4 transition-all hover:border-surface-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
                  <CreditCardIcon className="h-5 w-5 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium text-surface-700">
                      {payment.invoiceNumber ? (
                        <Link
                          to={`/customer/invoices/${payment.invoiceId}`}
                          className="font-mono text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          {payment.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="font-mono text-surface-400">{payment.invoiceId.slice(0, 8)}…</span>
                      )}
                    </p>
                    {getStatusBadge(payment.status)}
                  </div>
                  <p className="mt-1 text-[13px] text-surface-500">
                    {METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-surface-400">
                    <span>{formatDate(payment.paymentDate || payment.createdAt)}</span>
                    {payment.referenceNumber && (
                      <>
                        <span className="text-surface-200">•</span>
                        <span className="font-mono">{payment.referenceNumber}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-base font-bold text-surface-900">{formatIDR(payment.amount)}</p>
              </div>
            </div>
          ))}

          <p className="text-[12px] text-surface-400">
            {payments.length} pembayaran ditemukan
          </p>
        </div>
      )}
    </div>
  );
}
