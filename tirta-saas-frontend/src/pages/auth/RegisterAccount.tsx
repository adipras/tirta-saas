import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { extractApiErrorMessage } from '../../utils/apiError';

type RegisterAccountFormValues = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const schema: yup.ObjectSchema<RegisterAccountFormValues> = yup.object({
  name: yup
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .required('Nama lengkap wajib diisi'),
  username: yup
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .required('Username wajib diisi'),
  email: yup
    .string()
    .default('')
    .trim()
    .test('email-optional', 'Format email tidak valid', (value) => !value || yup.string().email().isValidSync(value))
    .defined(),
  password: yup
    .string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Konfirmasi password tidak cocok')
    .required('Konfirmasi password wajib diisi'),
});

const RegisterAccount = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<RegisterAccountFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RegisterAccountFormValues) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER_ACCOUNT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          email: data.email ?? '',
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registrasi gagal');
      }

      navigate('/admin/login', {
        state: {
          message: 'Akun berhasil dibuat! Silakan login untuk melanjutkan setup tenant.',
          identifier: data.username,
        },
      });
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err, 'Terjadi kesalahan. Coba lagi.');
      if (message.toLowerCase().includes('username')) {
        setFieldError('username', { type: 'server', message });
      } else if (message.toLowerCase().includes('email')) {
        setFieldError('email', { type: 'server', message });
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-surface-900">
            Buat Akun
          </h2>
          <p className="mt-2 text-[13px] text-surface-500">
            Langkah 1 dari 2 — Daftar akun Anda
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className="input-base pl-10"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.name.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSymbolIcon className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  className="input-base pl-10"
                  placeholder="minimal 3 karakter"
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Email <span className="text-surface-400">(opsional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="input-base pl-10"
                  placeholder="contoh@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input-base pl-10 pr-10"
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-surface-400 hover:text-surface-600" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-surface-400 hover:text-surface-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-surface-700 mb-1.5">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-surface-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input-base pl-10 pr-10"
                  placeholder="Ulangi password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="h-4 w-4 text-surface-400 hover:text-surface-600" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-surface-400 hover:text-surface-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Membuat akun...
              </span>
            ) : (
              'Buat Akun'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-[13px] text-surface-500">
              Sudah punya akun?{' '}
              <Link to="/admin/login" className="font-medium text-brand-600 hover:text-brand-500">
                Login di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterAccount;
