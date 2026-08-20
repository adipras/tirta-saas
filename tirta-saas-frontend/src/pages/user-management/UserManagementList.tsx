import { useCallback, useEffect, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { tenantUserService } from '../../services/tenantUserService';
import type { TenantUser } from '../../services/tenantUserService';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import { ConfirmModal, DataTable, type Column } from '../../components';
import { DashboardStatCard } from '../../components';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

const ROLE_CONFIG: Record<string, { ring: string; bg: string; text: string; label: string }> = {
  tenant_admin: { ring: 'ring-brand-200/60', bg: 'bg-brand-50', text: 'text-brand-700', label: 'Admin' },
  meter_reader: { ring: 'ring-info-200/60', bg: 'bg-info-50', text: 'text-info-700', label: 'Pembaca Meter' },
  finance: { ring: 'ring-success-200/60', bg: 'bg-success-50', text: 'text-success-700', label: 'Keuangan' },
  service: { ring: 'ring-warning-200/60', bg: 'bg-warning-50', text: 'text-warning-700', label: 'Layanan' },
};

export default function UserManagementList() {
  const toast = useToast();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const hasActiveFilters = searchTerm !== '' || filterRole !== '';

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterRole('');
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tenantUserService.getTenantUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: unknown) {
      toast.error(extractApiErrorMessage(err, 'Gagal memuat data pengguna'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRole) {
      filtered = filtered.filter((user) => user.role === filterRole);
    }
    setFilteredUsers(filtered);
  }, [filterRole, searchTerm, users]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadUsers();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const handleEdit = (user: TenantUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (userId: string) => {
    setDeleteTarget(userId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tenantUserService.deleteTenantUser(deleteTarget);
      loadUsers();
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(extractApiErrorMessage(err, 'Gagal menghapus pengguna'));
    }
  };

  const getRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role] || { ring: 'ring-surface-200/60', bg: 'bg-surface-50', text: 'text-surface-600', label: role };

    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${config.ring} ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const columns: Column<TenantUser>[] = [
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      render: (_value, user) => (
        <span className="font-medium text-surface-800">{user.name}</span>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      render: (_value, user) => (
        <span className="text-surface-600">{user.username}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (_value, user) => <span className="text-surface-400">{user.email || '-'}</span>,
    },
    {
      key: 'role',
      label: 'Peran',
      sortable: true,
      render: (_value, user) => getRoleBadge(user.role),
    },
    {
      key: 'created_at',
      label: 'Dibuat',
      sortable: true,
      render: (_value, user) => (
        <span className="text-surface-400">{user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}</span>
      ),
    },
  ];

  const actions = (user: TenantUser) => (
    <>
      <button
        onClick={() => handleEdit(user)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-brand-600 transition-colors hover:bg-brand-50"
        title="Ubah pengguna"
        aria-label={`Ubah pengguna ${user.name}`}
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(user.id)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-danger-600 transition-colors hover:bg-danger-50"
        title="Hapus pengguna"
        aria-label={`Hapus pengguna ${user.name}`}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </>
  );

  const meterReaderCount = users.filter((u) => u.role === 'meter_reader').length;
  const financeCount = users.filter((u) => u.role === 'finance').length;
  const serviceCount = users.filter((u) => u.role === 'service').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Manajemen Pengguna</h1>
          <p className="mt-1 text-[13px] text-surface-400">
            Kelola pengguna operasional (pembaca meter, keuangan, layanan)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary self-start"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Pengguna
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total Pengguna"
          value={loading ? '...' : users.length.toLocaleString('id-ID')}
          subtitle="Semua pengguna operasional"
          icon={UserGroupIcon}
          tone="blue"
        />
        <DashboardStatCard
          title="Pembaca Meter"
          value={loading ? '...' : meterReaderCount.toLocaleString('id-ID')}
          subtitle="Petugas lapangan"
          icon={UserGroupIcon}
          tone="cyan"
        />
        <DashboardStatCard
          title="Keuangan"
          value={loading ? '...' : financeCount.toLocaleString('id-ID')}
          subtitle="Tim keuangan"
          icon={UserGroupIcon}
          tone="green"
        />
        <DashboardStatCard
          title="Layanan"
          value={loading ? '...' : serviceCount.toLocaleString('id-ID')}
          subtitle="Tim layanan pelanggan"
          icon={UserGroupIcon}
          tone="purple"
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-300" aria-hidden="true" />
            <label htmlFor="search-pengguna" className="sr-only">Cari pengguna</label>
            <input
              id="search-pengguna"
              type="text"
              placeholder="Cari nama, username, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          <div>
            <label htmlFor="filter-peran" className="sr-only">Filter berdasarkan peran</label>
            <select
              id="filter-peran"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-base"
            >
              <option value="">Semua Peran</option>
              <option value="meter_reader">Pembaca Meter</option>
              <option value="finance">Keuangan</option>
              <option value="service">Layanan</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div>
              <button
                onClick={handleClearFilters}
                className="btn-secondary"
              >
                <XMarkIcon className="h-4 w-4" />
                Hapus Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <DataTable
          data={filteredUsers}
          columns={columns}
          actions={actions}
          searchable={false}
          loading={loading}
          emptyMessage="Tidak ada pengguna yang ditemukan"
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus User"
        message="Apakah kamu yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
