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
import { PageHeader, ConfirmModal, DataTable, type Column } from '../../components';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

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
    const roleConfig: Record<string, { bg: string; text: string; label: string }> = {
      tenant_admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
      meter_reader: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pembaca Meter' },
      finance: { bg: 'bg-green-100', text: 'text-green-800', label: 'Keuangan' },
      service: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Layanan' },
    };

    const config = roleConfig[role] || { bg: 'bg-gray-100', text: 'text-gray-800', label: role };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const columns: Column<TenantUser>[] = [
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
    },
    {
      key: 'username',
      label: 'Username',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (_value, user) => user.email || '-',
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
      render: (_value, user) => user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-',
    },
  ];

  const actions = (user: TenantUser) => (
    <>
      <button
        onClick={() => handleEdit(user)}
        className="inline-flex items-center justify-center rounded-md p-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-900"
        title="Ubah pengguna"
        aria-label={`Ubah pengguna ${user.name}`}
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => handleDelete(user.id)}
        className="inline-flex items-center justify-center rounded-md p-2.5 text-red-600 hover:bg-red-50 hover:text-red-900"
        title="Hapus pengguna"
        aria-label={`Hapus pengguna ${user.name}`}
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Kelola pengguna operasional (pembaca meter, keuangan, layanan)"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Tambah Pengguna
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Pengguna</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-bold">M</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Pembaca Meter</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'meter_reader').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">K</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Keuangan</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'finance').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-sm font-bold">L</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Layanan</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'service').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <label htmlFor="search-pengguna" className="sr-only">Cari pengguna</label>
            <input
              id="search-pengguna"
              type="text"
              placeholder="Cari nama, username, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="filter-peran" className="sr-only">Filter berdasarkan peran</label>
            <select
              id="filter-peran"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 sm:w-auto"
              >
                <XMarkIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Hapus Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
