import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DataTable, type Column } from '../../components/DataTable';
import paymentProofService, { type PaymentProof } from '../../services/paymentProofService';
import {
  DashboardStatCard,
  FormTextarea,
  Modal,
  PageHeader,
  useToast,
} from '../../components';

type PendingPayment = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  accountNumber: string;
  accountName: string;
  referenceNumber: string;
  proofUrl: string;
  submittedAt: string;
  notes?: string;
  snapshotSubTotal: number;
  snapshotPenaltyAmount: number;
  snapshotTotalAmount: number;
  snapshotRemainingAmount: number;
  snapshotCapturedAt: string;
  status: 'pending' | 'verified' | 'rejected';
};

const mapProofToPayment = (proof: PaymentProof): PendingPayment => ({
  id: proof.id,
  invoiceNumber: proof.invoice_number,
  customerName: proof.customer_name,
  amount: proof.amount,
  paymentDate: proof.payment_date,
  paymentMethod: proof.payment_method,
  accountNumber: proof.account_number || '',
  accountName: proof.account_name,
  referenceNumber: proof.reference_number || '',
  proofUrl: proof.proof_image_url,
  submittedAt: proof.submitted_at,
  notes: proof.notes,
  snapshotSubTotal: proof.snapshot_sub_total,
  snapshotPenaltyAmount: proof.snapshot_penalty_amount,
  snapshotTotalAmount: proof.snapshot_total_amount,
  snapshotRemainingAmount: proof.snapshot_remaining_amount,
  snapshotCapturedAt: proof.snapshot_captured_at,
  status:
    proof.status === 'VERIFIED' ? 'verified' : proof.status === 'REJECTED' ? 'rejected' : 'pending',
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatPaymentMethod = (paymentMethod: string) =>
  paymentMethod
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isPdfProof = (url: string) => url.toLowerCase().endsWith('.pdf');

const getStatusBadge = (status: PendingPayment['status']) => {
  const config = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
    verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terverifikasi' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
  };

  const { bg, text, label } = config[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

export default function TenantPaymentVerification() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'verify' | 'reject' | 'view'>('view');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPendingPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await paymentProofService.getPaymentProofs();
      setPayments(result.payment_proofs.map(mapProofToPayment));
    } catch {
      setError('Daftar verifikasi pembayaran belum bisa dimuat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPendingPayments();
  }, [loadPendingPayments]);

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return payments;
    }

    return payments.filter(
      (payment) =>
        payment.customerName.toLowerCase().includes(normalizedSearch) ||
        payment.invoiceNumber.toLowerCase().includes(normalizedSearch)
    );
  }, [payments, searchTerm]);

  const pendingCount = payments.filter((payment) => payment.status === 'pending').length;
  const verifiedCount = payments.filter((payment) => payment.status === 'verified').length;
  const rejectedCount = payments.filter((payment) => payment.status === 'rejected').length;
  const totalShownAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const openModal = (payment: PendingPayment, action: 'verify' | 'reject' | 'view') => {
    setSelectedPayment(payment);
    setModalAction(action);
    setNotes('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
    setNotes('');
  };

  const handleAction = async () => {
    if (!selectedPayment) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalAction === 'verify') {
        await paymentProofService.verifyPaymentProof(selectedPayment.id, { notes });
      } else if (modalAction === 'reject') {
        await paymentProofService.rejectPaymentProof(selectedPayment.id, {
          rejection_reason: notes,
        });
      }

      const nextStatus = modalAction === 'verify' ? 'verified' : 'rejected';
      setPayments((current) =>
        current.map((payment) =>
          payment.id === selectedPayment.id ? { ...payment, status: nextStatus } : payment
        )
      );
      toast.success(
        modalAction === 'verify'
          ? 'Pembayaran berhasil diverifikasi.'
          : 'Pembayaran berhasil ditolak.'
      );
      closeModal();
    } catch {
      toast.error('Aksi gagal. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle =
    modalAction === 'view'
      ? 'Detail Pembayaran'
      : modalAction === 'verify'
        ? 'Verifikasi Pembayaran'
        : 'Tolak Pembayaran';

  const columns: Column<PendingPayment>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice',
      sortable: true,
    },
    {
      key: 'customerName',
      label: 'Pelanggan',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Nominal',
      sortable: true,
      align: 'right',
      render: (_value, payment) => formatCurrency(payment.amount),
    },
    {
      key: 'paymentDate',
      label: 'Tanggal Bayar',
      sortable: true,
      render: (_value, payment) => formatDate(payment.paymentDate),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value, payment) => getStatusBadge(payment.status),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Pembayaran"
        subtitle="Periksa bukti bayar pelanggan, pantau status verifikasi, dan tindak lanjuti pembayaran yang masih menunggu."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Menunggu Verifikasi"
          value={loading ? '...' : pendingCount.toLocaleString('id-ID')}
          helper="Perlu tindakan admin"
          subtitle="Jumlah pembayaran yang masih membutuhkan verifikasi atau penolakan."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Terverifikasi"
          value={loading ? '...' : verifiedCount.toLocaleString('id-ID')}
          helper="Sudah selesai"
          subtitle="Pembayaran pelanggan yang telah berhasil diverifikasi."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Ditolak"
          value={loading ? '...' : rejectedCount.toLocaleString('id-ID')}
          helper="Butuh tindak lanjut"
          subtitle="Pembayaran yang ditolak dan perlu diperbaiki pelanggan."
          icon={XCircleIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Nominal Tampil"
          value={loading ? '...' : formatCurrency(totalShownAmount)}
          helper={searchTerm ? 'Daftar sedang difilter' : 'Daftar aktif'}
          subtitle="Akumulasi nominal dari pembayaran yang sedang tampil pada daftar."
          icon={DocumentIcon}
          tone="blue"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Cari pembayaran</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Gunakan nama pelanggan atau nomor invoice untuk mempersempit daftar verifikasi.
            </p>
          </div>
          {searchTerm && (
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Filter aktif
            </span>
          )}
        </div>

        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pelanggan atau nomor invoice"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void loadPendingPayments()}
                className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <DataTable
          data={filteredPayments}
          columns={columns}
          actions={(payment) => (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => openModal(payment, 'view')}
                className="inline-flex items-center justify-center rounded-lg p-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                title="Lihat detail pembayaran"
                aria-label="Lihat detail pembayaran"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              {payment.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => openModal(payment, 'verify')}
                    className="inline-flex items-center justify-center rounded-lg p-2.5 text-green-600 hover:bg-green-50 hover:text-green-800"
                    title="Verifikasi pembayaran"
                    aria-label="Verifikasi pembayaran"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal(payment, 'reject')}
                    className="inline-flex items-center justify-center rounded-lg p-2.5 text-red-600 hover:bg-red-50 hover:text-red-800"
                    title="Tolak pembayaran"
                    aria-label="Tolak pembayaran"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada pembayaran yang cocok dengan pencarian saat ini."
        />
      </section>

      <Modal
        isOpen={showModal && Boolean(selectedPayment)}
        onClose={closeModal}
        title={modalTitle}
        size="xl"
        mobileFullscreen
        bodyClassName="space-y-6"
      >
        {selectedPayment && (
          <>
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-700">Pembayaran pelanggan</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    {selectedPayment.customerName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">Invoice {selectedPayment.invoiceNumber}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-900">Ringkasan pembayaran</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Nominal</dt>
                    <dd className="mt-1 font-semibold text-blue-600">
                      {formatCurrency(selectedPayment.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Tanggal bayar</dt>
                    <dd className="mt-1 text-gray-900">
                      {formatDate(selectedPayment.paymentDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Tanggal submit</dt>
                    <dd className="mt-1 text-gray-900">
                      {formatDate(selectedPayment.submittedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Metode pembayaran</dt>
                    <dd className="mt-1 text-gray-900">
                      {formatPaymentMethod(selectedPayment.paymentMethod)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-900">Snapshot nominal saat customer submit</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Subtotal</dt>
                    <dd className="mt-1 text-gray-900">{formatCurrency(selectedPayment.snapshotSubTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Denda beku</dt>
                    <dd className="mt-1 text-gray-900">{formatCurrency(selectedPayment.snapshotPenaltyAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Total tagihan beku</dt>
                    <dd className="mt-1 font-semibold text-blue-600">
                      {formatCurrency(selectedPayment.snapshotTotalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Sisa tagihan saat submit</dt>
                    <dd className="mt-1 text-gray-900">
                      {formatCurrency(selectedPayment.snapshotRemainingAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Snapshot diambil</dt>
                    <dd className="mt-1 text-gray-900">
                      {formatDate(selectedPayment.snapshotCapturedAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:col-span-2">
                <h4 className="text-sm font-semibold text-gray-900">Detail transfer</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Nama rekening</dt>
                    <dd className="mt-1 text-gray-900">{selectedPayment.accountName || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Nomor rekening</dt>
                    <dd className="mt-1 text-gray-900">{selectedPayment.accountNumber || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Nomor referensi</dt>
                    <dd className="mt-1 text-gray-900">
                      {selectedPayment.referenceNumber || '-'}
                    </dd>
                  </div>
                  {selectedPayment.notes && (
                    <div>
                      <dt className="text-gray-500">Catatan pelanggan</dt>
                      <dd className="mt-1 text-gray-900">{selectedPayment.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Approval admin akan memakai nominal snapshot yang dibekukan saat customer submit.
              Waktu approval tidak menghitung ulang denda.
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Bukti pembayaran</p>
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                {!selectedPayment.proofUrl ? (
                  <div className="text-center text-sm text-gray-500">
                    Bukti pembayaran tidak tersedia.
                  </div>
                ) : isPdfProof(selectedPayment.proofUrl) ? (
                  <div className="text-center">
                    <DocumentIcon className="mx-auto h-14 w-14 text-gray-400" />
                    <a
                      href={selectedPayment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Buka File PDF
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <img
                      src={selectedPayment.proofUrl}
                      alt="Bukti pembayaran"
                      className="mx-auto max-h-[28rem] rounded-xl border border-gray-200 object-contain"
                    />
                    <div className="text-center">
                      <a
                        href={selectedPayment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Buka gambar penuh
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {modalAction !== 'view' && (
              <FormTextarea
                label={modalAction === 'verify' ? 'Catatan verifikasi' : 'Alasan penolakan'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={
                  modalAction === 'verify'
                    ? 'Tambahkan catatan verifikasi bila diperlukan'
                    : 'Tulis alasan penolakan pembayaran'
                }
                required={modalAction === 'reject'}
                helperText={
                  modalAction === 'verify'
                    ? 'Opsional, tetapi berguna sebagai catatan admin.'
                    : 'Wajib diisi agar pelanggan tahu perbaikan yang diperlukan.'
                }
              />
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
              >
                Batal
              </button>
              {modalAction !== 'view' && (
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isSubmitting || (modalAction === 'reject' && !notes.trim())}
                  className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
                    modalAction === 'verify'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmitting
                    ? 'Memproses...'
                    : modalAction === 'verify'
                      ? 'Verifikasi Pembayaran'
                      : 'Tolak Pembayaran'}
                </button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
