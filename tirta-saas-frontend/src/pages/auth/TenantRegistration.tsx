import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import {
  CloudArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { tenantRegistrationService } from '../../services/tenantRegistrationService';

const schema = yup.object({
  organization_name: yup
    .string()
    .required('Nama organisasi wajib diisi')
    .min(3, 'Nama organisasi minimal 3 karakter'),
  village_code: yup
    .string()
    .required('Kode wilayah wajib diisi')
    .min(3, 'Kode wilayah minimal 3 karakter')
    .max(20, 'Kode wilayah maksimal 20 karakter'),
  address: yup.string().required('Alamat wajib diisi'),
  phone: yup.string().required('Nomor telepon wajib diisi'),
  email: yup
    .string()
    .email('Masukkan alamat email yang valid')
    .required('Email wajib diisi'),
  admin_name: yup
    .string()
    .required('Nama admin wajib diisi')
    .min(3, 'Nama admin minimal 3 karakter'),
  admin_email: yup
    .string()
    .email('Masukkan alamat email yang valid')
    .required('Email admin wajib diisi'),
  admin_phone: yup.string().required('Nomor telepon admin wajib diisi'),
  admin_password: yup
    .string()
    .required('Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
  confirm_password: yup
    .string()
    .required('Konfirmasi password wajib diisi')
    .oneOf([yup.ref('admin_password')], 'Konfirmasi password harus sama'),
});

interface RegistrationForm {
  organization_name: string;
  village_code: string;
  address: string;
  phone: string;
  email: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  admin_password: string;
  confirm_password: string;
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Pendaftaran gagal. Silakan coba lagi.';
};

const TenantRegistration = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationForm>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      setLogoFile(null);
      setLogoPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Logo tenant harus berupa file gambar.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran logo tenant maksimal 5MB.');
      event.target.value = '';
      return;
    }

    setErrorMessage('');

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = async (data: RegistrationForm) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const registrationData = {
        organization_name: data.organization_name,
        village_code: data.village_code,
        address: data.address,
        phone: data.phone,
        email: data.email,
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        admin_phone: data.admin_phone,
        admin_password: data.admin_password,
      };
      const result = await tenantRegistrationService.register({
        ...registrationData,
        logo: logoFile,
      });

      setSuccessMessage(
        result.message ||
          'Pendaftaran berhasil. Masa trial Anda sudah dimulai dan akun admin bisa langsung digunakan untuk masuk.'
      );

      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/30 to-surface-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <BuildingOffice2Icon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Tirta SaaS
              </h1>
            </div>
            <p className="text-brand-100 text-center text-[13px]">
              Pendaftaran Tenant — Daftarkan organisasi Anda dan mulai masa trial 14 hari
            </p>
          </div>

          <div className="px-8 py-8">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl border border-success-200 bg-success-50">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-success-800">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl border border-danger-200 bg-danger-50">
                <div className="flex items-start gap-2">
                  <XMarkIcon className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-danger-800">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Organization Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg bg-brand-50 p-2">
                    <BuildingOffice2Icon className="h-4 w-4 text-brand-600" />
                  </div>
                  <h2 className="text-base font-semibold text-surface-900">Informasi Organisasi</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Nama Organisasi <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('organization_name')}
                      className="input-base"
                      placeholder="Contoh: RT 01 RW 05 Kelurahan Sejahtera"
                    />
                    {errors.organization_name && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.organization_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Kode Wilayah <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('village_code')}
                      className="input-base"
                      placeholder="Contoh: RT01RW05"
                    />
                    {errors.village_code && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.village_code.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Nomor Telepon <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input-base"
                      placeholder="Contoh: 081234567890"
                    />
                    {errors.phone && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Email <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="input-base"
                      placeholder="Contoh: rt01rw05@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Alamat <span className="text-danger-500">*</span>
                    </label>
                    <textarea
                      {...register('address')}
                      rows={3}
                      className="input-base"
                      placeholder="Alamat lengkap organisasi Anda"
                    />
                    {errors.address && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-surface-700 mb-2">
                      Logo Tenant
                    </label>
                    <div className="rounded-xl border-2 border-dashed border-surface-200 p-4">
                      {logoPreviewUrl ? (
                        <div className="relative inline-block">
                          <img
                            src={logoPreviewUrl}
                            alt="Logo preview"
                            className="h-24 w-24 rounded-xl object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (logoPreviewUrl) {
                                URL.revokeObjectURL(logoPreviewUrl);
                              }
                              setLogoFile(null);
                              setLogoPreviewUrl(null);
                            }}
                            className="absolute -right-2 -top-2 rounded-full bg-danger-500 p-1 text-white hover:bg-danger-600 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <CloudArrowUpIcon className="mx-auto h-10 w-10 text-surface-300" />
                          <label htmlFor="tenant-logo-upload" className="mt-2 inline-block cursor-pointer">
                            <span className="btn-primary text-[13px]">
                              Unggah Logo
                            </span>
                            <input
                              id="tenant-logo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleLogoChange}
                            />
                          </label>
                          <p className="mt-1.5 text-[12px] text-surface-400">
                            Opsional. Format JPG, PNG, GIF, atau WEBP, maksimal 5MB.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin User Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-lg bg-brand-50 p-2">
                    <UserIcon className="h-4 w-4 text-brand-600" />
                  </div>
                  <h2 className="text-base font-semibold text-surface-900">Informasi Administrator</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Nama Admin <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('admin_name')}
                      className="input-base"
                      placeholder="Contoh: Budi Santoso"
                    />
                    {errors.admin_name && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.admin_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Email Admin <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('admin_email')}
                      className="input-base"
                      placeholder="Contoh: budi@example.com"
                    />
                    {errors.admin_email && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.admin_email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Nomor Telepon Admin <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('admin_phone')}
                      className="input-base"
                      placeholder="Contoh: 081234567890"
                    />
                    {errors.admin_phone && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.admin_phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Password <span className="text-danger-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('admin_password')}
                        className="input-base pr-10"
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.admin_password && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.admin_password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-surface-700 mb-1.5">
                      Konfirmasi Password <span className="text-danger-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirm_password')}
                        className="input-base pr-10"
                        placeholder="Ulangi password Anda"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="mt-1.5 text-[12px] text-danger-600">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trial Information */}
              <div className="rounded-xl border border-info-200 bg-info-50 p-4">
                <h3 className="text-[13px] font-semibold text-info-900 mb-2">
                  🎉 Trial Gratis 14 Hari
                </h3>
                <ul className="text-[13px] text-info-800 space-y-1">
                  <li className="flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4 text-info-600" /> Akses penuh ke fitur inti platform</li>
                  <li className="flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4 text-info-600" /> Tidak perlu kartu kredit</li>
                  <li className="flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4 text-info-600" /> Pendaftaran akan direview oleh platform owner</li>
                  <li className="flex items-center gap-1.5"><CheckCircleIcon className="h-4 w-4 text-info-600" /> Tenant bisa langsung mulai menyiapkan sistem</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                <Link
                  to="/admin/login"
                  className="text-[13px] text-brand-600 hover:text-brand-500 font-medium"
                >
                  Sudah punya akun? Masuk
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sedang mendaftar...
                    </span>
                  ) : (
                    'Daftar Sekarang'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-surface-400 text-[13px]">
          <p>
            Dengan mendaftar, Anda menyetujui{' '}
            <a href="#" className="text-brand-600 hover:underline">
              Syarat Layanan
            </a>{' '}
            dan{' '}
            <a href="#" className="text-brand-600 hover:underline">
              Kebijakan Privasi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantRegistration;
