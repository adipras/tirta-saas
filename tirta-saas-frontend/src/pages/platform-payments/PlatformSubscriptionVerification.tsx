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
  PageHeader,
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
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terverifikasi' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
    };
    const { bg, text, label } = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const config = {
      BASIC: { bg: 'bg-blue-100', text: 'text-blue-800' },
      PRO: { bg: 'bg-purple-100', text: 'text-purple-800' },
      ENTERPRISE: { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    const { bg, text } = config[plan as keyof typeof config] || config.BASIC;

    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>
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
          <p className="font-medium text-gray-900">
            {payment.tenant?.organizationName || 'Tenant tidak tersedia'}
          </p>
          <p className="text-xs text-gray-500">{payment.tenant?.villageCode || '-'}</p>
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
        <span className="font-semibold text-gray-900">{formatCurrency(Number(value))}</span>
      ),
    },
    {
      key: 'billingPeriod',
      label: 'Periode',
      hideOnMobile: true,
      render: (value) => formatBillingPeriod(Number(value)),
    },
    {
      key: 'paymentDate',
      label: 'Tanggal Bayar',
      render: (value) => formatDate(String(value)),
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
      <PageHeader
        title="Verifikasi Pembayaran Langganan Tenant"
        subtitle="Validasi bukti transfer tenant dengan tampilan list dan detail yang lebih nyaman di layar kecil."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Perlu Verifikasi"
          value={paymentStats.pending.toLocaleString('id-ID')}
          helper="Prioritas utama"
          subtitle="Pembayaran baru yang masih menunggu keputusan."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Terverifikasi"
          value={paymentStats.verified.toLocaleString('id-ID')}
          helper="Sudah aman"
          subtitle="Pembayaran yang sudah lolos verifikasi platform."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Ditolak"
          value={paymentStats.rejected.toLocaleString('id-ID')}
          helper="Butuh tindak lanjut tenant"
          subtitle="Pembayaran yang perlu diajukan ulang oleh tenant."
          icon={XCircleIcon}
          tone="purple"
        />
      </div>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cari tenant atau kode desa
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Contoh: Tirta Maju atau KDG01"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="w-full lg:max-w-[220px]">
            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Semua status</option>
              <option value="pending">Menunggu</option>
              <option value="verified">Terverifikasi</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <DataTable
          data={filteredPayments}
          columns={columns}
          loading={loading}
          searchable={false}
          emptyMessage="Belum ada pembayaran langganan yang cocok dengan filter saat ini."
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
                  <p className="text-sm font-medium text-blue-700">Tenant</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    {selectedPayment.tenant?.organizationName || 'Tenant tidak tersedia'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
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
                    <dt className="text-gray-500">Periode</dt>
                    <dd className="mt-1 text-gray-900">
                      {formatBillingPeriod(selectedPayment.billingPeriod)}
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
                      {formatDate(selectedPayment.createdAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-900">Detail transfer</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Metode pembayaran</dt>
                    <dd className="mt-1 text-gray-900 capitalize">
                      {selectedPayment.paymentMethod.replace('_', ' ')}
                    </dd>
                  </div>
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
                      <dt className="text-gray-500">Catatan tenant</dt>
                      <dd className="mt-1 text-gray-900">{selectedPayment.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">Bukti pembayaran</p>
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                {isProofLoading ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                ) : proofError ? (
                  <div className="text-center text-sm text-red-600">{proofError}</div>
                ) : !proofPreviewUrl ? (
                  <div className="text-center text-sm text-gray-500">
                    Preview bukti pembayaran tidak tersedia.
                  </div>
                ) : isPdfProof ? (
                  <div className="text-center">
                    <DocumentIcon className="mx-auto mb-2 h-16 w-16 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-600">Dokumen PDF</p>
                    <a
                      href={proofPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <label className="block text-sm font-semibold text-gray-900">
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
                  className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder={
                    modalAction === 'verify'
                      ? 'Tambahkan catatan verifikasi bila diperlukan.'
                      : 'Jelaskan alasan pembayaran ini ditolak.'
                  }
                  required={modalAction === 'reject'}
                />
                {modalAction === 'verify' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Setelah diverifikasi, tenant dapat dilanjutkan ke proses aktivasi.
                  </p>
                )}
              </section>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                Batal
              </button>
              {modalAction !== 'view' && (
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isSubmitting || (modalAction === 'reject' && !rejectionReason.trim())}
                  className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto ${
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
