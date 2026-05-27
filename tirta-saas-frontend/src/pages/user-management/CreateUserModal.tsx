import { useState, useEffect } from 'react';
import { XMarkIcon, KeyIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { tenantUserService } from '../../services/tenantUserService';
import type { RoleOption } from '../../services/tenantUserService';
import { useToast } from '../../components';
import { extractApiErrorMessage } from '../../utils/apiError';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: '',
  });
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; email: string; password: string } | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await tenantUserService.getAvailableRoles();
      setRoles(data);
      // Tetapkan peran default ke yang pertama
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, role: data[0].value }));
      }
    } catch { /* abaikan */ }
  };

  const handleGeneratePassword = () => {
    const password = tenantUserService.generatePassword();
    setFormData({ ...formData, password });
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.password || !formData.role) {
      setError('Nama, username, kata sandi, dan peran wajib diisi');
      return;
    }

    setLoading(true);
    setError('');
    setUsernameError('');

    try {
      await tenantUserService.createTenantUser(formData);
      setCreatedCredentials({ username: formData.username, email: formData.email, password: formData.password });
      onSuccess();
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Gagal membuat pengguna');
      if (message.toLowerCase().includes('username')) {
        setUsernameError(message);
      } else {
        setError(message);
      }
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
        aria-labelledby="create-user-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 id="create-user-modal-title" className="text-lg font-semibold text-gray-900">
            Tambah Pengguna Baru
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
          {createdCredentials && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-green-800">Pengguna berhasil dibuat!</p>
              </div>
              <p className="text-xs text-green-700 mb-2">Simpan kredensial ini dan bagikan dengan aman:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between bg-white rounded px-3 py-2 border border-green-200">
                  <span className="text-xs text-gray-600">Username: <strong>{createdCredentials.username}</strong></span>
                </div>
                <div className="flex items-center justify-between bg-white rounded px-3 py-2 border border-green-200">
                  <span className="text-xs text-gray-600">Email: <strong>{createdCredentials.email || '-'}</strong></span>
                </div>
                <div className="flex items-center justify-between bg-white rounded px-3 py-2 border border-green-200">
                  <span className="text-xs text-gray-600">Kata Sandi: <strong className="font-mono">{createdCredentials.password}</strong></span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdCredentials.password)}
                    className="text-green-600 hover:text-green-800 ml-2"
                    aria-label="Salin kata sandi"
                    title="Salin kata sandi"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
              >
                Selesai
              </button>
            </div>
          )}

          {!createdCredentials && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm" role="alert">
              {error}
            </div>
          )}

          {!createdCredentials && (
          <>
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="create-name"
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
            <label htmlFor="create-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="create-username"
              type="text"
              value={formData.username}
              onChange={(e) => {
                setUsernameError('');
                setFormData({ ...formData, username: e.target.value });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="username_login"
              required
              autoComplete="username"
            />
            {usernameError && <p className="text-xs text-red-600 mt-1">{usernameError}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Digunakan untuk login. Pakai huruf kecil, angka, titik, underscore, atau dash.
            </p>
          </div>

          <div>
            <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (opsional)
            </label>
            <input
              id="create-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="pengguna@contoh.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 mb-1">
              Peran <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="create-role"
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
              Pilih peran yang menentukan izin akses pengguna
            </p>
          </div>

          <div>
            <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-1">
              Kata Sandi <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                aria-label="Buat kata sandi otomatis"
                title="Buat kata sandi otomatis"
              >
                <KeyIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimal 8 karakter. Klik ikon kunci untuk membuat kata sandi yang kuat secara otomatis.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3" role="note">
            <p className="text-sm text-yellow-800">
              <strong>Penting:</strong> Simpan kata sandi ini dan bagikan dengan aman kepada pengguna. Kata sandi tidak dapat dilihat kembali setelah halaman ini ditutup.
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
              {loading ? 'Membuat...' : 'Buat Pengguna'}
            </button>
          </div>
          </> )}
        </form>
      </div>
    </div>
  );
}
