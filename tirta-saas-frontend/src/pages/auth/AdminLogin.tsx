import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginAsync } from '../../store/slices/authSlice';
import { Modal } from '../../components';

const schema = yup.object({
  identifier: yup
    .string()
    .trim()
    .required('Username atau email wajib diisi'),
  password: yup
    .string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
});

type AdminLoginFormData = yup.InferType<typeof schema>;

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const successMessage = (location.state as { message?: string })?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      identifier: (location.state as { identifier?: string })?.identifier || '',
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    if (isLoading) return;

    try {
      const result = await dispatch(loginAsync({ identifier: data.identifier, password: data.password })).unwrap();
      const user = result.user;

      if (!user?.tenant_id) {
        if (user.role == "platform_owner") {
          navigate('/admin');
          return;
        }
        navigate('/setup-tenant');
        return;
      }

      const expiredStatuses = ['EXPIRED', 'INACTIVE'];
      if (user?.tenant_status && expiredStatuses.includes(user.tenant_status.toUpperCase())) {
        setShowTrialExpiredModal(true);
        return;
      }

      if (user?.trial_ends_at) {
        const trialEnd = new Date(user.trial_ends_at);
        if (new Date() > trialEnd) {
          setShowTrialExpiredModal(true);
          return;
        }
      }

      navigate('/admin');
    } catch {
      // Error handled by Redux slice
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      {/* Trial Expired Modal */}
      <Modal isOpen={showTrialExpiredModal} onClose={() => setShowTrialExpiredModal(false)} size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-50 ring-1 ring-danger-100">
              <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />
            </div>
            <h3 className="text-base font-semibold text-surface-900">Masa Trial Telah Habis</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-surface-600">
            Masa trial gratis 14 hari Anda sudah berakhir. Untuk melanjutkan penggunaan Tirta SaaS,
            silakan berlangganan salah satu paket kami.
          </p>
          <div className="flex flex-col-reverse gap-3 pt-2">
            <button
              onClick={() => setShowTrialExpiredModal(false)}
              className="btn-secondary"
            >
              Kembali
            </button>
            <button
              onClick={() => navigate('/admin/subscription/upgrade')}
              className="btn-primary"
            >
              Lihat Paket Berlangganan
            </button>
          </div>
        </div>
      </Modal>

      <div className="relative max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-surface-900 tracking-tight">
            Login Admin
          </h2>
          <p className="mt-2 text-[13px] text-surface-400">
            Masuk ke panel admin Tirta SaaS
          </p>
        </div>

        {/* Form card */}
        <div className="card p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-success-50 border border-success-200 p-3 text-[13px] text-success-700">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-200 p-3 text-[13px] text-danger-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Username atau Email
              </label>
              <input
                {...register('identifier')}
                type="text"
                autoComplete="username"
                className="input-base"
                placeholder="Masukkan username atau email"
              />
              {errors.identifier && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-surface-700">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input-base pr-10"
                  placeholder="Masukkan kata sandi"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[12px] text-danger-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/20"
                />
                <span className="text-[13px] text-surface-600">Ingat saya</span>
              </label>
              <a href="#" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 space-y-2 border-t border-surface-100 pt-5 text-center">
            <p className="text-[13px] text-surface-500">
              Pelanggan?{' '}
              <Link to="/customer/login" className="font-medium text-brand-600 hover:text-brand-700">
                Login di sini
              </Link>
            </p>
            <p className="text-[13px] text-surface-500">
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
