import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { platformSubscriptionService } from '../../services/platformSubscriptionService';
import type { SubscriptionPayment } from '../../services/platformSubscriptionService';
import {
  DashboardStatCard,
  DataTable,
  Modal,
  type Column,
  useToast,
} from '../../components';

type ModalAction = 'verify' | 'reject' | 'view';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) {
      return response.data.error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const STATUS_CONFIG: Record<string, { ring: string; bg: string; text: string; label: string }> = {
  pending: { ring: 'ring-warning-200/60', bg: 'bg-warning-50', text: 'text-warning-700', label: 'Menunggu' },
  verified: { ring: 'ring-success-200/60', bg: 'bg-success-50', text: 'text-success-700', label: 'Terverifikasi' },
  rejected: { ring: 'ring-danger-200/60', bg: 'bg-danger-50', text: 'text-danger-700', label: 'Ditolak' },
};

const PLAN_CONFIG: Record<string, { ring: string; bg: string; text: string }> = {
  BASIC: { ring: 'ring-brand-200/60', bg: 'bg-brand-50', text: 'text-brand-700' },
  PRO: { ring: 'ring-purple-200/60', bg: 'bg-purple-50', text: 'text-purple-700' },
  ENTERPRISE: { ring: 'ring-warning-200/60', bg: 'bg-warning-50', text: 'text-warning-700' },
};

export default function PlatformSubscriptionVerification() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPayment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction>('view');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [proofContentType, setProofContentType] = useState('');
  const [isProofLoading, setIsProofLoading] = useState(false);
  const [proofError, setProofError] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const statusFilter = filterStatus === 'all' ? undefined : filterStatus;
      const data = await platformSubscriptionService.getSubscriptionPembayaran(statusFilter);
      setPayments(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat pembayaran langganan tenant.'));
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (!showModal || !selectedPayment?.proofUrl) {
      return;
    }

    let active = true;
    let objectUrl = '';

    const loadProofPreview = async () => {
      try {
        setIsProofLoading(true);
        setProofError('');
        setProofPreviewUrl('');
        setProofContentType('');

        const blob = await platformSubscriptionService.getPaymentProofBlob(selectedPayment.proofUrl);

        if (!active) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setProofPreviewUrl(objectUrl);
        setProofContentType(blob.type || '');
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setProofError(getErrorMessage(err, 'Gagal memuat bukti pembayaran.'));
      } finally {
        if (active) {
          setIsProofLoading(false);
        }
      }
    };

    void loadProofPreview();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [showModal, selectedPayment?.id, selectedPayment?.proofUrl]);

  const openModal = (payment: SubscriptionPayment, action: ModalAction) => {
    setSelectedPayment(payment);
    setModalAction(action);
    setNotes('');
    setRejectionReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
    setNotes('');
    setRejectionReason('');
    setProofPreviewUrl('');
    setProofContentType('');
    setProofError('');
  };

  const handleAction = async () => {
    if (!selectedPayment) {
      return;
    }

    if (modalAction === 'reject' && !rejectionReason.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (modalAction === 'verify') {
        await platformSubscriptionService.verifyPayment(selectedPayment.id, { notes: notes.trim() });
        toast.success('Pembayaran diverifikasi. Tenant siap diaktifkan dari menu Tenant.');
      } else if (modalAction === 'reject') {
        await platformSubscriptionService.rejectPayment(selectedPayment.id, {
          reason: rejectionReason.trim(),
        });
        toast.success('Pembayaran ditolak dan tenant sudah menerima status terbaru.');
      }

      await loadPayments();
      closeModal();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Aksi pembayaran gagal. Silakan coba lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const formatBillingPeriod = (billingPeriod: number) => `${billingPeriod} bulan`;

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${config.ring} ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.BASIC;
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${config.ring} ${config.bg} ${config.text}`}>
        {plan}
      </span>
    );
  };

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return payments;
    }

    return payments.filter((payment) => {
      const organizationName = payment.tenant?.organizationName?.toLowerCase() || '';
      const villageCode = payment.tenant?.villageCode?.toLowerCase() || '';

      return (
        organizationName.includes(normalizedSearch) || villageCode.includes(normalizedSearch)
      );
    });
  }, [payments, searchTerm]);

  const paymentStats = useMemo(
    () => ({
      pending: payments.filter((payment) => payment.status === 'pending').length,
      verified: payments.filter((payment) => payment.status === 'verified').length,
      rejected: payments.filter((payment) => payment.status === 'rejected').length,
    }),
    [payments]
  );

  const columns: Column<SubscriptionPayment>[] = [
    {
      key: 'tenant',
      label: 'Tenant',
      render: (_, payment) => (
        <div className="min-w-0">
          <p className="font-medium text-surface-800">
            {payment.tenant?.organizationName || 'Tenant tidak tersedia'}
          </p>
          <p className="text-[12px] text-surface-400">{payment.tenant?.villageCode || '-'}</p>
        </div>
      ),
    },
    {
      key: 'subscriptionPlan',
      label: 'Paket',
      render: (value) => getPlanBadge(String(value)),
    },
    {
      key: 'amount',
      label: 'Nominal',
      render: (value) => (
        <span className="font-semibold text-brand-600">{formatCurrency(Number(value))}</span>
      ),
    },
    {
      key: 'billingPeriod',
      label: 'Periode',
      hideOnMobile: true,
      render: (value) => <span className="text-surface-500">{formatBillingPeriod(Number(value))}</span>,
    },
    {
      key: 'paymentDate',
      label: 'Tanggal Bayar',
      render: (value) => <span className="text-surface-400">{formatDate(String(value))}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(String(value)),
    },
  ];

  const isPdfProof =
    proofContentType.includes('pdf') ||
    Boolean(selectedPayment?.proofUrl && selectedPayment.proofUrl.toLowerCase().endsWith('.pdf'));

  const modalTitle = {
    view: 'Detail Pembayaran Langganan',
    verify: 'Verifikasi Pembayaran',
    reject: 'Tolak Pembayaran',
  }[modalAction];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Verifikasi Pembayaran Langganan Tenant</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Validasi bukti transfer tenant dengan tampilan list dan detail yang lebih nyaman.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Perlu Verifikasi"
          value={paymentStats.pending.toLocaleString('id-ID')}
          helper="Prioritas utama"
          subtitle="Pembayaran baru yang masih menunggu."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Terverifikasi"
          value={paymentStats.verified.toLocaleString('id-ID')}
          helper="Sudah aman"
          subtitle="Pembayaran yang lolos verifikasi."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Ditolak"
          value={paymentStats.rejected.toLocaleString('id-ID')}
          helper="Butuh tindak lanjut tenant"
          subtitle="Pembayaran yang perlu diajukan ulang."
          icon={XCircleIcon}
          tone="purple"
        />
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="label-base">Cari tenant atau kode desa</label>
            <div className="relative mt-1.5">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
              <input
                type="text"
                placeholder="Contoh: Tirta Maju atau KDG01"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="input-base pl-10"
              />
            </div>
          </div>
          <div className="w-full lg:max-w-[220px]">
            <label className="label-base">Status</label>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="input-base mt-1.5"
            >
              <option value="all">Semua status</option>
              <option value="pending">Menunggu</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
            {error}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          data={filteredPayments}
          columns={columns}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada pembayaran langganan yang cocok dengan filter saat ini."
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
                  <p className="text-[13px] font-medium text-brand-600">Tenant</p>
                  <h3 className="mt-1 text-lg font-semibold text-surface-800">
                    {selectedPayment.tenant?.organizationName || 'Tenant tidak tersedia'}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-surface-500">
                    {selectedPayment.tenant?.villageCode || '-'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getPlanBadge(selectedPayment.subscriptionPlan)}
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
                    <dt className="text-surface-400">Periode</dt>
                    <dd className="mt-0.5 text-surface-700">{formatBillingPeriod(selectedPayment.billingPeriod)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Tanggal bayar</dt>
                    <dd className="mt-0.5 text-surface-700">{formatDate(selectedPayment.paymentDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-400">Tanggal submit</dt>
                    <dd className="mt-0.5 text-surface-700">{formatDate(selectedPayment.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-surface-100 bg-white p-4">
                <h4 className="text-[13px] font-semibold text-surface-800">Detail transfer</h4>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <div>
                    <dt className="text-surface-400">Metode pembayaran</dt>
                    <dd className="mt-0.5 text-surface-700 capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</dd>
                  </div>
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
                      <dt className="text-surface-400">Catatan tenant</dt>
                      <dd className="mt-0.5 text-surface-700">{selectedPayment.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            <section className="rounded-xl border border-surface-100 bg-white p-4">
              <p className="text-[13px] font-semibold text-surface-800">Bukti pembayaran</p>
              <div className="mt-3 rounded-xl border border-dashed border-surface-200 bg-surface-50 p-4">
                {isProofLoading ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
                  </div>
                ) : proofError ? (
                  <div className="text-center text-[13px] text-danger-600">{proofError}</div>
                ) : !proofPreviewUrl ? (
                  <div className="text-center text-[13px] text-surface-400">
                    Preview bukti pembayaran tidak tersedia.
                  </div>
                ) : isPdfProof ? (
                  <div className="text-center">
                    <DocumentIcon className="mx-auto mb-2 h-16 w-16 text-surface-300" />
                    <p className="mb-2 text-[13px] text-surface-500">Dokumen PDF</p>
                    <a
                      href={proofPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
                    >
                      Buka PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={proofPreviewUrl}
                    alt="Bukti pembayaran"
                    className="mx-auto max-h-96 rounded-xl object-contain"
                  />
                )}
              </div>
            </section>

            {modalAction !== 'view' && (
              <section className="rounded-xl border border-surface-100 bg-white p-4">
                <label className="text-[13px] font-semibold text-surface-800">
                  {modalAction === 'verify' ? 'Catatan verifikasi (opsional)' : 'Alasan penolakan'}
                </label>
                <textarea
                  value={modalAction === 'verify' ? notes : rejectionReason}
                  onChange={(event) =>
                    modalAction === 'verify'
                      ? setNotes(event.target.value)
                      : setRejectionReason(event.target.value)
                  }
                  rows={4}
                  className="input-base mt-2"
                  placeholder={
                    modalAction === 'verify'
                      ? 'Tambahkan catatan verifikasi bila diperlukan.'
                      : 'Jelaskan alasan pembayaran ini ditolak.'
                  }
                  required={modalAction === 'reject'}
                />
                {modalAction === 'verify' && (
                  <p className="mt-2 text-[12px] text-surface-400">
                    Setelah diverifikasi, tenant dapat dilanjutkan ke proses aktivasi.
                  </p>
                )}
              </section>
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
                  disabled={isSubmitting || (modalAction === 'reject' && !rejectionReason.trim())}
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
