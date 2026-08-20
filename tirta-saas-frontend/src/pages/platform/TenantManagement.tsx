import { useCallback, useEffect, useState } from 'react';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../constants/api';
import { apiClient } from '../../services/apiClient';
import {
  ActionIconButton,
  DashboardStatCard,
  DataTable,
  Modal,
  type Column,
  useToast,
} from '../../components';

interface Tenant {
  id: string;
  name: string;
  village_code: string;
  email: string;
  phone: string;
  address: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  status: string;
  subscription_status?: string;
  registered_at: string;
  trial_ends_at?: string;
  payment_verified_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  subscription_plan?: string;
  subscription_starts_at?: string;
  subscription_ends_at?: string;
}

interface TenantManagementStats {
  pending_tenants: number;
  active_tenants: number;
  total_tenants: number;
}

type TabType = 'pending' | 'all';
type ModalAction = 'approve' | 'activate' | 'suspend' | 'view';

const statusColors: Record<string, { ring: string; bg: string; text: string; label: string }> = {
  TRIAL: { ring: 'ring-brand-200/60', bg: 'bg-brand-50', text: 'text-brand-700', label: 'Trial' },
  PENDING_PAYMENT: {
    ring: 'ring-warning-200/60',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Menunggu Pembayaran',
  },
  PENDING_VERIFICATION: {
    ring: 'ring-warning-200/60',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Menunggu Verifikasi',
  },
  ACTIVE: { ring: 'ring-success-200/60', bg: 'bg-success-50', text: 'text-success-700', label: 'Aktif' },
  SUSPENDED: { ring: 'ring-danger-200/60', bg: 'bg-danger-50', text: 'text-danger-700', label: 'Dinonaktifkan' },
  EXPIRED: { ring: 'ring-surface-200/60', bg: 'bg-surface-50', text: 'text-surface-500', label: 'Berakhir' },
  INACTIVE: { ring: 'ring-surface-200/60', bg: 'bg-surface-50', text: 'text-surface-500', label: 'Tidak Aktif' },
};

const subscriptionStatusColors: Record<string, { ring: string; bg: string; text: string; label: string }> = {
  VERIFIED: { ring: 'ring-success-200/60', bg: 'bg-success-50', text: 'text-success-700', label: 'Pembayaran Terverifikasi' },
  PENDING_VERIFICATION: {
    ring: 'ring-warning-200/60',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Menunggu Verifikasi Pembayaran',
  },
  ACTIVE: { ring: 'ring-brand-200/60', bg: 'bg-brand-50', text: 'text-brand-700', label: 'Langganan Aktif' },
  TRIAL: { ring: 'ring-surface-200/60', bg: 'bg-surface-50', text: 'text-surface-500', label: 'Trial' },
};

const TenantManagement = () => {
  const actionReasonId = 'tenant-action-reason';
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantStats, setTenantStats] = useState<TenantManagementStats>({
    pending_tenants: 0,
    active_tenants: 0,
    total_tenants: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction>('view');
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTenants = useCallback(async () => {
    setIsLoading(true);

    try {
      const endpoint =
        activeTab === 'pending'
          ? API_ENDPOINTS.PLATFORM.PENDING_TENANTS
          : API_ENDPOINTS.PLATFORM.TENANTS;
      const response = await apiClient.get(endpoint);
      setTenants(response.data || []);
    } catch {
      toast.error('Gagal memuat data tenant.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toast]);

  const loadTenantStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ data?: TenantManagementStats }>(
        API_ENDPOINTS.PLATFORM.TENANT_STATS
      );

      setTenantStats(
        response.data ?? {
          pending_tenants: 0,
          active_tenants: 0,
          total_tenants: 0,
        }
      );
    } catch {
      toast.error('Gagal memuat ringkasan tenant.');
    }
  }, [toast]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    void loadTenantStats();
  }, [loadTenantStats]);

  const openModal = (tenant: Tenant, action: ModalAction) => {
    setSelectedTenant(tenant);
    setModalAction(action);
    setActionReason('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTenant(null);
    setActionReason('');
  };

  const handleAction = async () => {
    if (!selectedTenant) {
      return;
    }

    let endpoint = '';
    let payload: Record<string, string> = {};

    switch (modalAction) {
      case 'approve':
        endpoint = `/platform/tenants/${selectedTenant.id}/approve`;
        payload = actionReason.trim() ? { notes: actionReason.trim() } : {};
        break;
      case 'activate':
        endpoint = `/platform/tenants/${selectedTenant.id}/activate`;
        break;
      case 'suspend':
        endpoint = `/platform/tenants/${selectedTenant.id}/suspend`;
        payload = { reason: actionReason.trim() };
        break;
      default:
        return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post(endpoint, payload);

      if (modalAction === 'activate') {
        toast.success('Tenant berhasil diaktifkan kembali.');
      } else if (modalAction === 'suspend') {
        toast.success('Tenant berhasil dinonaktifkan.');
      } else if (modalAction === 'approve') {
        toast.success('Tenant berhasil diaktifkan setelah pembayaran terverifikasi.');
      }

      await Promise.all([loadTenants(), loadTenantStats()]);
      closeModal();
    } catch {
      toast.error('Aksi tenant gagal. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return '-';
    }

    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEndDate = (tenant: Tenant) => {
    if (tenant.subscription_status === 'ACTIVE') {
      return tenant.subscription_ends_at;
    }

    return tenant.trial_ends_at;
  };

  const getStatusBadge = (status: string) => {
    const config = statusColors[status] || statusColors.INACTIVE;

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${config.ring} ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    if (!status) {
      return <span className="text-[12px] text-surface-400">Belum ada</span>;
    }

    const config = subscriptionStatusColors[status] || {
      ring: 'ring-surface-200/60',
      bg: 'bg-surface-50',
      text: 'text-surface-500',
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${config.ring} ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const canApproveTenant = (tenant: Tenant) =>
    tenant.status === 'PENDING_VERIFICATION' && tenant.subscription_status === 'VERIFIED';

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      label: 'Organisasi',
      render: (_, tenant) => (
        <div className="min-w-0">
          <p className="font-medium text-surface-800">{tenant.name}</p>
          <p className="text-[12px] text-surface-400">{tenant.village_code}</p>
        </div>
      ),
    },
    {
      key: 'admin_name',
      label: 'Admin',
      hideOnMobile: true,
      render: (_, tenant) => (
        <div className="min-w-0">
          <p className="text-[13px] text-surface-600">{tenant.admin_name}</p>
          <p className="text-[12px] text-surface-400">{tenant.admin_email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Tenant',
      render: (value) => getStatusBadge(String(value)),
    },
    {
      key: 'subscription_status',
      label: 'Status Pembayaran',
      render: (value) => getSubscriptionStatusBadge(value as string | undefined),
    },
    {
      key: 'registered_at',
      label: 'Terdaftar',
      hideOnMobile: true,
      render: (value) => <span className="text-surface-400">{formatDate(String(value))}</span>,
    },
    {
      key: 'ends_at',
      label: 'Berakhir',
      render: (_, tenant) => <span className="text-surface-400">{formatDate(getEndDate(tenant))}</span>,
    },
  ];

  const modalTitle = {
    view: 'Detail Tenant',
    approve: 'Aktivasi Tenant',
    activate: 'Aktifkan Tenant',
    suspend: 'Nonaktifkan Tenant',
  }[modalAction];

  const tabButtonClass = (tab: TabType) =>
    `inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-medium transition ${
      activeTab === tab
        ? 'btn-primary'
        : 'btn-secondary'
    }`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Manajemen Tenant</h1>
        <p className="mt-1 text-[13px] text-surface-400">
          Kelola tenant pending, aktif, dan kesiapan langganannya dari satu alur.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Tenant Menunggu"
          value={tenantStats.pending_tenants.toLocaleString('id-ID')}
          helper="Butuh tindak lanjut"
          subtitle="Tenant menunggu aktivasi atau verifikasi."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Tenant Aktif"
          value={tenantStats.active_tenants.toLocaleString('id-ID')}
          helper="Sudah berjalan"
          subtitle="Tenant yang sudah beroperasi normal."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total Tenant"
          value={tenantStats.total_tenants.toLocaleString('id-ID')}
          helper="Seluruh tenant"
          subtitle="Gabungan semua status tenant."
          icon={BuildingOfficeIcon}
          tone="blue"
        />
      </div>

      {/* Table Section */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-100 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-surface-800">Daftar tenant</h2>
              <p className="mt-0.5 text-[13px] text-surface-400">
                Gunakan tab untuk fokus ke tenant yang perlu aksi segera.
              </p>
            </div>
            <div className="rounded-xl bg-surface-100 p-1 self-start">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={tabButtonClass('pending')}
                >
                  Menunggu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={tabButtonClass('all')}
                >
                  Semua
                </button>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          data={tenants}
          columns={columns}
          loading={isLoading}
          searchable={false}
          emptyMessage={
            activeTab === 'pending'
              ? 'Belum ada tenant yang menunggu tindak lanjut.'
              : 'Belum ada tenant yang terdaftar.'
          }
          actions={(tenant) => (
            <div className="flex flex-wrap justify-end gap-1.5">
              <ActionIconButton
                icon={EyeIcon}
                label={`Lihat detail tenant ${tenant.name}`}
                tone="blue"
                variant="ghost"
                onClick={() => openModal(tenant, 'view')}
              />
              {canApproveTenant(tenant) && (
                <ActionIconButton
                  icon={CheckCircleIcon}
                  label={`Aktivasi tenant ${tenant.name}`}
                  tone="green"
                  variant="ghost"
                  onClick={() => openModal(tenant, 'approve')}
                />
              )}
              {tenant.status === 'ACTIVE' && (
                <ActionIconButton
                  icon={XCircleIcon}
                  label={`Nonaktifkan tenant ${tenant.name}`}
                  tone="orange"
                  variant="ghost"
                  onClick={() => openModal(tenant, 'suspend')}
                />
              )}
              {tenant.status === 'SUSPENDED' && (
                <ActionIconButton
                  icon={CheckCircleIcon}
                  label={`Aktifkan tenant ${tenant.name}`}
                  tone="emerald"
                  variant="ghost"
                  onClick={() => openModal(tenant, 'activate')}
                />
              )}
            </div>
          )}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal && Boolean(selectedTenant)}
        onClose={closeModal}
        title={modalTitle}
        size="xl"
        mobileFullscreen
        bodyClassName="space-y-6"
      >
        {selectedTenant && (
          <>
            <section className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-brand-600">Tenant</p>
                  <h3 className="mt-1 text-lg font-semibold text-surface-800">{selectedTenant.name}</h3>
                  <p className="mt-0.5 text-[13px] text-surface-500">{selectedTenant.village_code}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedTenant.status)}
                  {getSubscriptionStatusBadge(selectedTenant.subscription_status)}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-surface-100 bg-white p-4">
                <h4 className="text-[13px] font-semibold text-surface-800">Informasi organisasi</h4>
                <dl className="mt-4 space-y-3 text-[13px]">
                  {[
                    { label: 'Email', value: selectedTenant.email },
                    { label: 'Telepon', value: selectedTenant.phone },
                    { label: 'Alamat', value: selectedTenant.address },
                    { label: 'Terdaftar', value: formatDate(selectedTenant.registered_at) },
                    { label: 'Berakhir', value: formatDate(getEndDate(selectedTenant)) },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-surface-400">{item.label}</dt>
                      <dd className="mt-0.5 text-surface-700">{item.value || '-'}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-surface-100 bg-white p-4">
                <h4 className="text-[13px] font-semibold text-surface-800">Administrator tenant</h4>
                <dl className="mt-4 space-y-3 text-[13px]">
                  {[
                    { label: 'Nama', value: selectedTenant.admin_name },
                    { label: 'Email', value: selectedTenant.admin_email },
                    { label: 'Telepon', value: selectedTenant.admin_phone },
                    { label: 'Paket langganan', value: selectedTenant.subscription_plan },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-surface-400">{item.label}</dt>
                      <dd className="mt-0.5 text-surface-700">{item.value || '-'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            {modalAction !== 'view' && modalAction !== 'activate' && (
              <section className="rounded-xl border border-surface-100 bg-white p-4">
                <label htmlFor={actionReasonId} className="block text-[13px] font-semibold text-surface-800">
                  {modalAction === 'approve'
                    ? 'Catatan aktivasi (opsional)'
                    : 'Alasan penonaktifan tenant'}
                </label>
                <textarea
                  id={actionReasonId}
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  rows={4}
                  className="input-base mt-2"
                  placeholder={
                    modalAction === 'approve'
                      ? 'Tambahkan catatan untuk tenant ini bila diperlukan.'
                      : 'Jelaskan alasan tenant dinonaktifkan.'
                  }
                  required={modalAction === 'suspend'}
                />
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
                  disabled={isSubmitting || (modalAction === 'suspend' && !actionReason.trim())}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition disabled:opacity-50 ${
                    modalAction === 'approve' || modalAction === 'activate'
                      ? 'bg-success-600 hover:bg-success-700'
                      : 'bg-warning-600 hover:bg-warning-700'
                  }`}
                >
                  {isSubmitting
                    ? 'Memproses...'
                    : modalAction === 'approve'
                      ? 'Aktivasi Tenant'
                      : modalAction === 'activate'
                        ? 'Aktifkan Tenant'
                        : 'Nonaktifkan Tenant'}
                </button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default TenantManagement;
