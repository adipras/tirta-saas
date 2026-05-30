import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginAsync } from '../../store/slices/authSlice';
import type { LoginCredentials } from '../../services/authService';

const CustomerLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    identifier: '',
    password: '',
    portal: 'customer',
  });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      await dispatch(loginAsync(formData)).unwrap();
      navigate('/customer');
    } catch {
      // Kesalahan ditangani oleh Redux slice
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 shadow-lg">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-indigo-600 sm:text-4xl">Portal Pelanggan</h1>
          <p className="text-gray-600">Sistem Manajemen Air Bersih</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <h2 className="mb-6 text-2xl font-semibold text-gray-800">Masuk</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-gray-700">
                Nomor Meter atau Email
              </label>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                value={formData.identifier || ''}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Contoh: MTR-001 atau pelanggan@contoh.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Belum punya akun?</p>
            <p className="mt-1">Hubungi admin untuk pendaftaran</p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700">
            ← Kembali ke Beranda
          </Link>
          <span className="mx-2 text-gray-400">·</span>
          <Link to="/admin/login" className="text-sm text-indigo-600 hover:text-indigo-700">
            Masuk sebagai Admin
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
