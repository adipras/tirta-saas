import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { tenantUserService } from '../../services/tenantUserService';
import type { TenantUser, RoleOption } from '../../services/tenantUserService';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

interface EditUserModalProps {
  user: TenantUser;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role,
  });
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await tenantUserService.getAvailableRoles();
      setRoles(data);
    } catch { /* abaikan */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role) {
      setError('Nama dan peran wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await tenantUserService.updateTenantUser(user.id, formData);
      toast.success('Pengguna berhasil diperbarui!');
      onSuccess();
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal memperbarui pengguna');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-600 bg-opacity-50 p-4 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 id="edit-user-modal-title" className="text-lg font-semibold text-gray-900">
            Ubah Pengguna
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup modal"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (hanya baca)
            </label>
            <input
              id="edit-email"
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              aria-describedby="edit-email-hint"
            />
            <p id="edit-email-hint" className="text-xs text-gray-500 mt-1">
              Email tidak dapat diubah
            </p>
          </div>

          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nama lengkap"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
              Peran <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="edit-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Mengubah peran akan segera memperbarui izin akses pengguna
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" role="note">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Untuk mereset kata sandi, hapus pengguna ini dan buat ulang dengan email yang sama, atau hubungi administrator sistem.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {loading ? 'Memperbarui...' : 'Perbarui Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
