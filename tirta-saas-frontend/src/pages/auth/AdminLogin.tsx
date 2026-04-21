import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginAsync } from '../../store/slices/authSlice';
import type { LoginCredentials } from '../../services/authService';

const schema = yup.object({
  email: yup
    .string()
    .email('Masukkan alamat email yang valid')
    .required('Email wajib diisi'),
  password: yup
    .string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
});

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Success message from RegisterAccount redirect
  const successMessage = (location.state as { message?: string })?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: (location.state as { email?: string })?.email || '',
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    if (isLoading) return;

    try {
      const result = await dispatch(loginAsync(data)).unwrap();

      const user = result.user;

      // If user has no tenant yet → go to setup-tenant page
      if (!user?.tenant_id) {
        if (user.role == "platform_owner") {
          navigate('/admin');
          return;
        }
        navigate('/setup-tenant');
        return;
      }

      // If tenant is EXPIRED or INACTIVE (status from backend) → show modal
      const expiredStatuses = ['EXPIRED', 'INACTIVE'];
      if (user?.tenant_status && expiredStatuses.includes(user.tenant_status.toUpperCase())) {
        setShowTrialExpiredModal(true);
        return;
      }

      // Also check trial_ends_at date as fallback
      if (user?.trial_ends_at) {
        const trialEnd = new Date(user.trial_ends_at);
        if (new Date() > trialEnd) {
          setShowTrialExpiredModal(true);
          return;
        }
      }

      navigate('/admin');
    } catch {
      // Error is handled by Redux slice
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Trial Expired Modal — FEATURE-3 */}
      {showTrialExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Masa Trial Anda Telah Habis</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Masa trial gratis 14 hari Anda sudah berakhir. Untuk melanjutkan penggunaan Tirta SaaS,
              silakan berlangganan salah satu paket kami.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/admin/subscription/upgrade')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
              >
                Lihat Paket Berlangganan
              </button>
              <button
                onClick={() => setShowTrialExpiredModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masuk ke panel admin Tirta SaaS
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Alamat Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Masukkan email Anda"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Kata Sandi
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Masukkan kata sandi Anda"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Lupa password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Pelanggan?{' '}
              <Link to="/customer/login" className="font-medium text-blue-600 hover:text-blue-500">
                Login di sini
              </Link>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Daftar di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
