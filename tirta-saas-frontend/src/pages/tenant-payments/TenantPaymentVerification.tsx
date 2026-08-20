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

const STATUS_CONFIG = {
  pending: { ring: 'ring-warning-200/60', bg: 'bg-warning-50', text: 'text-warning-700', label: 'Menunggu' },
  verified: { ring: 'ring-success-200/60', bg: 'bg-success-50', text: 'text-success-700', label: 'Terverifikasi' },
  rejected: { ring: 'ring-danger-200/60', bg: 'bg-danger-50', text: 'text-danger-700', label: 'Ditolak' },
};

const getStatusBadge = (status: PendingPayment['status']) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${config.ring} ${config.bg} ${config.text}`}>
      {config.label}
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
      render: (_value, payment) => (
        <span className="font-medium text-surface-800">{payment.invoiceNumber}</span>
      ),
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
      render: (_value, payment) => (
        <span className="font-semibold text-brand-600">{formatCurrency(payment.amount)}</span>
      ),
    },
    {
      key: 'paymentDate',
      label: 'Tanggal Bayar',
      sortable: true,
      render: (_value, payment) => (
        <span className="text-surface-400">{formatDate(payment.paymentDate)}</span>
      ),
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
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Verifikasi Pembayaran</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Periksa bukti bayar pelanggan, pantau status verifikasi, dan tindak lanjuti pembayaran yang masih menunggu.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Menunggu Verifikasi"
          value={loading ? '...' : pendingCount.toLocaleString('id-ID')}
          helper="Perlu tindakan admin"
          subtitle="Pembayaran yang masih membutuhkan verifikasi."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Terverifikasi"
          value={loading ? '...' : verifiedCount.toLocaleString('id-ID')}
          helper="Sudah selesai"
          subtitle="Pembayaran yang berhasil diverifikasi."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Ditolak"
          value={loading ? '...' : rejectedCount.toLocaleString('id-ID')}
          helper="Butuh tindak lanjut"
          subtitle="Pembayaran yang ditolak."
          icon={XCircleIcon}
          tone="purple"
        />
        <DashboardStatCard
          title="Nominal Tampil"
          value={loading ? '...' : formatCurrency(totalShownAmount)}
          helper={searchTerm ? 'Difilter' : 'Daftar aktif'}
          subtitle="Akumulasi nominal dari pembayaran yang tampil."
          icon={DocumentIcon}
          tone="blue"
        />
      </div>

      {/* Search */}
      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-surface-800">Cari pembayaran</h2>
            <p className="mt-0.5 text-[13px] text-surface-400">
              Gunakan nama pelanggan atau nomor invoice untuk mempersempit daftar.
            </p>
          </div>
          {searchTerm && (
            <span className="inline-flex w-fit rounded-full bg-brand-50 px-3 py-1 text-[12px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200/60">
              Filter aktif
            </span>
          )}
        </div>

        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pelanggan atau nomor invoice"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base pl-10"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void loadPendingPayments()}
                className="btn-primary self-start"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          data={filteredPayments}
          columns={columns}
          actions={(payment) => (
            <div className="flex flex-wrap justify-end gap-1.5">
              <button
                type="button"
                onClick={() => openModal(payment, 'view')}
                className="rounded-lg p-2 text-brand-600 transition-colors hover:bg-brand-50"
                title="Lihat detail pembayaran"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              {payment.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => openModal(payment, 'verify')}
                    className="rounded-lg p-2 text-success-600 transition-colors hover:bg-success-50"
                    title="Verifikasi pembayaran"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal(payment, 'reject')}
                    className="rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50"
                    title="Tolak pembayaran"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada pembayaran yang cocok dengan pencarian saat ini."
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal && Boolean(selectedPayment)}
        onClose={closeModal}
        title={modalTitle}
        size="xl"
        mobileFullscreen
        bodyClassName="space-y-5"
      >
        {selectedPayment && (
          <>
            <section className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-brand-600">Pembayaran pelanggan</p>
                  <h3 className="mt-1 text-lg font-semibold text-surface-800">
                    {selectedPayment.customerName}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-surface-500">Invoice {selectedPayment.invoiceNumber}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-surface-100 bg-white p-4">
                <h4 className="text-[13px] font-semibold text-surface-800">Ringkasan pembayaran</h4>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div>
                    <dt className="text-surface-400">Nominal</dt>
                    <dd className="mt-0.5 font-semibold text-brand-600">{formatCurrency(selectedPayment.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Tanggal bayar</dt>
                    <dd className="mt-0.5 text-surface-700">{formatDate(selectedPayment.paymentDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Tanggal submit</dt>
                    <dd className="mt-0.5 text-surface-700">{formatDate(selectedPayment.submittedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Metode pembayaran</dt>
                    <dd className="mt-0.5 text-surface-700">{formatPaymentMethod(selectedPayment.paymentMethod)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-surface-100 bg-white p-4">
                <h4 className="text-[13px] font-semibold text-surface-800">Snapshot nominal saat customer submit</h4>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div>
                    <dt className="text-surface-400">Subtotal</dt>
                    <dd className="mt-0.5 text-surface-700">{formatCurrency(selectedPayment.snapshotSubTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Denda beku</dt>
                    <dd className="mt-0.5 text-surface-700">{formatCurrency(selectedPayment.snapshotPenaltyAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Total tagihan beku</dt>
                    <dd className="mt-0.5 font-semibold text-brand-600">{formatCurrency(selectedPayment.snapshotTotalAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Sisa tagihan saat submit</dt>
                    <dd className="mt-0.5 text-surface-700">{formatCurrency(selectedPayment.snapshotRemainingAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Snapshot diambil</dt>
                    <dd className="mt-0.5 text-surface-700">{formatDate(selectedPayment.snapshotCapturedAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-surface-100 bg-white p-4 lg:col-span-2">
                <h4 className="text-[13px] font-semibold text-surface-800">Detail transfer</h4>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div>
                    <dt className="text-surface-400">Nama rekening</dt>
                    <dd className="mt-0.5 text-surface-700">{selectedPayment.accountName || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Nomor rekening</dt>
                    <dd className="mt-0.5 text-surface-700">{selectedPayment.accountNumber || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Nomor referensi</dt>
                    <dd className="mt-0.5 text-surface-700">{selectedPayment.referenceNumber || '-'}</dd>
                  </div>
                  {selectedPayment.notes && (
                    <div>
                      <dt className="text-surface-400">Catatan pelanggan</dt>
                      <dd className="mt-0.5 text-surface-700">{selectedPayment.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            <section className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-[13px] text-warning-700">
              Approval admin akan memakai nominal snapshot yang dibekukan saat customer submit.
              Waktu approval tidak menghitung ulang denda.
            </section>

            <section className="rounded-xl border border-surface-100 bg-white p-4">
              <p className="text-[13px] font-semibold text-surface-800">Bukti pembayaran</p>
              <div className="mt-3 rounded-xl border border-dashed border-surface-200 bg-surface-50 p-4">
                {!selectedPayment.proofUrl ? (
                  <div className="text-center text-[13px] text-surface-400">
                    Bukti pembayaran tidak tersedia.
                  </div>
                ) : isPdfProof(selectedPayment.proofUrl) ? (
                  <div className="text-center">
                    <DocumentIcon className="mx-auto h-14 w-14 text-surface-300" />
                    <a
                      href={selectedPayment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary mt-3"
                    >
                      Buka File PDF
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <img
                      src={selectedPayment.proofUrl}
                      alt="Bukti pembayaran"
                      className="mx-auto max-h-[28rem] rounded-xl border border-surface-200 object-contain"
                    />
                    <div className="text-center">
                      <a
                        href={selectedPayment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
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

            <div className="flex flex-col-reverse gap-3 border-t border-surface-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="btn-secondary"
              >
                Batal
              </button>
              {modalAction !== 'view' && (
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isSubmitting || (modalAction === 'reject' && !notes.trim())}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50 ${
                    modalAction === 'verify'
                      ? 'bg-success-600 hover:bg-success-700'
                      : 'bg-danger-600 hover:bg-danger-700'
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
