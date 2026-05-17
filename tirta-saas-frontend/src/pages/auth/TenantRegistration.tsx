import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { CloudArrowUpIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
    } catch  {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              Tirta SaaS - Pendaftaran Tenant
            </h1>
            <p className="text-blue-100 text-center mt-2">
              Daftarkan organisasi Anda dan mulai masa trial 14 hari
            </p>
          </div>

          <div className="px-8 py-8">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Organization Information */}
              <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Informasi Organisasi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Organisasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('organization_name')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., RT 01 RW 05 Kelurahan Sejahtera"
                    />
                    {errors.organization_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.organization_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kode Wilayah <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('village_code')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., RT01RW05"
                    />
                    {errors.village_code && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.village_code.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 081234567890"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., rt01rw05@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('address')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Alamat lengkap organisasi Anda"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Tenant
                    </label>
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
                      {logoPreviewUrl ? (
                        <div className="relative inline-block">
                          <img
                            src={logoPreviewUrl}
                            alt="Logo preview"
                            className="h-24 w-24 rounded-lg object-cover"
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
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400" />
                          <label htmlFor="tenant-logo-upload" className="mt-2 inline-block cursor-pointer">
                            <span className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
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
                          <p className="mt-1 text-xs text-gray-500">
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informasi Administrator
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Admin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('admin_name')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Budi Santoso"
                    />
                    {errors.admin_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.admin_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Admin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('admin_email')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., budi@example.com"
                    />
                    {errors.admin_email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.admin_email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon Admin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('admin_phone')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 081234567890"
                    />
                    {errors.admin_phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.admin_phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('admin_password')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="Minimal 6 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.admin_password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.admin_password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konfirmasi Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirm_password')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="Ulangi password Anda"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirm_password.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trial Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  🎉 Trial Gratis 14 Hari
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Akses penuh ke fitur inti platform</li>
                  <li>✓ Tidak perlu kartu kredit</li>
                  <li>✓ Pendaftaran akan direview oleh platform owner</li>
                  <li>✓ Tenant bisa langsung mulai menyiapkan sistem</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4">
                <Link
                  to="/admin/login"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Sudah punya akun? Masuk
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Sedang mendaftar...' : 'Daftar Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>
            Dengan mendaftar, Anda menyetujui{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Syarat Layanan
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Kebijakan Privasi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantRegistration;
