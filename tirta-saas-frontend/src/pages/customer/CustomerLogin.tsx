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
      // Error handled by Redux slice
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4 sm:p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-brand-500/20">
            <span className="text-xl font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Portal Pelanggan</h1>
          <p className="mt-1 text-[13px] text-surface-400">Sistem Manajemen Air Bersih</p>
        </div>

        {/* Form card */}
        <div className="card p-6 sm:p-8">
          <h2 className="mb-5 text-lg font-semibold text-surface-900">Masuk</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-200 p-3 text-[13px] text-danger-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Nomor Meter atau Email
              </label>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                value={formData.identifier || ''}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className="input-base"
                placeholder="MTR-001 atau pelanggan@contoh.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-surface-700">
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
                  className="input-base pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-5 border-t border-surface-100 pt-5 text-center text-[13px] text-surface-500">
            <p>Belum punya akun?</p>
            <p className="mt-1">Hubungi admin untuk pendaftaran</p>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-2 text-[13px]">
          <Link to="/" className="text-surface-500 hover:text-brand-600 transition-colors">
            Kembali ke Beranda
          </Link>
          <span className="text-surface-300">·</span>
          <Link to="/admin/login" className="text-surface-500 hover:text-brand-600 transition-colors">
            Masuk sebagai Admin
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
