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
  PageHeader,
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

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  TRIAL: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trial' },
  PENDING_PAYMENT: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Menunggu Pembayaran',
  },
  PENDING_VERIFICATION: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    label: 'Menunggu Verifikasi',
  },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dinonaktifkan' },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Berakhir' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Tidak Aktif' },
};

const subscriptionStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pembayaran Terverifikasi' },
  PENDING_VERIFICATION: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Menunggu Verifikasi Pembayaran',
  },
  ACTIVE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Langganan Aktif' },
  TRIAL: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Trial' },
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
    } catch  {
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
    } catch  {
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
    } catch  {
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
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getSubscriptionStatusBadge = (status?: string) => {
    if (!status) {
      return <span className="text-xs text-gray-400">Belum ada</span>;
    }

    const config = subscriptionStatusColors[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}
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
          <p className="font-medium text-gray-900">{tenant.name}</p>
          <p className="text-xs text-gray-500">{tenant.village_code}</p>
        </div>
      ),
    },
    {
      key: 'admin_name',
      label: 'Admin',
      hideOnMobile: true,
      render: (_, tenant) => (
        <div className="min-w-0">
          <p className="text-sm text-gray-900">{tenant.admin_name}</p>
          <p className="text-xs text-gray-500">{tenant.admin_email}</p>
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
      render: (value) => formatDate(String(value)),
    },
    {
      key: 'ends_at',
      label: 'Berakhir',
      render: (_, tenant) => formatDate(getEndDate(tenant)),
    },
  ];

  const modalTitle = {
    view: 'Detail Tenant',
    approve: 'Aktivasi Tenant',
    activate: 'Aktifkan Tenant',
    suspend: 'Nonaktifkan Tenant',
  }[modalAction];

  const tabButtonClass = (tab: TabType) =>
    `inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
      activeTab === tab
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Tenant"
        subtitle="Kelola tenant pending, tenant aktif, dan kesiapan langganannya dari satu alur yang lebih nyaman di mobile."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardStatCard
          title="Tenant Menunggu"
          value={tenantStats.pending_tenants.toLocaleString('id-ID')}
          helper="Butuh tindak lanjut"
          subtitle="Tenant yang masih menunggu aktivasi atau verifikasi."
          icon={ClockIcon}
          tone="yellow"
        />
        <DashboardStatCard
          title="Tenant Aktif"
          value={tenantStats.active_tenants.toLocaleString('id-ID')}
          helper="Sudah berjalan"
          subtitle="Tenant yang sudah dapat beroperasi normal di platform."
          icon={CheckCircleIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Total Tenant"
          value={tenantStats.total_tenants.toLocaleString('id-ID')}
          helper="Seluruh tenant"
          subtitle="Gabungan tenant aktif, trial, pending, dan nonaktif."
          icon={BuildingOfficeIcon}
          tone="blue"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-gray-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Daftar tenant</h2>
              <p className="mt-1 text-sm text-gray-500">
                Gunakan tab untuk fokus ke tenant yang perlu aksi segera.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-100 p-1">
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
            <div className="flex flex-wrap justify-end gap-2">
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
      </section>

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
            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-700">Tenant</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">{selectedTenant.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{selectedTenant.village_code}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedTenant.status)}
                  {getSubscriptionStatusBadge(selectedTenant.subscription_status)}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-900">Informasi organisasi</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="mt-1 text-gray-900">{selectedTenant.email || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Telepon</dt>
                    <dd className="mt-1 text-gray-900">{selectedTenant.phone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Alamat</dt>
                    <dd className="mt-1 text-gray-900">{selectedTenant.address || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Terdaftar</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(selectedTenant.registered_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Berakhir</dt>
                    <dd className="mt-1 text-gray-900">{formatDate(getEndDate(selectedTenant))}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-900">Administrator tenant</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Nama</dt>
                    <dd className="mt-1 text-gray-900">{selectedTenant.admin_name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="mt-1 text-gray-900">{selectedTenant.admin_email || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Telepon</dt>
                    <dd className="mt-1 text-gray-900">{selectedTenant.admin_phone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Paket langganan</dt>
                    <dd className="mt-1 text-gray-900">{selectedTenant.subscription_plan || '-'}</dd>
                  </div>
                </dl>
              </div>
            </section>

            {modalAction !== 'view' && modalAction !== 'activate' && (
              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <label htmlFor={actionReasonId} className="block text-sm font-semibold text-gray-900">
                  {modalAction === 'approve'
                    ? 'Catatan aktivasi (opsional)'
                    : 'Alasan penonaktifan tenant'}
                </label>
                <textarea
                  id={actionReasonId}
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder={
                    modalAction === 'approve'
                      ? 'Tambahkan catatan untuk tenant ini bila diperlukan.'
                      : 'Jelaskan alasan tenant dinonaktifkan.'
                  }
                  required={modalAction === 'suspend'}
                />
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
                  disabled={isSubmitting || (modalAction === 'suspend' && !actionReason.trim())}
                  className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto ${
                    modalAction === 'approve' || modalAction === 'activate'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
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
