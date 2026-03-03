import { useState, useEffect } from 'react';
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
import { PageHeader, ConfirmModal } from '../../components';

export default function UserManagementList() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const hasActiveFilters = searchTerm !== '' || filterRole !== '';

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRole) {
      filtered = filtered.filter((user) => user.role === filterRole);
    }
    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, users]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterRole('');
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tenantUserService.getTenantUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { bg: string; text: string; label: string }> = {
      tenant_admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
      meter_reader: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Meter Reader' },
      finance: { bg: 'bg-green-100', text: 'text-green-800', label: 'Finance' },
      service: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Service' },
    };

    const config = roleConfig[role] || { bg: 'bg-gray-100', text: 'text-gray-800', label: role };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage operational users (meter reader, finance, service)"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Users</p>
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
              <p className="text-sm text-gray-600">Meter Readers</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'meter_reader').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">F</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Finance</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'finance').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-sm font-bold">S</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Service</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'service').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              <option value="meter_reader">Meter Reader</option>
              <option value="finance">Finance</option>
              <option value="service">Service</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
